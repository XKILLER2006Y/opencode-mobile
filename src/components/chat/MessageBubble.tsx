import { memo, useMemo } from "react"
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Markdown } from "../markdown"
import { ToolCallCard } from "./ToolCallCard"
import { ReasoningBlock } from "./ReasoningBlock"
import { useBatchedText } from "../../lib/use-batched-text.ts"
import type { Message, Part } from "../../lib/sdk"

const SCREEN_WIDTH = Dimensions.get("window").width

function isImageMime(mime?: string): boolean {
  return !!mime && mime.startsWith("image/")
}

interface Props {
  message: Message
  parts: Part[]
  isDark: boolean
  // Only wired up for user messages — long-press opens the "Edit message" /
  // revert action sheet. Identified by messageID (not a closure over parts)
  // so it stays correct even if the memo below bails on a stale render.
  onLongPress?: (messageID: string) => void
}

// TODO: Replace with streamdown-rn once React 19 types PR lands - it has
// built-in block-level memoization that eliminates re-renders for stable blocks
export const MessageBubble = memo(
  function MessageBubble({ message, parts, isDark, onLongPress }: Props) {
    const isUser = message.role === "user"

    const { text, reasoning, toolParts, fileParts } = useMemo(() => {
      let tAcc = ""
      let rAcc = ""
      const tools: Part[] = []
      const files: Part[] = []

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        if (p.type === "text" && p.text) {
          tAcc = tAcc ? `${tAcc}\n${p.text}` : p.text
        } else if (p.type === "reasoning" && p.text) {
          rAcc = rAcc ? `${rAcc}\n${p.text}` : p.text
        } else if (p.type === "tool") {
          tools.push(p)
        } else if (p.type === "file" && isImageMime(p.mime)) {
          files.push(p)
        }
      }
      return { text: tAcc, reasoning: rAcc, toolParts: tools, fileParts: files }
    }, [parts])

    // SSE delivers text in per-token part updates; parsing the full markdown
    // string per token is O(n²) over the stream. Batch the assistant text so
    // Markdown re-parses at most once per window (~16/sec) while the trailing
    // edge guarantees the finished text renders exactly. User text is a cheap
    // plain <Text>, so renderText passes it through unbuffered (zero added
    // latency) — the hook runs unconditionally (initial state === text, and a
    // stable user message never pushes, so it's a no-op there).
    const batchedText = useBatchedText(text)
    const renderText = isUser ? text : batchedText

    return (
      <TouchableOpacity
        activeOpacity={isUser && onLongPress ? 0.7 : 1}
        onLongPress={isUser && onLongPress ? () => onLongPress(message.id) : undefined}
        disabled={!isUser || !onLongPress}
        style={[
          s.bubble,
          isUser ? s.user : s.assistant,
          isUser && isDark && s.userDark,
          !isUser && isDark && s.assistantDark,
        ]}
        testID={`chat-bubble-${message.role}`}
      >
        {/* Role indicator */}
        <View style={s.header}>
          <Ionicons
            name={isUser ? "person" : "sparkles"}
            size={14}
            color={isUser ? "#FFFFFF" : "#0071E3"}
          />
          <Text style={[s.role, isUser && s.roleUser, isUser && isDark && s.roleUserDark]}>
            {isUser ? "You" : "Assistant"}
          </Text>
          {message.model && <Text style={[s.modelTag, isDark && s.modelTagDark]}>{message.model.modelID}</Text>}
          {!isUser && message.modelID && <Text style={[s.modelTag, isDark && s.modelTagDark]}>{message.modelID}</Text>}
        </View>

        {/* Image attachments */}
        {fileParts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.imageRow}
            style={s.imageScroll}
          >
            {fileParts.map((fp: Part) => (
              <View key={fp.id} style={s.imageWrap}>
                <Image source={{ uri: fp.url }} style={s.attachedImage} resizeMode="cover" />
                {fp.filename && (
                  <Text style={[s.imageLabel, isDark && s.imageLabelDark]} numberOfLines={1}>
                    {fp.filename}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Reasoning (collapsible) */}
        {reasoning.length > 0 && <ReasoningBlock text={reasoning} isDark={isDark} />}

        {/* Message text */}
        {renderText.length > 0 &&
          (isUser ? (
            <Text style={[s.messageText, s.messageTextUser, isDark && s.messageTextUserDark]} selectable>
              {renderText}
            </Text>
          ) : (
            <View style={s.markdownWrap}>
              <Markdown>{renderText}</Markdown>
            </View>
          ))}

        {/* Tool calls */}
        {toolParts.map((tool: Part) => (
          <ToolCallCard key={tool.id} tool={tool} isDark={isDark} />
        ))}

        {/* Tokens/cost for assistant messages */}
        {!isUser && message.tokens && (
          <Text style={[s.tokens, isDark && s.tokensDark]}>
            {message.tokens.input + message.tokens.output} tokens
            {message.cost ? ` · $${message.cost.toFixed(4)}` : ""}
          </Text>
        )}
      </TouchableOpacity>
    )
  },
  (prev, next) => {
    // Only re-render if message content actually changed
    // This prevents completed messages from re-rendering during streaming.
    // The store replaces changed parts/messages with NEW object references,
    // so a reference-equality sweep over every part catches every real change
    // (including tool parts, which have no `.text`) while still skipping
    // unchanged (completed) messages during other messages' streaming.
    if (prev.message !== next.message) return false
    if (prev.isDark !== next.isDark) return false
    if (prev.onLongPress !== next.onLongPress) return false
    if (prev.parts.length !== next.parts.length) return false
    for (let i = 0; i < prev.parts.length; i++) {
      if (prev.parts[i] !== next.parts[i]) return false
    }
    return true
  },
)

const s = StyleSheet.create({
  bubble: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20, // uniform, no tail — iOS 18+ Messages
    maxWidth: "75%",
  },
  user: { backgroundColor: "#0071E3", alignSelf: "flex-end" },
  userDark: { backgroundColor: "#0A84FF" },
  assistant: { backgroundColor: "#E9E9EB", alignSelf: "flex-start" },
  assistantDark: { backgroundColor: "#2C2C2E" },

  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  role: { fontSize: 13, fontWeight: "600", color: "#6E6E73" },
  roleUser: { color: "rgba(255,255,255,0.85)" },
  roleUserDark: { color: "rgba(255,255,255,0.85)" },
  textWhite: { color: "#FFFFFF" },
  textWhiteDark: { color: "#FFFFFF" },

  modelTag: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6E6E73",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  modelTagDark: { backgroundColor: "#1C1C1E", color: "#AEAEB2" },

  messageText: { fontSize: 17, lineHeight: 22, color: "#000000" },
  messageTextUser: { color: "#FFFFFF" },
  messageTextUserDark: { color: "#FFFFFF" },
  markdownWrap: { marginHorizontal: -4 },

  tokens: { fontSize: 11, color: "#8E8E93", marginTop: 8 },
  tokensDark: { color: "#8E8E93" },

  // Images
  imageScroll: { marginBottom: 8 },
  imageRow: { gap: 8 },
  imageWrap: { alignItems: "center" },
  attachedImage: {
    width: Math.min(200, SCREEN_WIDTH * 0.5),
    height: Math.min(200, SCREEN_WIDTH * 0.5),
    borderRadius: 12,
    backgroundColor: "#E9E9EB",
  },
  imageLabel: { fontSize: 10, color: "#6E6E73", marginTop: 4, maxWidth: 200 },
  imageLabelDark: { color: "#AEAEB2" },
})
