import { useState, useCallback, memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import type { Part } from "../../lib/sdk"
import { DiffView } from "./DiffView"
import { getTheme, theme } from "../../lib/theme"
import { useLiveNow } from "../../lib/live-elapsed"

const dark = theme.colors.dark
const light = theme.colors.light
type Palette = ReturnType<typeof getTheme>

const TOOL_ICONS: Record<string, string> = {
  read: "glasses-outline",
  list: "list-outline",
  glob: "search-outline",
  grep: "search-outline",
  webfetch: "globe-outline",
  edit: "code-slash-outline",
  write: "create-outline",
  apply_patch: "git-merge-outline",
  bash: "terminal-outline",
  task: "git-branch-outline",
  todowrite: "checkbox-outline",
  todoread: "checkbox-outline",
  question: "chatbubble-ellipses-outline",
  codesearch: "search-outline",
  websearch: "globe-outline",
}

const mono = Platform.OS === "ios" ? "Menlo" : "monospace"

function statusColor(status: string, colors: Palette): string {
  if (status === "completed") return colors.statusSuccess
  if (status === "error") return colors.statusError
  if (status === "running") return colors.statusWarning
  return colors.footnoteText
}

// --- Tool-specific detail renderers ---

function BashDetail({ input, output, isDark }: { input: unknown; output: unknown; isDark: boolean }) {
  const cmd = typeof input === "object" && input !== null ? (input as Record<string, unknown>).command : undefined
  const out = typeof output === "string" ? output : undefined
  return (
    <View style={s.detailSection}>
      {typeof cmd === "string" && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable>
            <Text style={s.codePrompt}>$ </Text>
            {cmd}
          </Text>
        </View>
      )}
      {out !== undefined && out.length > 0 && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark, { marginTop: 6 }]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={80}>
            {out}
          </Text>
        </View>
      )}
    </View>
  )
}

function ReadDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const file = typeof input === "object" && input !== null ? (input as Record<string, unknown>).filePath : undefined
  const offset = typeof input === "object" && input !== null ? (input as Record<string, unknown>).offset : undefined
  const limit = typeof input === "object" && input !== null ? (input as Record<string, unknown>).limit : undefined
  const range = offset || limit ? ` (${offset || 0}..${limit || "end"})` : ""
  return (
    <View style={s.detailSection}>
      {typeof file === "string" && (
        <Text style={[s.detailFile, isDark && s.detailFileDark]} selectable numberOfLines={2}>
          {file}
          {range}
        </Text>
      )}
    </View>
  )
}

function WriteDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const file = typeof input === "object" && input !== null ? (input as Record<string, unknown>).filePath : undefined
  const content = typeof input === "object" && input !== null ? (input as Record<string, unknown>).content : undefined
  return (
    <View style={s.detailSection}>
      {typeof file === "string" && (
        <Text style={[s.detailFile, isDark && s.detailFileDark]} selectable numberOfLines={2}>
          {file}
        </Text>
      )}
      {typeof content === "string" && content.length > 0 && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark, { marginTop: 6 }]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={40}>
            {content}
          </Text>
        </View>
      )}
    </View>
  )
}

function EditDetail({ input, output, isDark }: { input: unknown; output: unknown; isDark: boolean }) {
  const file = typeof input === "object" && input !== null ? (input as Record<string, unknown>).filePath : undefined
  const old = typeof input === "object" && input !== null ? (input as Record<string, unknown>).oldString : undefined
  const replacement =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>).newString : undefined

  if (typeof old === "string" && typeof replacement === "string") {
    return (
      <View style={s.detailSection}>
        {typeof file === "string" && (
          <Text style={[s.detailFile, isDark && s.detailFileDark]} selectable numberOfLines={2}>
            {file}
          </Text>
        )}
        <DiffView before={old} after={replacement} isDark={isDark} />
      </View>
    )
  }

  const text = typeof output === "string" ? output : JSON.stringify(output, null, 2)
  return (
    <View style={s.detailSection}>
      {typeof file === "string" && (
        <Text style={[s.detailFile, isDark && s.detailFileDark]} selectable numberOfLines={2}>
          {file}
        </Text>
      )}
      {text && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark, { marginTop: 6 }]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={40}>
            {text}
          </Text>
        </View>
      )}
    </View>
  )
}

function PatchDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const patch = typeof input === "object" && input !== null ? (input as Record<string, unknown>).patch : undefined
  return (
    <View style={s.detailSection}>
      {typeof patch === "string" && patch.length > 0 && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={60}>
            {patch}
          </Text>
        </View>
      )}
    </View>
  )
}

