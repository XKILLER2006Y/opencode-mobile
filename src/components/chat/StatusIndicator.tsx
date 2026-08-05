import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import { useEvents } from "../../stores/events"
import { useSessions } from "../../stores/sessions"

interface Props {
  sessionID: string
  isDark: boolean
}

export function StatusIndicator({ sessionID, isDark }: Props) {
  const { t } = useTranslation()
  const status = useEvents((s) => s.sessionStatus[sessionID])
  const text = useEvents((s) => s.statusText[sessionID])
  const optimistic = useSessions((s) => s.sending[sessionID])

  // SSE status is the source of truth. The optimistic `sending` flag only
  // covers the gap between the user tapping send and SSE confirming busy.
  // Once SSE reports idle, the indicator hides regardless of the optimistic flag.
  const sseBusy = status && status.type !== "idle"
  const busy = sseBusy || (optimistic && !status)
  if (!busy) return null

  const label =
    status?.type === "retry" ? t("chat.statusIndicator.retrying", { attempt: status.attempt }) : text || t("chat.statusIndicator.working")

  return (
    <View style={[s.bar, isDark && s.barDark]}>
      <ActivityIndicator size="small" color={isDark ? "#0A84FF" : "#0071E3"} />
      <Text style={[s.text, isDark && s.textDark]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 113, 227, 0.06)",
    borderTopWidth: 1,
    borderTopColor: "#C6C6C8",
  },
  barDark: { backgroundColor: "#1C1C1E", borderTopColor: "#2C2C2E" },
  text: { fontSize: 13, color: "#0071E3", fontWeight: "500" },
  textDark: { color: "#0A84FF" },
})
