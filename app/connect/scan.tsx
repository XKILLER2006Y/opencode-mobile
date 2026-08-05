import { useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera"
import { useConnections } from "../../src/stores/connections"
import { useOnboarding } from "../../src/stores/onboarding"
import { parseConnectPayload, type ConnectPayload } from "../../src/lib/connect-qr"

export default function ConnectScanScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  const { addConnection } = useConnections()
  const [permission, requestPermission] = useCameraPermissions()

  const [payload, setPayload] = useState<ConnectPayload | null>(null)
  const [password, setPassword] = useState("")
  const [invalidQr, setInvalidQr] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // The barcode scanner fires onBarcodeScanned in rapid bursts for the same
  // QR. This ref stops re-processing while the state updates flush.
  const handledRef = useRef(false)

  const saveConnection = async (parsed: ConnectPayload, pw: string | undefined) => {
    setIsConnecting(true)
    try {
      await addConnection(
        {
          name: parsed.name,
          type: "tunnel",
          url: parsed.url,
          tunnelMode: parsed.mode,
        },
        pw,
      )
      // First-launch flow: a successful connection counts as onboarding
      // completion. complete() flips the root gate to the normal Stack
      // before back() lands — the modal stays valid (both Stacks register
      // connect/scan), then back pops onto (tabs).
      await useOnboarding.getState().complete()
      router.back()
    } catch {
      setIsConnecting(false)
      handledRef.current = false
      setPayload(null)
      Alert.alert(t("connectScan.errors.saveFailedTitle"), t("connectScan.errors.saveFailedMessage"))
    }
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (handledRef.current) return
    const parsed = parseConnectPayload(result.data)
    if (!parsed) {
      setInvalidQr(true)
      return
    }
    handledRef.current = true
    setInvalidQr(false)
    setPayload(parsed)
    if (!parsed.auth) {
      void saveConnection(parsed, undefined)
    }
  }

  const handleConnectWithPassword = () => {
    if (!payload) return
    void saveConnection(payload, password.trim() || undefined)
  }

  const backToScanning = () => {
    handledRef.current = false
    setPayload(null)
    setPassword("")
  }

  // Permission response is null while the hook resolves the stored answer
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDark ? "#ffffff" : "#0a0a0a"} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, styles.permissionWrap, isDark && styles.containerDark]}>
        <Ionicons name="scan-outline" size={56} color={isDark ? "#ffffff" : "#0a0a0a"} />
        <Text style={[styles.permissionTitle, isDark && styles.textDark]}>{t("connectScan.permissionTitle")}</Text>
        <Text style={[styles.permissionMessage, isDark && styles.hintDark]}>{t("connectScan.permissionMessage")}</Text>
        {permission.canAskAgain ? (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => void requestPermission()}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>{t("connectScan.permissionButton")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => void Linking.openSettings()}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>{t("connectScan.openSettings")}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={[styles.cancelLinkText, isDark && styles.hintDark]}>{t("connectScan.cancelButton")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {!isConnecting && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
          testID="qr-scanner"
        />
      )}

      {!isConnecting && (
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.frameBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hint}>{t("connectScan.hint")}</Text>
          {invalidQr && (
            <View style={styles.invalidBox}>
              <Ionicons name="alert-circle" size={16} color="#fbbf24" />
              <Text style={styles.invalidText}>{t("connectScan.invalidQr")}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            testID="scan-cancel-button"
            accessibilityRole="button"
            accessibilityLabel={t("connectScan.cancelButton")}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {isConnecting && (
        <View style={[styles.container, styles.centered, isDark && styles.containerDark]}>
          <ActivityIndicator size="large" color={isDark ? "#ffffff" : "#0a0a0a"} />
          <Text style={[styles.connectingText, isDark && styles.textDark]}>{t("connectScan.connecting")}</Text>
        </View>
      )}

      {payload?.auth && !isConnecting && (
        <View style={[styles.passwordSheet, isDark && styles.passwordSheetDark]}>
          <Text style={[styles.passwordTitle, isDark && styles.textDark]}>{t("connectScan.passwordTitle")}</Text>
          <Text style={[styles.passwordHint, isDark && styles.hintDark]}>
            {t("connectScan.passwordHint", { name: payload.name })}
          </Text>
          <Text style={[styles.passwordUrl, isDark && styles.hintDark]} numberOfLines={1}>
            {payload.url}
          </Text>
          <TextInput
            style={[styles.passwordInput, isDark && styles.inputDark]}
            placeholder={t("connectScan.passwordPlaceholder")}
            placeholderTextColor={isDark ? "#666666" : "#999999"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="scan-password-input"
            accessibilityLabel={t("connectScan.passwordPlaceholder")}
          />
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectWithPassword}
            testID="scan-connect-button"
            accessibilityRole="button"
          >
            <Ionicons name="flash" size={18} color="#ffffff" />
            <Text style={styles.connectButtonText}>{t("connectScan.connectButton")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.passwordCancel} onPress={backToScanning} accessibilityRole="button">
            <Text style={[styles.passwordCancelText, isDark && styles.hintDark]}>{t("connectScan.cancelButton")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  textDark: {
    color: "#ffffff",
  },
  hintDark: {
    color: "#888888",
  },
  permissionWrap: {
    backgroundColor: "#ffffff",
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0a0a0a",
    marginTop: 16,
  },
  permissionMessage: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  cancelLink: {
    paddingVertical: 16,
  },
  cancelLinkText: {
    fontSize: 14,
    color: "#666666",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  frameBox: {
    width: 260,
    height: 260,
  },
  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#ffffff",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  hint: {
    fontSize: 15,
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 28,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  invalidBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    marginHorizontal: 24,
  },
  invalidText: {
    flex: 1,
    fontSize: 13,
    color: "#ffffff",
    lineHeight: 18,
  },
  cancelButton: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectingText: {
    fontSize: 15,
    color: "#0a0a0a",
    marginTop: 12,
  },
  passwordSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  passwordSheetDark: {
    backgroundColor: "#1a1a1a",
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  passwordHint: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginTop: 6,
  },
  passwordUrl: {
    fontSize: 13,
    color: "#666666",
    marginTop: 4,
    marginBottom: 14,
  },
  passwordInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0a0a0a",
  },
  inputDark: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#0a0a0a",
    marginTop: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  passwordCancel: {
    alignItems: "center",
    paddingVertical: 10,
  },
  passwordCancelText: {
    fontSize: 14,
    color: "#666666",
  },
})
