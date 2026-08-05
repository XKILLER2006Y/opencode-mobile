import { useMemo } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

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
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return commands.filter((c) => c.trigger.toLowerCase().startsWith(q) || c.title.toLowerCase().includes(q))
  }, [query, commands])

  if (filtered.length === 0) return null

  return (
    <View style={[s.popover, isDark && s.popoverDark]}>
      <ScrollView keyboardShouldPersistTaps="always" style={s.scroll}>
        {filtered.map((cmd) => (
          <TouchableOpacity key={cmd.trigger} style={[s.item, isDark && s.itemDark]} onPress={() => onSelect(cmd)}>
            <Ionicons
              name={cmd.icon}
              size={18}
              color={cmd.type === "custom" ? (isDark ? "#0A84FF" : "#0071E3") : isDark ? "#8E8E93" : "#6E6E73"}
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#C6C6C8",
    maxHeight: 220,
  },
  popoverDark: { backgroundColor: "#1C1C1E", borderTopColor: "#2C2C2E" },
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
  trigger: { fontSize: 14, fontWeight: "600", color: "#000000" },
  textWhite: { color: "#FFFFFF" },
  desc: { fontSize: 12, color: "#6E6E73", marginTop: 1 },
  metaDark: { color: "#AEAEB2" },
  badge: {
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDark: { backgroundColor: "rgba(10, 132, 255, 0.2)" },
  badgeText: { fontSize: 10, color: "#0071E3", fontWeight: "600" },
})
