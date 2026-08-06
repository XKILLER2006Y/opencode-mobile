import { useState } from "react"
import { theme } from "../../src/lib/theme"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useConnections } from "../../src/stores/connections"
import { useEvents } from "../../src/stores/events"
import type { ConnectionType } from "../../src/lib/types"
import { probeConnection, shareReport } from "../../src/lib/diagnostics"
import { captureDiagnostic } from "../../src/lib/sentry"
import { parseUrl } from "../../src/lib/diagnostics-classify"
import { buildAuth } from "../../src/lib/auth"

// labelKey (not literal text): this is a module-level constant evaluated
// before i18next is guaranteed ready, so the label is resolved with t() at
// render time — same pattern as categoryMeta in src/lib/notifications.ts.
const CONNECTION_TYPES: Array<{
  type: ConnectionType
  labelKey: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  { type: "local", labelKey: "connection.shared.types.local", icon: "wifi" },
  { type: "tunnel", labelKey: "connection.shared.types.tunnel", icon: "globe" },
  { type: "cloud", labelKey: "connection.shared.types.cloud", icon: "cloud" },
]

export default function EditConnectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  const { connections, updateConnection, removeConnection, testConnection } = useConnections()

  const connection = connections.find((c) => c.id === id)

  const [type, setType] = useState<ConnectionType>(connection?.type || "local")
  const [name, setName] = useState(connection?.name || "")
  const [url, setUrl] = useState(connection?.url || "")
  const [directory, setDirectory] = useState(connection?.directory || "")
  const [username, setUsername] = useState(connection?.username || "")
  const [password, setPassword] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Seed the form from the connection when it first arrives — deep links can
  // mount this screen before the connections store finishes loading. The
  // store replaces the connection object on every write, so key the sync on
  // the id: a save (or any store write) must never reset an in-progress edit.
  const [syncedId, setSyncedId] = useState<string | null>(null)
  if (connection && connection.id !== syncedId) {
    setSyncedId(connection.id)
    setType(connection.type)
    setName(connection.name)
    setUrl(connection.url)
    setDirectory(connection.directory || "")
    setUsername(connection.username || "")
  }

  if (!connection) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.center]}>
        <Text style={[styles.errorText, isDark && styles.textDark]}>{t("connection.edit.notFound")}</Text>
      </View>
    )
  }

  const handleTest = async () => {
    if (!url.trim()) {
      Alert.alert(t("common.error"), t("connection.shared.alerts.enterUrl"))
      return
    }
    if (!parseUrl(url).valid) {
      Alert.alert(t("connection.shared.alerts.invalidUrlTitle"), t("connection.shared.alerts.invalidUrlMessage"))
      return
    }

    setIsTesting(true)
    const result = await testConnection(
      {
        id: connection.id,
        name: name || "Test",
        type,
        url: url.trim(),
        directory: directory.trim() || undefined,
        username: username.trim() || undefined,
      },
      "edit_test",
      password || undefined,
    )

    if (result.ok) {
      setIsTesting(false)
      Alert.alert(t("connection.edit.alerts.successTitle"), t("connection.edit.alerts.successMessage"))
      return
    }

    // Failed: run active diagnostics, capture to Sentry, offer a shareable report.
    const report = await probeConnection(url.trim(), buildAuth(username, password))
    captureDiagnostic(report)
    setIsTesting(false)

    Alert.alert(
      t("connection.shared.alerts.connectionFailedTitle"),
      t("connection.edit.alerts.connectionFailedMessage", {
        summary: report.summary,
        detail: result.error || t("connection.edit.alerts.noDetail"),
      }),
      [
        { text: t("common.ok"), style: "cancel" },
        { text: t("common.shareReport"), onPress: () => shareReport(report) },
      ],
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("connection.shared.alerts.enterName"))
      return
    }
    if (!url.trim()) {
      Alert.alert(t("common.error"), t("connection.shared.alerts.enterUrl"))
      return
    }
    if (!parseUrl(url).valid) {
      Alert.alert(t("connection.shared.alerts.invalidUrlTitle"), t("connection.shared.alerts.invalidUrlMessage"))
      return
    }

    setIsSaving(true)
    try {
      await updateConnection(
        connection.id,
        {
          name: name.trim(),
          type,
          url: url.trim(),
          directory: directory.trim() || undefined,
          username: username.trim() || undefined,
        },
        // Empty = keep existing password (the field loads blank); a typed value
        // rotates it in SecureStore.
        password || undefined,
      )
      // If this was the active connection, the SSE loop may have stopped
      // retrying after a prior 401 (see events.ts) — reconnect now with the
      // freshly saved credentials instead of leaving the user stuck until
      // they relaunch the app.
      if (useConnections.getState().activeConnection?.id === connection.id) {
        useEvents.getState().connect()
      }
      setIsSaving(false)
      router.back()
    } catch {
      setIsSaving(false)
      Alert.alert(
        t("connection.shared.alerts.saveFailedTitle"),
        t("connection.shared.alerts.saveFailedMessage"),
      )
    }
  }

  const handleDelete = () => {
    Alert.alert(t("connection.edit.alerts.deleteTitle"), t("connection.edit.alerts.deleteMessage", { name: connection.name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await removeConnection(connection.id)
          router.back()
        },
      },
    ])
  }

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Connection Type */}
      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.shared.connectionType")}</Text>
      <View style={styles.typeContainer}>
        {CONNECTION_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.type}
            style={[
              styles.typeOption,
              isDark && styles.typeOptionDark,
              type === opt.type && styles.typeOptionSelected,
              type === opt.type && isDark && styles.typeOptionSelectedDark,
            ]}
            onPress={() => setType(opt.type)}
            accessibilityRole="button"
            accessibilityLabel={t(opt.labelKey)}
            accessibilityState={{ selected: type === opt.type }}
          >
            <Ionicons
              name={opt.icon}
              size={20}
              color={type === opt.type ? (isDark ? theme.colors.dark.bgApp : theme.colors.light.surface) : isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
            />
            <Text
              style={[
                styles.typeLabel,
                isDark && styles.textDark,
                type === opt.type && styles.typeLabelSelected,
                type === opt.type && isDark && styles.typeLabelSelectedDark,
              ]}
            >
              {t(opt.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Name */}
      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.shared.name")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder={t("connection.shared.namePlaceholder")}
        placeholderTextColor={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted}
        value={name}
        onChangeText={setName}
        accessibilityLabel={t("connection.shared.name")}
      />

      {/* URL */}
      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.shared.serverUrl")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="http://192.168.1.100:4096"
        placeholderTextColor={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel={t("connection.shared.serverUrl")}
      />

      {/* Directory */}
      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.shared.directoryOptional")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="/path/to/project"
        placeholderTextColor={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted}
        value={directory}
        onChangeText={setDirectory}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={t("connection.shared.directoryOptional")}
      />
      <Text style={[styles.hint, isDark && styles.hintDark]}>{t("connection.edit.directoryHint")}</Text>

      {/* Auth */}
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t("connection.shared.authentication")}</Text>

      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.shared.username")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="admin"
        placeholderTextColor={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={t("connection.shared.username")}
      />

      <Text style={[styles.label, isDark && styles.labelDark]}>{t("connection.edit.passwordLabel")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="••••••••"
        placeholderTextColor={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel={t("connection.edit.passwordLabel")}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.testButton, isDark && styles.testButtonDark]}
          onPress={handleTest}
          disabled={isTesting}
          accessibilityRole="button"
          accessibilityLabel={t("connection.edit.testButton")}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={isDark ? theme.colors.dark.textPrimary : theme.colors.light.textPrimary} />
          ) : (
            <>
              <Ionicons name="pulse" size={20} color={isDark ? theme.colors.dark.textPrimary : theme.colors.light.textPrimary} />
              <Text style={[styles.testButtonText, isDark && styles.textDark]}>{t("connection.edit.testButton")}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isDark && styles.saveButtonDark]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={t("connection.edit.saveButton")}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={isDark ? theme.colors.dark.bgApp : theme.colors.light.surface} />
          ) : (
            <Text style={[styles.saveButtonText, isDark && styles.saveButtonTextDark]}>
              {t("connection.edit.saveButton")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={t("connection.edit.deleteButton")}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.light.statusError} />
          <Text style={styles.deleteButtonText}>{t("connection.edit.deleteButton")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light.surface,
  },
  containerDark: {
    backgroundColor: theme.colors.dark.bgApp,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.light.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  labelDark: {
    color: theme.colors.dark.textPrimary,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.light.surfaceElevated,
    gap: 6,
  },
  typeOptionDark: {
    backgroundColor: theme.colors.dark.border,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.light.textPrimary,
  },
  typeOptionSelectedDark: {
    backgroundColor: theme.colors.dark.textPrimary,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.light.textSecondary,
  },
  textDark: {
    color: theme.colors.dark.textPrimary,
  },
  typeLabelSelected: {
    color: theme.colors.light.surface,
  },
  typeLabelSelectedDark: {
    color: theme.colors.dark.bgApp,
  },
  input: {
    backgroundColor: theme.colors.light.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.light.textPrimary,
  },
  inputDark: {
    backgroundColor: theme.colors.dark.border,
    color: theme.colors.dark.textPrimary,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.light.textSecondary,
    marginTop: 6,
  },
  hintDark: {
    color: theme.colors.dark.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.light.textPrimary,
    marginTop: 32,
    marginBottom: 8,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.light.border,
  },
  testButtonDark: {
    borderColor: theme.colors.dark.textSecondary,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.light.textPrimary,
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.light.textPrimary,
  },
  saveButtonDark: {
    backgroundColor: theme.colors.dark.textPrimary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.light.surface,
  },
  saveButtonTextDark: {
    color: theme.colors.dark.bgApp,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.06)",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.light.statusError,
  }})
