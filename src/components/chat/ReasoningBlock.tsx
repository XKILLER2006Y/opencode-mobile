import { memo, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

interface Props {
  text: string
  isDark: boolean
  live?: boolean
}

function ReasoningBlockImpl({ text, isDark, live = false }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  // null = not yet touched; follow `live`. Once the user taps, their explicit
  // choice wins forever — including when the stream completes (live flips
  // false) — so a collapsed thinking block never pops open mid-read, and an
  // expanded one never collapses under the user. Derived state, no useEffect.
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null)
  const expanded = manualExpanded !== null ? manualExpanded : live

  return (
    <TouchableOpacity
      style={[
        s.block,
        {
          backgroundColor: colors.accentTintBg,
          borderColor: colors.accentTintBorder,
        },
      ]}
      onPress={() => setManualExpanded((v) => (v === null ? !live : !v))}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t("chat.reasoningBlock.label")}
      accessibilityState={{ expanded }}
    >
      <View style={s.header}>
        <View style={[s.iconBadge, { backgroundColor: colors.warnTintBg }]}>
          <Ionicons name="bulb-outline" size={14} color={colors.statusWarning} />
        </View>
        <Text style={[s.label, { color: colors.statusWarning }]}>{t("chat.reasoningBlock.label")}</Text>
        {live && <View style={[s.liveDot, { backgroundColor: colors.statusWarning }]} />}
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.textMuted} />
      </View>
      {expanded && (
        <Text style={[s.text, { color: colors.textSecondary }]} selectable>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export const ReasoningBlock = memo(ReasoningBlockImpl, (prev, next) =>
  prev.text === next.text && prev.isDark === next.isDark && prev.live === next.live,
)

const s = StyleSheet.create({
  block: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, ...theme.typography.caption, fontWeight: "600" },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 2 },
  text: { ...theme.typography.code, marginTop: theme.spacing.sm, lineHeight: 20 },
})