function GlobGrepDetail({ input, output, isDark }: { input: unknown; output: unknown; isDark: boolean }) {
  const { t } = useTranslation()
  const pattern = typeof input === "object" && input !== null ? (input as Record<string, unknown>).pattern : undefined
  const path = typeof input === "object" && input !== null ? (input as Record<string, unknown>).path : undefined
  const results = typeof output === "string" ? output : undefined
  return (
    <View style={s.detailSection}>
      {typeof pattern === "string" && (
        <Text style={[s.detailMeta, isDark && s.detailMetaDark]}>
          {typeof path === "string"
            ? t("chat.toolCallCard.patternWithPath", { pattern, path })
            : t("chat.toolCallCard.patternOnly", { pattern })}
        </Text>
      )}
      {results && results.length > 0 && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark, { marginTop: 6 }]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={30}>
            {results}
          </Text>
        </View>
      )}
    </View>
  )
}

function WebfetchDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const colors = getTheme(isDark)
  const url = typeof input === "object" && input !== null ? (input as Record<string, unknown>).url : undefined
  return (
    <View style={s.detailSection}>
      {typeof url === "string" && (
        <Text style={[s.detailFile, isDark && s.detailFileDark, { color: colors.accent }]} selectable numberOfLines={3}>
          {url}
        </Text>
      )}
    </View>
  )
}

function TaskDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const description =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>).description : undefined
  const prompt = typeof input === "object" && input !== null ? (input as Record<string, unknown>).prompt : undefined
  return (
    <View style={s.detailSection}>
      {typeof description === "string" && <Text style={[s.detailMeta, isDark && s.detailMetaDark]}>{description}</Text>}
      {typeof prompt === "string" && prompt.length > 0 && (
        <View style={[s.codeBlock, isDark && s.codeBlockDark, { marginTop: 6 }]}>
          <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={20}>
            {prompt}
          </Text>
        </View>
      )}
    </View>
  )
}

