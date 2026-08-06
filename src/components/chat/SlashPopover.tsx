import { useMemo } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

export interface SlashCommand {
  trigger: string
  title: string
  description?: string
  icon: string
  type: "builtin" | "custom"
}

interface Props {
  query: string
  commands: SlashCommand[]
  isDark: boolean
  onSelect: (cmd: SlashCommand) => void
}

export function SlashPopover({ query, commands, isDark, onSelect }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return commands.filter((c) => c.trigger.toLowerCase().startsWith(q) || c.title.toLowerCase().includes(q))
  }, [query, commands])

  if (filtered.length === 0) return null

  return (
    <View style={[s.popover, isDark && s.popoverDark]}>
      <ScrollView keyboardShouldPersistTaps="always" style={s.scroll}>
        {filtered.map((cmd) => (
          <TouchableOpacity
            key={cmd.trigger}
            style={[s.item, isDark && s.itemDark]}
            onPress={() => onSelect(cmd)}
            accessibilityRole="button"
            accessibilityLabel={cmd.description ? `/${cmd.trigger}, ${cmd.description}` : `/${cmd.trigger}`}
          >
            <Ionicons
              name={cmd.icon}
              size={18}
              color={cmd.type === "custom" ? colors.accent : isDark ? colors.footnoteText : colors.roleText}
            />
            <View style={s.textCol}>
              <Text style={[s.trigger, isDark && s.textWhite]}>/{cmd.trigger}</Text>
              {cmd.description && (
                <Text style={[s.desc, isDark && s.metaDark]} numberOfLines={1}>
                  {cmd.description}
                </Text>
              )}
            </View>
            {cmd.type === "custom" && (
              <View style={[s.badge, isDark && s.badgeDark]}>
                <Text style={s.badgeText}>{t("chat.slashPopover.customBadge")}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  popover: {
    backgroundColor: light.white,
    borderTopWidth: 1,
    borderTopColor: light.border,
    maxHeight: 220,
  },
  popoverDark: { backgroundColor: dark.surface, borderTopColor: dark.borderSubtle },
  scroll: { paddingVertical: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemDark: {},
  textCol: { flex: 1 },
  trigger: { fontSize: 14, fontWeight: "600", color: light.textPrimary },
  textWhite: { color: dark.textPrimary },
  desc: { fontSize: 12, color: light.roleText, marginTop: 1 },
  metaDark: { color: dark.todoDoneText },
  badge: {
    backgroundColor: light.accentSelectedBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDark: { backgroundColor: dark.accentSelectedBg },
  badgeText: { fontSize: 10, color: light.accent, fontWeight: "600" },
})
