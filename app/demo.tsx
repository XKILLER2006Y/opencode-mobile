import { useCallback, useEffect, useMemo, useState } from "react"
import { theme } from "../src/lib/theme"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, Linking } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { MessageBubble, PermissionPrompt } from "../src/components/chat"
import { buildDemoScript, buildDemoCompletionMessage, buildDemoDenialMessage } from "../src/lib/demo-script"
import { SETUP_GUIDE_URL } from "../src/lib/links"
import { track, AnalyticsEvent } from "../src/lib/analytics"
import {
  demoStepAdvancedProps,
  demoCompletedOutcome,
  demoExitedToConnectProps,
  type DemoPermissionReply,
} from "../src/lib/demo-analytics"

// Fully offline, scripted walkthrough for installers with no self-hosted
// opencode server. ISOLATION: every message/part below is hardcoded local
// data built once with useMemo — this screen never calls useSessions,
// useConnections, useEvents, or any sdk.ts client method, so it cannot
// create a real session, touch the network, or corrupt real app state. The
// permission "reply" only flips local component state (below); it never
// calls sessionClient.permission.reply the way app/session/[id].tsx does.
export default function DemoScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  // Built once per mount from pure, hardcoded data (src/lib/demo-script.ts).
  const script = useMemo(() => buildDemoScript(), [])
  const [reply, setReply] = useState<DemoPermissionReply | null>(null)

  // Fires once per screen mount — this is a fully offline, consent-gated
  // event (track() is a no-op without telemetry consent, same as every
  // other analytics call site).
  useEffect(() => {
    track(AnalyticsEvent.DemoStarted)
  }, [])

  const handleReply = useCallback((r: DemoPermissionReply) => {
    setReply(r)
    track(AnalyticsEvent.DemoStepAdvanced, demoStepAdvancedProps(r))
    track(AnalyticsEvent.DemoCompleted, { outcome: demoCompletedOutcome(r) })
  }, [])

  const handleConnectPress = useCallback(() => {
    track(AnalyticsEvent.DemoExitedToConnect, demoExitedToConnectProps(reply !== null))
    router.push("/connection/add")
  }, [reply, router])

  const completion = useMemo(() => {
    if (!reply) return null
    return reply === "reject" ? buildDemoDenialMessage() : buildDemoCompletionMessage()
  }, [reply])

  const [userMessage, assistantMessage] = script.messages

  return (
    <>
      <Stack.Screen options={{ title: t("demo.title"), presentation: "card" }} />
      <View style={[s.container, isDark && s.containerDark]} testID="demo-screen">
        <View style={[s.banner, isDark && s.bannerDark]} testID="demo-banner">
          <Ionicons name="play-circle-outline" size={16} color={theme.colors.light.indigo} />
          <Text style={s.bannerText}>{t("demo.banner")}</Text>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          <MessageBubble message={userMessage} parts={script.parts[userMessage.id] || []} isDark={isDark} />
          <MessageBubble message={assistantMessage} parts={script.parts[assistantMessage.id] || []} isDark={isDark} />

          {!reply && <PermissionPrompt permission={script.permission} isDark={isDark} onReply={handleReply} />}

          {completion && (
            <MessageBubble message={completion.message} parts={completion.parts} isDark={isDark} />
          )}

          <View style={[s.ctaCard, isDark && s.ctaCardDark]} testID="demo-cta-card">
            <Text style={[s.ctaTitle, isDark && s.textWhite]}>{t("demo.ctaTitle")}</Text>
            <Text style={[s.ctaSubtitle, isDark && s.metaDark]}>{t("demo.ctaSubtitle")}</Text>
            <TouchableOpacity
              style={s.connectButton}
              onPress={handleConnectPress}
              testID="demo-connect-button"
              accessibilityRole="button"
              accessibilityLabel={t("demo.connectButton")}
            >
              <Text style={s.connectButtonText}>{t("demo.connectButton")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.hostedCtaLink}
              onPress={handleConnectPress}
              testID="demo-hosted-cta"
              accessibilityRole="link"
              accessibilityLabel={t("demo.hostedCtaLink")}
            >
              <Text style={s.hostedCtaLinkText}>{t("demo.hostedCtaLink")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.setupGuideLink}
              onPress={() => Linking.openURL(SETUP_GUIDE_URL)}
              testID="demo-setup-guide-link"
              accessibilityRole="link"
              accessibilityLabel={t("demo.setupGuideLink")}
            >
              <Text style={s.setupGuideLinkText}>{t("demo.setupGuideLink")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.surface },
  containerDark: { backgroundColor: theme.colors.dark.bgApp },
  textWhite: { color: theme.colors.light.surface },
  metaDark: { color: theme.colors.dark.textMuted },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.light.indigoBox,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(233, 213, 255, 1)",
  },
  bannerDark: { backgroundColor: theme.colors.dark.indigoBg, borderBottomColor: theme.colors.dark.indigoBg },
  bannerText: { fontSize: 13, fontWeight: "600", color: theme.colors.light.indigo, flex: 1 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  ctaCard: {
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.light.surfaceElevated,
    alignItems: "center",
  },
  ctaCardDark: { backgroundColor: theme.colors.dark.border },
  ctaTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.light.textPrimary, textAlign: "center" },
  ctaSubtitle: { fontSize: 13, color: theme.colors.light.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 18 },
  connectButton: {
    marginTop: 16,
    backgroundColor: theme.colors.light.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  connectButtonText: { color: theme.colors.light.surface, fontWeight: "600", fontSize: 15 },
  hostedCtaLink: { marginTop: 14 },
  hostedCtaLinkText: { fontSize: 14, fontWeight: "600", color: theme.colors.light.indigo, textAlign: "center" },
  setupGuideLink: { marginTop: 14 },
  setupGuideLinkText: { fontSize: 14, fontWeight: "600", color: theme.colors.light.indigo }})
