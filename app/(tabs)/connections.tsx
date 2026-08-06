import { useEffect, useState } from "react"
import { theme } from "../../src/lib/theme"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme, Alert } from "react-native"
import * as Clipboard from "expo-clipboard"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useConnections } from "../../src/stores/connections"
import { useSettings } from "../../src/stores/settings"
import type { ServerConnection } from "../../src/lib/types"
import { INSTALL_COMMAND } from "../../src/lib/connect-qr"
import { hapticTap } from "../../src/lib/haptics"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const

function ConnectionItem({
  connection,
  isDark,
  isActive,
  health,
  onSelect,
  onEdit,
  onDelete,
}: {
  connection: ServerConnection
  isDark: boolean
  isActive: boolean
  health: boolean | undefined
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const typeIcon = connection.type === "local" ? "wifi" : connection.type === "tunnel" ? "globe" : "cloud"
  // Green = healthy, amber = ping failed (unreachable/unauthorized), gray = unknown
  const dotColor = health === true ? theme.colors.light.statusSuccess : health === false ? theme.colors.light.healthWarn : theme.colors.light.textMuted

  const handleLongPress = () => {
    Alert.alert(connection.name, t("connectionsList.actionsAlert.message"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("connectionsList.actionsAlert.edit"), onPress: onEdit },
      { text: t("common.delete"), style: "destructive", onPress: onDelete },
    ])
  }

  return (
    <TouchableOpacity
      style={[
        styles.connectionItem,
        isDark && styles.connectionItemDark,
        isActive && styles.connectionItemActive,
        isActive && isDark && styles.connectionItemActiveDark,
      ]}
      onPress={onSelect}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={connection.name}
      accessibilityHint={t("connectionsList.longPressHint")}
    >
      <View style={styles.connectionIcon}>
        <Ionicons name={typeIcon} size={24} color={isActive ? theme.colors.light.statusSuccess : isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary} />
        <View
          style={[styles.healthDot, isDark && styles.healthDotDark, { backgroundColor: dotColor }]}
          testID={`health-dot-${connection.id}`}
          accessible={true}
          accessibilityLabel={
            health === true
              ? t("connectionsList.health.healthy")
              : health === false
                ? t("connectionsList.health.unreachable")
                : t("connectionsList.health.unknown")
          }
        />
      </View>
      <View style={styles.connectionContent}>
        <View style={styles.connectionHeader}>
          <Text
            numberOfLines={1}
            style={[
              styles.connectionName,
              isDark && styles.textDark,
              isActive && styles.connectionNameActive,
              isActive && isDark && styles.connectionNameActiveDark,
            ]}
          >
            {connection.name}
          </Text>
          {isActive && (
            <View style={[styles.activeBadge, isDark && styles.activeBadgeDark]}>
              <Text style={[styles.activeBadgeText, isDark && styles.activeBadgeTextDark]}>
                {t("connectionsList.activeBadge")}
              </Text>
            </View>
          )}
          {connection.tunnelMode && (
            <View
              style={[styles.modeBadge, connection.tunnelMode === "quick" ? styles.modeBadgeQuick : styles.modeBadgeNamed]}
            >
              <Text style={styles.modeBadgeText}>
                {connection.tunnelMode === "quick"
                  ? t("connectionsList.modeBadges.quick")
                  : t("connectionsList.modeBadges.stable")}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.connectionUrl, isDark && styles.metaDark, isActive && styles.connectionUrlActive]}
          numberOfLines={1}
        >
          {connection.url}
        </Text>
        {connection.lastConnected && (
          <Text style={[styles.connectionMeta, isDark && styles.metaDark]}>
            {t("connectionsList.lastConnected", { date: new Date(connection.lastConnected).toLocaleDateString() })}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={t("connectionsList.actionsAlert.edit")}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

function ExposeCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(INSTALL_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={[styles.exposeCard, isDark && styles.exposeCardDark]}>
      <View style={styles.exposeHeader}>
        <Ionicons name="globe-outline" size={22} color={theme.colors.light.indigo} />
        <Text style={[styles.exposeTitle, isDark && styles.textDark]}>{t("connectionsList.exposeCard.title")}</Text>
      </View>
      <Text style={[styles.exposeSubtitle, isDark && styles.metaDark]}>
        {t("connectionsList.exposeCard.subtitle")}
      </Text>
      <Text style={[styles.exposeCommandLabel, isDark && styles.metaDark]}>
        {t("connectionsList.exposeCard.commandLabel")}
      </Text>
      <View style={styles.commandRow}>
        <View style={[styles.commandBox, isDark && styles.commandBoxDark]}>
          <Text style={[styles.commandText, isDark && styles.commandTextDark]} numberOfLines={2}>
            {INSTALL_COMMAND}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => void handleCopy()}
          testID="expose-copy-button"
          accessibilityRole="button"
          accessibilityLabel={t("connectionsList.exposeCard.copy")}
        >
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={theme.colors.light.indigo} />
          <Text style={styles.copyButtonText}>
            {copied ? t("connectionsList.exposeCard.copied") : t("connectionsList.exposeCard.copy")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ConnectionsScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { t } = useTranslation()

  const { connections, activeConnection, setActiveConnection, removeConnection, pingHealth } = useConnections()
  const { pageSize, setPageSize } = useSettings()

  // Ping every saved connection on mount so rows show live health: green for
  // reachable, amber for failed (unreachable/unauthorized), gray while unknown.
  const [health, setHealth] = useState<Record<string, boolean>>({})
  useEffect(() => {
    let cancelled = false
    const pings = connections.map(async (c) => {
      const ok = await pingHealth(c.id)
      if (!cancelled) setHealth((prev) => ({ ...prev, [c.id]: ok }))
    })
    void Promise.all(pings)
    return () => {
      cancelled = true
    }
  }, [connections, pingHealth])

  const handleDelete = (connection: ServerConnection) => {
    Alert.alert(
      t("connection.edit.alerts.deleteTitle"),
      t("connection.edit.alerts.deleteMessage", { name: connection.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => removeConnection(connection.id),
        },
      ],
    )
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConnectionItem
            connection={item}
            isDark={isDark}
            isActive={activeConnection?.id === item.id}
            health={health[item.id]}
            onSelect={() => setActiveConnection(item.id)}
            onEdit={() => router.push(`/connection/${item.id}`)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="server-outline" size={64} color={isDark ? theme.colors.dark.textMuted : theme.colors.light.border} />
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>{t("connectionsList.empty.title")}</Text>
            <Text style={[styles.emptySubtitle, isDark && styles.metaDark]}>
              {t("connectionsList.empty.subtitle")}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <ExposeCard isDark={isDark} />
            <TouchableOpacity
              style={[styles.scanButton, isDark && styles.scanButtonDark]}
              onPress={() => router.push("/connect/scan")}
              testID="scan-to-connect-button"
              accessibilityRole="button"
            >
              <Ionicons name="qr-code-outline" size={20} color={isDark ? theme.colors.dark.bgApp : theme.colors.light.surface} />
              <Text style={[styles.scanButtonText, isDark && styles.scanButtonTextDark]}>
                {t("connectionsList.scan")}
              </Text>
            </TouchableOpacity>
            <View style={[styles.header, isDark && styles.headerDark]}>
              <Text style={[styles.headerText, isDark && styles.metaDark]}>{t("connectionsList.header")}</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.settingsSection, isDark && styles.settingsSectionDark]}>
            <Text style={[styles.settingsTitle, isDark && styles.textDark]}>
              {t("connectionsList.preferences.title")}
            </Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Ionicons name="layers-outline" size={18} color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary} />
                <Text style={[styles.settingText, isDark && styles.textDark]}>
                  {t("connectionsList.preferences.pageSizeLabel")}
                </Text>
              </View>
              <View style={styles.pagePicker}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.pageOption,
                      isDark && styles.pageOptionDark,
                      pageSize === size && styles.pageOptionActive,
                      pageSize === size && isDark && styles.pageOptionActiveDark,
                    ]}
                    onPress={() => setPageSize(size)}
                    accessibilityRole="button"
                    accessibilityLabel={t("connectionsList.preferences.pageSizeOption", { size })}
                    accessibilityState={{ selected: pageSize === size }}
                  >
                    <Text
                      style={[
                        styles.pageOptionText,
                        isDark && styles.metaDark,
                        pageSize === size && styles.pageOptionTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.settingHint, isDark && styles.metaDark]}>
              {t("connectionsList.preferences.pageSizeHint")}
            </Text>
          </View>
        }
        contentContainerStyle={
          connections.length === 0 ? [styles.emptyContent, styles.fabClearance] : styles.fabClearance
        }
      />

      {/* FAB to add connection */}
      <TouchableOpacity
        style={[styles.fab, isDark && styles.fabDark]}
        onPress={() => {
          hapticTap()
          router.push("/connection/add")
        }}
        accessibilityRole="button"
        accessibilityLabel={t("nav.addConnectionTitle")}
      >
        <Ionicons name="add" size={28} color={isDark ? theme.colors.dark.bgApp : theme.colors.light.surface} />
      </TouchableOpacity>
    </View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.border,
  },
  headerDark: {
    borderBottomColor: theme.colors.dark.border,
  },
  headerText: {
    fontSize: 13,
    color: theme.colors.light.textSecondary,
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.light.surface,
    borderWidth: 1,
    borderColor: theme.colors.light.borderSubtle,
  },
  connectionItemDark: {
    backgroundColor: theme.colors.dark.surface,
    borderColor: theme.colors.dark.surfaceElevated,
  },
  connectionItemActive: {
    borderColor: "rgba(34, 197, 94, 0.4)",
    backgroundColor: "rgba(34, 197, 94, 0.04)",
  },
  connectionItemActiveDark: {
    borderColor: "rgba(34, 197, 94, 0.3)",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  connectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.light.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  connectionContent: {
    flex: 1,
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.light.textPrimary,
  },
  connectionNameActive: {
    color: theme.colors.light.textPrimary,
  },
  connectionNameActiveDark: {
    color: theme.colors.dark.textPrimary,
  },
  textDark: {
    color: theme.colors.dark.textPrimary,
  },
  activeBadge: {
    backgroundColor: theme.colors.light.statusSuccess,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeDark: {
    backgroundColor: theme.colors.dark.statusSuccess,
  },
  activeBadgeText: {
    color: theme.colors.light.surface,
    fontSize: 11,
    fontWeight: "600",
  },
  activeBadgeTextDark: {
    color: theme.colors.dark.textPrimary,
  },
  connectionUrl: {
    fontSize: 13,
    color: theme.colors.light.textSecondary,
    marginTop: 2,
  },
  connectionUrlActive: {
    color: theme.colors.light.textSecondary,
  },
  connectionMeta: {
    fontSize: 12,
    color: theme.colors.light.textMuted,
    marginTop: 4,
  },
  metaDark: {
    color: theme.colors.dark.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    color: theme.colors.light.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  emptyContent: {
    flex: 1,
  },
  // Absolute FAB (56px + 16px bottom inset) floats over list content; without
  // this, the footer (page-size pills / last connection) sits under the FAB.
  fabClearance: {
    paddingBottom: 96,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.light.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.light.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabDark: {
    backgroundColor: theme.colors.dark.textPrimary,
  },
  healthDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.light.surface,
  },
  healthDotDark: {
    borderColor: theme.colors.dark.surface,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeQuick: {
    backgroundColor: theme.colors.light.healthWarn,
  },
  modeBadgeNamed: {
    backgroundColor: theme.colors.light.indigo,
  },
  modeBadgeText: {
    color: theme.colors.light.surface,
    fontSize: 11,
    fontWeight: "600",
  },
  exposeCard: {
    backgroundColor: theme.colors.light.indigoBg,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.light.indigo,
  },
  exposeCardDark: {
    backgroundColor: theme.colors.dark.indigoBg,
    borderColor: theme.colors.dark.indigo,
  },
  exposeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exposeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.light.textPrimary,
  },
  exposeSubtitle: {
    fontSize: 13,
    color: theme.colors.light.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  exposeCommandLabel: {
    fontSize: 12,
    color: theme.colors.light.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  commandRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  commandBox: {
    flex: 1,
    backgroundColor: theme.colors.light.indigoBox,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  commandBoxDark: {
    backgroundColor: theme.colors.dark.indigoBox,
  },
  commandText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: theme.colors.light.indigo,
    lineHeight: 16,
  },
  commandTextDark: {
    color: theme.colors.dark.indigo,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.light.indigoBox,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.light.indigo,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.light.textPrimary,
    marginHorizontal: 16,
    marginTop: 16,
  },
  scanButtonDark: {
    backgroundColor: theme.colors.dark.textPrimary,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.light.surface,
  },
  scanButtonTextDark: {
    color: theme.colors.dark.bgApp,
  },
  settingsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.light.border,
    marginTop: 16,
    gap: 10,
  },
  settingsSectionDark: {
    borderTopColor: theme.colors.dark.border,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.light.textPrimary,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingText: {
    fontSize: 14,
    color: theme.colors.light.textPrimary,
  },
  pagePicker: {
    flexDirection: "row",
    gap: 6,
  },
  pageOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.light.border,
    backgroundColor: theme.colors.light.surfaceElevated,
  },
  pageOptionDark: {
    borderColor: theme.colors.dark.surfaceElevated,
    backgroundColor: theme.colors.dark.border,
  },
  pageOptionActive: {
    backgroundColor: theme.colors.light.textPrimary,
    borderColor: theme.colors.light.textPrimary,
  },
  pageOptionActiveDark: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  pageOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.light.textSecondary,
  },
  pageOptionTextActive: {
    color: theme.colors.light.surface,
  },
  settingHint: {
    fontSize: 12,
    color: theme.colors.light.textMuted,
  }})
