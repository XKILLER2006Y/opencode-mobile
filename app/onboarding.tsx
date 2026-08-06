import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useColorScheme } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../src/lib/theme"
import { useOnboarding } from "../src/stores/onboarding"

type Step = "guide" | "helper"

const FEATURES = [
  { icon: "chatbubbles-outline" as const, key: "feature1" },
  { icon: "terminal-outline" as const, key: "feature2" },
  { icon: "qr-code-outline" as const, key: "feature3" },
]

export default function OnboardingScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const colors = getTheme(isDark)
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>("guide")

  const handleSkip = async () => {
    // complete() flips the root gate's store state synchronously, so the
    // normal Stack replaces the onboarding Stack before we replace to (tabs).
    await useOnboarding.getState().complete()
    router.replace("/(tabs)")
  }

  const openScan = () => {
    void router.push("/connect/scan")
  }

  const openManual = () => {
    void router.push("/connection/add")
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.brandRow}>
          <View style={[styles.logoBadge, { backgroundColor: colors.accentGlow }]}>
            <Ionicons name="sparkles" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.brand, { color: colors.textSecondary }]}>opencode</Text>
        </View>

        {step === "guide" ? (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t("onboarding.welcomeTitle")}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("onboarding.welcomeSubtitle")}</Text>

            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.key} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.accentGlow }]}>
                    <Ionicons name={f.icon} size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>{t(`onboarding.${f.key}`)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              onPress={() => setStep("helper")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.getStarted")}
            >
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>{t("onboarding.getStarted")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleSkip()}
              style={styles.skipButton}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.skip")}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t("onboarding.skip")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t("onboarding.helperTitle")}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("onboarding.helperSubtitle")}</Text>

            <View style={styles.helperOptions}>
              <TouchableOpacity
                style={[styles.helperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={openScan}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.scanQr")}
              >
                <View style={[styles.helperIcon, { backgroundColor: colors.accentGlow }]}>
                  <Ionicons name="qr-code-outline" size={26} color={colors.accent} />
                </View>
                <View style={styles.helperCopy}>
                  <Text style={[styles.helperTitle, { color: colors.textPrimary }]}>{t("onboarding.scanQr")}</Text>
                  <Text style={[styles.helperSub, { color: colors.textSecondary }]}>
                    {t("connectionsList.scan")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={openManual}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.addManually")}
              >
                <View style={[styles.helperIcon, { backgroundColor: colors.accentGlow }]}>
                  <Ionicons name="server-outline" size={26} color={colors.accent} />
                </View>
                <View style={styles.helperCopy}>
                  <Text style={[styles.helperTitle, { color: colors.textPrimary }]}>{t("onboarding.addManually")}</Text>
                  <Text style={[styles.helperSub, { color: colors.textSecondary }]}>{t("nav.addConnectionTitle")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => void handleSkip()}
              style={styles.skipButton}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.skip")}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t("onboarding.skip")}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.huge,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.huge,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    ...theme.typography.title1,
    fontWeight: "700",
  },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: "700",
  },
  subtitle: {
    ...theme.typography.body,
    marginTop: theme.spacing.md,
    lineHeight: 24,
  },
  features: {
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    ...theme.typography.body,
    flex: 1,
  },
  primaryButton: {
    marginTop: theme.spacing.huge,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...theme.typography.headline,
  },
  skipButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  skipText: {
    ...theme.typography.footnote,
    fontWeight: "600",
  },
  helperOptions: {
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  helperIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  helperCopy: {
    flex: 1,
  },
  helperTitle: {
    ...theme.typography.headline,
  },
  helperSub: {
    ...theme.typography.caption,
    marginTop: 2,
  },
})
