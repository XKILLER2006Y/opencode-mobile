/**
 * First-launch consent modal for crash reporting AND activation analytics.
 *
 * A single "Allow" decision gates both Sentry (crash reports) and PostHog
 * (anonymous usage analytics) — see src/lib/telemetry.ts. There is no
 * separate toggle for analytics, so this modal must disclose both.
 *
 * Shows once when the user hasn't yet made a consent decision.
 * Matches the app's existing Settings screen visual conventions.
 */

import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Modal, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { PRIVACY_POLICY_URL } from "../lib/links"
import { theme } from "../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface Props {
  visible: boolean
  onAllow: () => void
  onDecline: () => void
}

export function TelemetryConsentModal({ visible, onAllow, onDecline }: Props) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={[styles.card, isDark && styles.cardDark]} testID="telemetry-consent-card">
          {/* Icon */}
          <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
            <Ionicons name="bug-outline" size={40} color={light.infoBlue} />
          </View>

          {/* Title */}
          <Text style={[styles.title, isDark && styles.textDark]}>{t("telemetryConsent.title")}</Text>

          {/* Body */}
          <Text style={[styles.body, isDark && styles.bodyDark]}>{t("telemetryConsent.body")}</Text>

          {/* Detail bullets */}
          <View style={styles.bullets}>
            <BulletRow icon="checkmark-circle" text={t("telemetryConsent.bullets.deviceInfo")} isDark={isDark} positive />
            <BulletRow
              icon="checkmark-circle"
              text={t("telemetryConsent.bullets.stackTraces")}
              isDark={isDark}
              positive
            />
            <BulletRow
              icon="checkmark-circle"
              text={t("telemetryConsent.bullets.usageEvents")}
              isDark={isDark}
              positive
            />
            <BulletRow
              icon="close-circle"
              text={t("telemetryConsent.bullets.noCode")}
              isDark={isDark}
              positive={false}
            />
            <BulletRow
              icon="close-circle"
              text={t("telemetryConsent.bullets.noServerUrls")}
              isDark={isDark}
              positive={false}
            />
          </View>

          {/* Privacy policy link */}
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            accessibilityLabel={t("telemetryConsent.privacyLink")}
          >
            <Text style={styles.privacyLink}>{t("telemetryConsent.privacyLink")}</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnDecline, isDark && styles.btnDeclineDark]}
              onPress={onDecline}
              accessibilityRole="button"
              accessibilityLabel={t("telemetryConsent.declineA11yLabel")}
              testID="telemetry-decline-button"
            >
              <Text style={[styles.btnDeclineText, isDark && styles.btnDeclineTextDark]}>
                {t("telemetryConsent.declineButton")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnAllow]}
              onPress={onAllow}
              accessibilityRole="button"
              accessibilityLabel={t("telemetryConsent.allowA11yLabel")}
              testID="telemetry-allow-button"
            >
              <Text style={styles.btnAllowText}>{t("telemetryConsent.allowButton")}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footnote, isDark && styles.footnoteDark]}>{t("telemetryConsent.footnote")}</Text>
        </View>
      </View>
    </Modal>
  )
}

function BulletRow({
  icon,
  text,
  isDark,
  positive,
}: {
  icon: "checkmark-circle" | "close-circle"
  text: string
  isDark: boolean
  positive: boolean
}) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons
        name={icon}
        size={18}
        color={positive ? light.success : light.danger}
        style={styles.bulletIcon}
      />
      <Text style={[styles.bulletText, isDark && styles.bodyDark]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: light.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: light.white,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 440,
    shadowColor: light.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10,
  },
  cardDark: {
    backgroundColor: dark.surfaceRaised,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: light.telemIconBg,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  iconWrapDark: {
    backgroundColor: dark.telemIconBg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: light.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  textDark: {
    color: dark.telemTitle,
  },
  body: {
    fontSize: 15,
    color: light.telemBody,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  bodyDark: {
    color: dark.telemBody,
  },
  bullets: {
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 10,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 14,
    color: light.telemBody,
    flex: 1,
    lineHeight: 20,
  },
  privacyLink: {
    color: light.infoBlue,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDecline: {
    backgroundColor: light.telemBtnBg,
  },
  btnDeclineDark: {
    backgroundColor: dark.telemBtnBg,
  },
  btnDeclineText: {
    color: light.telemBody,
    fontWeight: "600",
    fontSize: 16,
  },
  btnDeclineTextDark: {
    color: dark.telemBody,
  },
  btnAllow: {
    backgroundColor: light.infoBlue,
  },
  btnAllowText: {
    color: light.white,
    fontWeight: "700",
    fontSize: 16,
  },
  footnote: {
    fontSize: 12,
    color: light.telemFootnote,
    textAlign: "center",
  },
  footnoteDark: {
    color: dark.telemFootnote,
  },
})
