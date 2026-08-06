import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useTranslation } from "react-i18next"
import { getTheme } from "../../lib/theme"

interface Props {
  visible: boolean
  onPress: () => void
  isDark: boolean
}

export function JumpToLatest({ visible, onPress, isDark }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  if (!visible) return null

  const content = (
    <View style={[s.pill, { backgroundColor: colors.surfaceElevated }]}>
      <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
      <Text style={[s.label, { color: colors.textPrimary }]}>{t("session.scrollToBottom")}</Text>
    </View>
  )

  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t("session.scrollToBottom")}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={s.glass}>
          {content}
        </BlurView>
      ) : (
        content
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    bottom: 96, // above composer glass
    borderRadius: 999,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  glass: { borderRadius: 999, overflow: "hidden" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(128,128,128,0.4)",
  },
  label: { fontSize: 13, fontWeight: "600" },
})
