import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface Props {
  permission: { id: string; permission: string; patterns: string[] }
  isDark: boolean
  onReply: (reply: "once" | "always" | "reject") => void
}

export function PermissionPrompt({ permission, isDark, onReply }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  return (
    <View style={[s.card, isDark && s.cardDark]}>
      <View style={s.header}>
        <Ionicons name="shield-outline" size={18} color={colors.statusWarning} />
        <Text style={[s.title, isDark && s.textWhite]}>{t("chat.permissionPrompt.title")}</Text>
      </View>
      <Text style={[s.type, isDark && s.typeDark]}>
        {permission.permission}: {permission.patterns.join(", ")}
      </Text>
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btn, s.deny]}
          onPress={() => onReply("reject")}
          accessibilityRole="button"
          accessibilityLabel={t("chat.permissionPrompt.deny")}
        >
          <Text style={s.denyText}>{t("chat.permissionPrompt.deny")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, s.always, isDark && s.alwaysDark]}
          onPress={() => onReply("always")}
          accessibilityRole="button"
          accessibilityLabel={t("chat.permissionPrompt.always")}
        >
          <Text style={[s.alwaysText, isDark && s.textWhite]}>{t("chat.permissionPrompt.always")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, s.allow, isDark && s.allowDark]}
          onPress={() => onReply("once")}
          accessibilityRole="button"
          accessibilityLabel={t("chat.permissionPrompt.allow")}
        >
          <Text style={[s.allowText, isDark && s.allowTextDark]}>{t("chat.permissionPrompt.allow")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    margin: 12,
    padding: 16,
    backgroundColor: light.warnBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.warnBorder,
  },
  cardDark: { backgroundColor: dark.warnBg, borderColor: dark.warnBorder },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "600", color: light.statusWarning },
  textWhite: { color: dark.statusWarning },
  type: { fontSize: 13, color: light.statusWarning, marginBottom: 14, lineHeight: 18 },
  typeDark: { color: dark.statusWarning },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  deny: { backgroundColor: light.denyBg },
  denyText: { color: light.denyText, fontWeight: "600", fontSize: 14 },
  always: { backgroundColor: light.cardBg },
  alwaysDark: { backgroundColor: dark.borderSubtle },
  alwaysText: { color: light.textPrimary, fontWeight: "600", fontSize: 14 },
  allow: { backgroundColor: dark.bg },
  allowDark: { backgroundColor: light.white },
  allowText: { color: light.white, fontWeight: "600", fontSize: 14 },
  allowTextDark: { color: dark.bg },
})