function TodoDetail({ input, isDark }: { input: unknown; isDark: boolean }) {
  const colors = getTheme(isDark)
  const todos = typeof input === "object" && input !== null ? (input as Record<string, unknown>).todos : undefined
  if (!Array.isArray(todos)) return null
  return (
    <View style={s.detailSection}>
      {todos.map((t, i) => {
        const item = t as Record<string, unknown>
        const done = item.status === "completed"
        return (
          <View key={String(item.id || i)} style={s.todoRow}>
            <Ionicons
              name={done ? "checkbox" : "square-outline"}
              size={16}
              color={done ? colors.statusSuccess : isDark ? colors.roleText : colors.footnoteText}
            />
            <Text style={[s.todoText, isDark && s.todoTextDark, done && s.todoDone]} numberOfLines={2}>
              {String(item.content || item.title || "")}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function GenericDetail({ input, output, isDark }: { input: unknown; output: unknown; isDark: boolean }) {
  const text =
    typeof output === "string"
      ? output
      : output !== undefined && output !== null
        ? JSON.stringify(output, null, 2)
        : typeof input === "object" && input !== null
          ? JSON.stringify(input, null, 2)
          : undefined
  if (!text || text.length === 0) return null
  return (
    <View style={s.detailSection}>
      <View style={[s.codeBlock, isDark && s.codeBlockDark]}>
        <Text style={[s.codePre, isDark && s.codePteDark]} selectable numberOfLines={30}>
          {text}
        </Text>
      </View>
    </View>
  )
}

function ToolDetail({ tool, isDark }: { tool: Part; isDark: boolean }) {
  const name = tool.tool || ""
  const input = tool.state?.input
  const output = tool.state?.output

  switch (name) {
    case "bash":
      return <BashDetail input={input} output={output} isDark={isDark} />
    case "read":
      return <ReadDetail input={input} isDark={isDark} />
    case "write":
      return <WriteDetail input={input} isDark={isDark} />
    case "edit":
      return <EditDetail input={input} output={output} isDark={isDark} />
    case "apply_patch":
      return <PatchDetail input={input} isDark={isDark} />
    case "glob":
    case "grep":
    case "list":
    case "codesearch":
      return <GlobGrepDetail input={input} output={output} isDark={isDark} />
    case "webfetch":
    case "websearch":
      return <WebfetchDetail input={input} isDark={isDark} />
    case "task":
      return <TaskDetail input={input} isDark={isDark} />
    case "todowrite":
      return <TodoDetail input={input} isDark={isDark} />
    default:
      return <GenericDetail input={input} output={output} isDark={isDark} />
  }
}

// --- Error display ---
function ErrorBanner({ message, isDark }: { message: string; isDark: boolean }) {
  const colors = getTheme(isDark)
  return (
    <View style={[s.errorBanner, isDark && s.errorBannerDark]}>
      <Ionicons name="alert-circle" size={14} color={colors.statusError} />
      <Text style={s.errorText} numberOfLines={3} selectable>
        {message}
      </Text>
    </View>
  )
}

// --- Duration display ---
function duration(start?: number, end?: number): string | null {
  if (!start || !end) return null
  const ms = end - start
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// --- Main component ---
interface Props {
  tool: Part
  isDark: boolean
}

export const ToolCallCard = memo(
  function ToolCallCard({ tool, isDark }: Props) {
    const { t } = useTranslation()
    const colors = getTheme(isDark)
    const [userExpanded, setUserExpanded] = useState(false)
    const icon = (tool.tool && TOOL_ICONS[tool.tool]) || "extension-puzzle-outline"
    const status = tool.state?.status || "pending"
    const color = statusColor(status, colors)
    const isRunning = status === "running"
    const liveNow = useLiveNow(isRunning)
    const error = tool.state?.error?.message
    const elapsed =
      isRunning && tool.state?.time?.start
        ? `${Math.max(1, Math.floor((liveNow - tool.state.time.start) / 1000))}s`
        : duration(tool.state?.time?.start, tool.state?.time?.end)
    const hasDetail = tool.state?.input !== undefined || tool.state?.output !== undefined || error

    // Running tools are always open so live progress is visible; manual
    // expand/collapse only applies once the tool is no longer running.
    const open = isRunning || userExpanded

    const toggle = useCallback(() => {
      if (hasDetail && !isRunning) setUserExpanded((v) => !v)
      // setUserExpanded is a stable useState setter — listed so the React
      // Compiler can preserve this manual memoization unchanged.
    }, [hasDetail, isRunning, setUserExpanded])

    return (
      <TouchableOpacity
        style={[
          s.card,
          isDark && s.cardDark,
          status === "error" && s.cardError,
          status === "error" && isDark && s.cardErrorDark,
          isRunning && { borderColor: isDark ? dark.statusWarning : light.statusWarning },
        ]}
        onPress={toggle}
        activeOpacity={hasDetail ? 0.7 : 1}
        accessibilityRole="button"
        accessibilityLabel={`${tool.state?.title || tool.tool || t("chat.toolCallCard.fallbackTitle")}${
          status !== "pending" ? `, ${status}` : ""
        }`}
        accessibilityState={{ expanded: open }}
      >
        {/* Header row */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Ionicons name={icon} size={16} color={color} />
            <Text style={[s.name, isDark && s.nameDark]} numberOfLines={1}>
              {tool.state?.title || tool.tool || t("chat.toolCallCard.fallbackTitle")}
            </Text>
            {elapsed && <Text style={[s.elapsed, isDark && s.elapsedDark]}>{elapsed}</Text>}
          </View>
          <View style={s.headerRight}>
            {status === "running" && <ActivityIndicator size="small" color={color} />}
            {status === "completed" && <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />}
            {status === "error" && <Ionicons name="close-circle" size={16} color={colors.statusError} />}
            {hasDetail && !isRunning && (
              <Ionicons
                name={open ? "chevron-up" : "chevron-down"}
                size={16}
                color={isDark ? colors.roleText : colors.footnoteText}
              />
            )}
          </View>
        </View>

        {/* Error banner */}
        {error && !open && <ErrorBanner message={error} isDark={isDark} />}

        {/* Expanded detail */}
        {open && (
          <ScrollView style={s.detailScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {error && <ErrorBanner message={error} isDark={isDark} />}
            <ToolDetail tool={tool} isDark={isDark} />
          </ScrollView>
        )}
      </TouchableOpacity>
    )
  },
  (prev, next) => prev.tool === next.tool && prev.isDark === next.isDark,
)

const s = StyleSheet.create({
  card: {
    backgroundColor: light.cardBg,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: light.border,
  },
  cardDark: { backgroundColor: dark.surface, borderColor: dark.borderSubtle },
  cardError: { borderColor: light.errorBorder, backgroundColor: light.errorBg },
  cardErrorDark: { borderColor: dark.errorBorder, backgroundColor: dark.errorBg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 13, fontWeight: "600", color: light.textPrimary, flex: 1 },
  nameDark: { color: dark.textPrimary },
  elapsed: { fontSize: 11, fontWeight: "500", color: light.roleText },
  elapsedDark: { color: dark.todoDoneText },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: light.errorBannerBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: light.errorBannerBorder,
  },
  errorBannerDark: { backgroundColor: dark.errorBannerBg },
  errorText: { fontSize: 12, color: light.statusError, flex: 1, lineHeight: 18, fontWeight: "500" },

  // Detail
  detailScroll: { maxHeight: 300, marginTop: 8 },
  detailSection: { gap: 6 },
  detailFile: {
    fontSize: 12,
    fontFamily: mono,
    color: light.accent,
    backgroundColor: light.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  detailFileDark: { color: dark.accent, backgroundColor: dark.accentSoft },
  detailMeta: { fontSize: 12, color: light.roleText, lineHeight: 18 },
  detailMetaDark: { color: dark.todoDoneText },

  // Code block
  codeBlock: {
    backgroundColor: light.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: light.border,
  },
  codeBlockDark: { backgroundColor: dark.bg, borderColor: dark.borderSubtle },
  codePre: {
    fontSize: 12,
    fontFamily: mono,
    color: light.textPrimary,
    lineHeight: 18,
  },
  codePteDark: { color: dark.textPrimary },
  codePrompt: { color: light.accent, fontWeight: "700" },

  // Todo
  todoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 3,
  },
  todoText: { fontSize: 13, color: light.textPrimary, flex: 1, lineHeight: 20 },
  todoTextDark: { color: dark.textPrimary },
  todoDone: { textDecorationLine: "line-through", color: light.todoDoneText },
})
