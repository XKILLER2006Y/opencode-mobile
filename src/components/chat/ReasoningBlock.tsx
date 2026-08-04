import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

interface Props {
  text: string
  isDark: boolean
}

export function ReasoningBlock({ text, isDark }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const colors = getTheme(isDark)

  return (
    <TouchableOpacity
      style={[
        s.block,
        {
          backgroundColor: isDark ? "rgba(139, 92, 246, 0.08)" : "rgba(124, 58, 237, 0.05)",
          borderColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.15)",
        },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={s.header}>
        <View style={[s.iconBadge, { backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)" }]}>
          <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
        </View>
        <Text style={[s.label, { color: isDark ? "#FBBF24" : "#D97706" }]}>{t("chat.reasoningBlock.label")}</Text>
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
  text: { ...theme.typography.code, marginTop: theme.spacing.sm, lineHeight: 20 },
})

