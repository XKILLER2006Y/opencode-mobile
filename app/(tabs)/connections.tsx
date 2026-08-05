import { useEffect, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme, Alert } from "react-native"
import * as Clipboard from "expo-clipboard"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useConnections } from "../../src/stores/connections"
import { useSettings } from "../../src/stores/settings"
import type { ServerConnection } from "../../src/lib/types"
import { INSTALL_COMMAND } from "../../src/lib/connect-qr"

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
  const dotColor = health === true ? "#22c55e" : health === false ? "#f59e0b" : "#a1a1aa"

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
    >
      <View style={styles.connectionIcon}>
        <Ionicons name={typeIcon} size={24} color={isActive ? "#22c55e" : isDark ? "#888888" : "#666666"} />
        <View
          style={[styles.healthDot, isDark && styles.healthDotDark, { backgroundColor: dotColor }]}
          testID={`health-dot-${connection.id}`}
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
      <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#666666" : "#999999"} />
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
        <Ionicons name="globe-outline" size={22} color="#6366f1" />
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
        <TouchableOpacity style={styles.copyButton} onPress={() => void handleCopy()} testID="expose-copy-button">
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#6366f1" />
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
            <Ionicons name="server-outline" size={64} color={isDark ? "#444444" : "#cccccc"} />
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
            >
              <Ionicons name="qr-code-outline" size={20} color={isDark ? "#0a0a0a" : "#ffffff"} />
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
                <Ionicons name="layers-outline" size={18} color={isDark ? "#888888" : "#666666"} />
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
        contentContainerStyle={connections.length === 0 ? styles.emptyContent : undefined}
      />

      {/* FAB to add connection */}
      <TouchableOpacity style={[styles.fab, isDark && styles.fabDark]} onPress={() => router.push("/connection/add")}>
        <Ionicons name="add" size={28} color={isDark ? "#0a0a0a" : "#ffffff"} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerDark: {
    backgroundColor: "#0a0a0a",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerDark: {
    borderBottomColor: "#1a1a1a",
  },
  headerText: {
    fontSize: 13,
    color: "#666666",
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  connectionItemDark: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
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
    backgroundColor: "#F4F4F5",
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
    color: "#09090B",
  },
  connectionNameActive: {
    color: "#09090B",
  },
  connectionNameActiveDark: {
    color: "#FAFAFA",
  },
  textDark: {
    color: "#FAFAFA",
  },
  activeBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeDark: {
    backgroundColor: "#16A34A",
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  activeBadgeTextDark: {
    color: "#FFFFFF",
  },
  connectionUrl: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  connectionUrlActive: {
    color: "#71717A",
  },
  connectionMeta: {
    fontSize: 12,
    color: "#A1A1AA",
    marginTop: 4,
  },
  metaDark: {
    color: "#A1A1AA",
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
    color: "#0a0a0a",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  emptyContent: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabDark: {
    backgroundColor: "#ffffff",
  },
  healthDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  healthDotDark: {
    borderColor: "#18181B",
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeQuick: {
    backgroundColor: "#f59e0b",
  },
  modeBadgeNamed: {
    backgroundColor: "#6366f1",
  },
  modeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  exposeCard: {
    backgroundColor: "#f0f0ff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  exposeCardDark: {
    backgroundColor: "#1e1b4b",
    borderColor: "#3730a3",
  },
  exposeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exposeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  exposeSubtitle: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginTop: 6,
  },
  exposeCommandLabel: {
    fontSize: 12,
    color: "#666666",
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
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  commandBoxDark: {
    backgroundColor: "#312e81",
  },
  commandText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#3730a3",
    lineHeight: 16,
  },
  commandTextDark: {
    color: "#c7d2fe",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4338ca",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#0a0a0a",
    marginHorizontal: 16,
    marginTop: 16,
  },
  scanButtonDark: {
    backgroundColor: "#ffffff",
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  scanButtonTextDark: {
    color: "#0a0a0a",
  },
  settingsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    marginTop: 16,
    gap: 10,
  },
  settingsSectionDark: {
    borderTopColor: "#1a1a1a",
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0a0a",
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
    color: "#0a0a0a",
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
    borderColor: "#e5e5e5",
    backgroundColor: "#f5f5f5",
  },
  pageOptionDark: {
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
  },
  pageOptionActive: {
    backgroundColor: "#0a0a0a",
    borderColor: "#0a0a0a",
  },
  pageOptionActiveDark: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  pageOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  pageOptionTextActive: {
    color: "#ffffff",
  },
  settingHint: {
    fontSize: 12,
    color: "#999999",
  },
})
