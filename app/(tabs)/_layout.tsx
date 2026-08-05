import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#0A84FF" : "#0071E3",
        tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93",
        tabBarStyle: {
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          borderTopColor: isDark ? "#1C1C1E" : "#E9E9EB",
        },
        headerStyle: {
          backgroundColor: isDark ? "#000000" : "#F2F2F7",
        },
        headerTintColor: isDark ? "#FFFFFF" : "#000000",
        headerTitleStyle: { fontFamily: "Inter-SemiBold", fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.sessionsTab"),
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: t("nav.connectionsTab"),
          tabBarIcon: ({ color, size }) => <Ionicons name="server-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("nav.settingsTab"),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  )
}
