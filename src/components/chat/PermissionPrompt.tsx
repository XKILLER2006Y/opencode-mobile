import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

interface Props {
  permission: { id: string; permission: string; patterns: string[] }
  isDark: boolean
  onReply: (reply: "once" | "always" | "reject") => void
}

export function PermissionPrompt({ permission, isDark, onReply }: Props) {
  const { t } = useTranslation()
  return (
    <View style={[s.card, isDark && s.cardDark]}>
      <View style={s.header}>
        <Ionicons name="shield-outline" size={18} color="#f59e0b" />
        <Text style={[s.title, isDark && s.textWhite]}>{t("chat.permissionPrompt.title")}</Text>
      </View>
      <Text style={[s.type, isDark && s.typeDark]}>
        {permission.permission}: {permission.patterns.join(", ")}
      </Text>
      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, s.deny]} onPress={() => onReply("reject")}>
          <Text style={s.denyText}>{t("chat.permissionPrompt.deny")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.always, isDark && s.alwaysDark]} onPress={() => onReply("always")}>
          <Text style={[s.alwaysText, isDark && s.textWhite]}>{t("chat.permissionPrompt.always")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.allow, isDark && s.allowDark]} onPress={() => onReply("once")}>
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
    backgroundColor: "rgba(245, 158, 11, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  cardDark: { backgroundColor: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.25)" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "600", color: "#D97706" },
  textWhite: { color: "#FBBF24" },
  type: { fontSize: 13, color: "#B45309", marginBottom: 14, lineHeight: 18 },
  typeDark: { color: "#FCD34D" },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  deny: { backgroundColor: "rgba(239, 68, 68, 0.1)" },
  denyText: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  always: { backgroundColor: "#F4F4F5" },
  alwaysDark: { backgroundColor: "#27272A" },
  alwaysText: { color: "#09090B", fontWeight: "600", fontSize: 14 },
  allow: { backgroundColor: "#09090B" },
  allowDark: { backgroundColor: "#FAFAFA" },
  allowText: { color: "#FAFAFA", fontWeight: "600", fontSize: 14 },
  allowTextDark: { color: "#09090B" },
})
