import { StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useTranslation } from "react-i18next"
import { theme } from "../../lib/theme"
// Direct file import (not the chat barrel) so jest doesn't pull the
// bottom-sheet/reanimated graph through the barrel's re-exports.
import { ImageAttachments, type Attachment } from "../chat/ImageAttachments"

interface Props {
  input: string
  onChangeInput: (text: string) => void
  onSend: () => void
  attachments: Attachment[]
  onRemoveAttachment: (index: number) => void
  onPickFromLibrary: () => void
  onPickFromCamera: () => void
  onPaste: () => void
  agent: string
  agentColor: string
  onCycleAgent: (dir?: 1 | -1) => void
  modelLabel: string
  onOpenModelPicker: () => void
  hasVariants: boolean
  variant?: string | null
  onOpenVariantPicker: () => void
  isSending: boolean
  onAbort: () => void
  speechListening: boolean
  speechTranscript: string
  onStartSpeech: () => void
  onStopSpeech: () => void
  bottomInset: number
  isDark: boolean
}

export function ComposerToolbar({
  input,
  onChangeInput,
  onSend,
  attachments,
  onRemoveAttachment,
  onPickFromLibrary,
  onPickFromCamera,
  onPaste,
  agent,
  agentColor,
  onCycleAgent,
  modelLabel,
  onOpenModelPicker,
  hasVariants,
  variant,
  onOpenVariantPicker,
  isSending,
  onAbort,
  speechListening,
  speechTranscript,
  onStartSpeech,
  onStopSpeech,
  bottomInset,
  isDark,
}: Props) {
  const { t } = useTranslation()
  const variantLabel = variant ? variant.charAt(0).toUpperCase() + variant.slice(1) : t("session.toolbar.auto")

  return (
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={s.composerGlass}>
      <View style={[s.toolbar, isDark && s.toolbarDark]}>
        <TouchableOpacity
          style={[s.agentChip, { borderColor: agentColor }]}
          onPress={() => onCycleAgent()}
          onLongPress={() => onCycleAgent(-1)}
          accessibilityRole="button"
          accessibilityLabel={agent || "build"}
          accessibilityHint={t("session.toolbar.switchAgentHint")}
        >
          <View style={[s.agentDot, { backgroundColor: agentColor }]} />
          <Text style={[s.agentLabel, isDark && s.textWhite]}>{agent || "build"}</Text>
          <Ionicons
            name="swap-horizontal-outline"
            size={12}
            color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.modelChip, isDark && s.modelChipDark]}
          onPress={onOpenModelPicker}
          testID="model-chip"
          accessibilityRole="button"
          accessibilityLabel={`${t("session.toolbar.modelButton")}: ${modelLabel}`}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={14}
            color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
          />
          <Text style={[s.modelLabel, isDark && s.metaDark]} numberOfLines={1}>
            {modelLabel}
          </Text>
        </TouchableOpacity>

        {hasVariants && (
          <TouchableOpacity
            style={[s.variantChip, isDark && s.variantChipDark, variant && s.variantChipActive]}
            onPress={onOpenVariantPicker}
            testID="variant-chip"
            accessibilityRole="button"
            accessibilityLabel={`${t("session.toolbar.variantButton")}: ${variantLabel}`}
          >
            <Ionicons
              name="flash-outline"
              size={14}
              color={
                variant
                  ? isDark
                    ? theme.colors.dark.accent
                    : theme.colors.light.accent
                  : isDark
                    ? theme.colors.dark.textMuted
                    : theme.colors.light.textSecondary
              }
            />
            <Text style={[s.variantLabel, isDark && s.metaDark, variant && s.variantLabelActive]} numberOfLines={1}>
              {variantLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Attachment preview */}
      <ImageAttachments attachments={attachments} isDark={isDark} onRemove={onRemoveAttachment} />

      {/* Input */}
      <View
        style={[s.inputContainer, isDark && s.inputContainerDark, { paddingBottom: Math.max(12, bottomInset) }]}
      >
        <View style={s.inputRow}>
          {/* Attach button */}
          <TouchableOpacity
            style={s.attachBtn}
            onPress={onPickFromLibrary}
            onLongPress={onPickFromCamera}
            accessibilityRole="button"
            accessibilityLabel={t("session.input.attachButton")}
            accessibilityHint={t("session.input.attachCameraHint")}
          >
            <Ionicons
              name="add-circle-outline"
              size={26}
              color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
            />
          </TouchableOpacity>

          {/* Clipboard paste button */}
          <TouchableOpacity
            style={s.attachBtn}
            onPress={onPaste}
            accessibilityRole="button"
            accessibilityLabel={t("session.input.pasteButton")}
          >
            <Ionicons
              name="clipboard-outline"
              size={22}
              color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
            />
          </TouchableOpacity>

          <TextInput
            style={[s.input, isDark && s.inputDark, speechListening && s.inputListening, speechListening && isDark && s.inputListeningDark]}
            placeholder={
              speechListening
                ? t("session.input.placeholderListening")
                : isSending
                  ? t("session.input.placeholderFollowUp")
                  : t("session.input.placeholderDefault")
            }
            placeholderTextColor={
              speechListening
                ? isDark
                  ? theme.colors.dark.statusError
                  : theme.colors.light.statusError
                : isDark
                  ? theme.colors.dark.textSecondary
                  : theme.colors.light.textMuted
            }
            value={speechListening ? speechTranscript : input}
            onChangeText={speechListening ? undefined : onChangeInput}
            editable={!speechListening}
            multiline
            maxLength={10000}
            testID="chat-message-input"
            accessibilityLabel={t("session.input.label")}
          />
          {/* Stop button: only when busy and no input */}
          {isSending && !input.trim() && attachments.length === 0 && !speechListening && (
            <TouchableOpacity
              style={s.stopBtn}
              onPress={onAbort}
              accessibilityRole="button"
              accessibilityLabel={t("session.input.stopButton")}
            >
              <Ionicons name="stop" size={20} color={theme.colors.light.surface} />
            </TouchableOpacity>
          )}
          {/* Mic button: when no input, not sending, and not listening */}
          {!isSending && !input.trim() && attachments.length === 0 && !speechListening && (
            <TouchableOpacity
              style={s.micBtn}
              onPress={onStartSpeech}
              accessibilityRole="button"
              accessibilityLabel={t("session.input.micButton")}
            >
              <Ionicons
                name="mic"
                size={22}
                color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
              />
            </TouchableOpacity>
          )}
          {/* Listening indicator: tap to stop */}
          {speechListening && (
            <TouchableOpacity
              style={s.micBtnActive}
              onPress={onStopSpeech}
              accessibilityRole="button"
              accessibilityLabel={t("session.input.stopListeningButton")}
            >
              <Ionicons name="mic" size={22} color={theme.colors.light.surface} />
            </TouchableOpacity>
          )}
          {/* Send button: when there's input */}
          {!speechListening && (input.trim() || attachments.length > 0) && (
            <TouchableOpacity
              style={s.sendBtn}
              onPress={onSend}
              testID="chat-send-button"
              accessibilityRole="button"
              accessibilityLabel={t("session.input.sendButton")}
            >
              <Ionicons name="send" size={20} color={theme.colors.light.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BlurView>
  )
}

const s = StyleSheet.create({
  composerGlass: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "transparent",
  },
  toolbarDark: { backgroundColor: "transparent" },
  agentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agentDot: { width: 8, height: 8, borderRadius: 4 },
  agentLabel: { fontFamily: "Inter-SemiBold", fontSize: 13, color: theme.colors.light.textPrimary },
  modelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modelChipDark: { backgroundColor: "rgba(120, 120, 128, 0.24)" },
  modelLabel: { fontFamily: "Inter-Medium", fontSize: 13, color: theme.colors.light.textSecondary, maxWidth: 160 },

  // Variant (reasoning effort) chip
  variantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  variantChipDark: { backgroundColor: "rgba(120, 120, 128, 0.24)" },
  variantChipActive: { backgroundColor: "rgba(0, 113, 227, 0.12)" },
  variantLabel: { fontFamily: "Inter-Medium", fontSize: 13, color: theme.colors.light.textSecondary },
  variantLabelActive: { color: theme.colors.light.accent },

  // Input
  inputContainer: {
    padding: 12,
    backgroundColor: "transparent",
  },
  inputContainerDark: { backgroundColor: "transparent" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  attachBtn: {
    width: 36,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    color: theme.colors.light.textPrimary,
  },
  inputDark: { backgroundColor: "rgba(120, 120, 128, 0.24)", color: theme.colors.dark.textPrimary },
  inputListening: { borderWidth: 1, borderColor: theme.colors.light.statusError },
  inputListeningDark: { borderColor: theme.colors.dark.statusError },
  sendBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: theme.colors.light.accent,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 10,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  micBtnActive: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: theme.colors.light.statusError,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: theme.colors.light.statusError,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // Shared text tweaks
  metaDark: { color: theme.colors.dark.textSecondary },
  textWhite: { color: theme.colors.light.surface },
})