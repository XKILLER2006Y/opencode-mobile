import { useMemo } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import type { Message, Session } from "../../lib/sdk"
import type { Provider } from "../../stores/catalog"
import { createSessionStatsAccumulator } from "../../lib/session-stats"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface Props {
  session: Session | null
  messages: Message[]
  providers: Provider[]
  visible: boolean
  isDark: boolean
  hasMore: boolean
  loadingAll: boolean
  onLoadAll: () => void
  onScrollToTop: () => void
  onClose: () => void
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatCost(cost: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cost)
}

function formatTime(ts: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return t("chat.sessionInfo.time.justNow")
  if (mins < 60) return t("chat.sessionInfo.time.minutesAgo", { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t("chat.sessionInfo.time.hoursAgo", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t("chat.sessionInfo.time.daysAgo", { count: days })
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function SessionInfo({
  session,
  messages,
  providers,
  visible,
  isDark,
  hasMore,
  loadingAll,
  onLoadAll,
  onScrollToTop,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  // Session-wide usage: cumulative cost + cumulative token breakdown, with
  // the context limit taken from the last assistant message's model. Built
  // incrementally O(1)/push instead of re-scanning all messages on every
  // store update (which was O(n²) over a long streaming session).
  const stats = useMemo(() => {
    const acc = createSessionStatsAccumulator()
    let last: Message | null = null
    for (const msg of messages) {
      acc.push(msg)
      if (msg.role === "assistant" && msg.tokens && msg.tokens.output > 0) last = msg
    }

    // Find context limit from provider catalog (last assistant message's model)
    let context = 0
    if (last?.providerID && last?.modelID) {
      const provider = providers.find((p) => p.id === last!.providerID)
      const model = provider?.models.find((m) => m.id === last!.modelID)
      context = model?.limit?.context || 0
    }
    acc.setContext(context)
    return acc.get()
  }, [messages, providers])

  if (!visible) return null

  const hasTokens = stats.total > 0
  const hasCost = stats.cost > 0
  const summary = session?.summary
  const created = session?.time.created
  const updated = session?.time.updated

  return (
    <View style={[s.container, isDark && s.containerDark]}>
      {/* Top row: tokens + context % + cost — matches TUI header */}
      <View style={s.row}>
        <View style={s.costRow}>
          <Ionicons name="stats-chart-outline" size={14} color={colors.iconSecondary} />
          {hasTokens && (
            <Text style={[s.tokens, isDark && s.textDark]}>
              {stats.total.toLocaleString()}
              {stats.percent > 0 && <Text style={[s.percent, isDark && s.dimDark]}>{`  ${stats.percent}%`}</Text>}
            </Text>
          )}
          {hasCost && <Text style={[s.cost, isDark && s.dimDark]}>({formatCost(stats.cost)})</Text>}
          {!hasTokens && !hasCost && (
            <Text style={[s.cost, isDark && s.dimDark]}>{t("chat.sessionInfo.noUsageData")}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("common.close")}>
          <Ionicons name="close" size={16} color={colors.iconSubtle} />
        </TouchableOpacity>
      </View>

      {/* Context bar */}
      {stats.percent > 0 && (
        <View style={[s.bar, isDark && s.barDark]}>
          <View
            style={[
              s.barFill,
              { width: `${Math.min(stats.percent, 100)}%` },
              stats.percent > 80 ? s.barWarn : stats.percent > 50 ? s.barMid : s.barOk,
            ]}
          />
        </View>
      )}

      {/* Token breakdown pills */}
      {hasTokens && (
        <View style={s.breakdown}>
          <TokenPill label={t("chat.sessionInfo.pills.in")} value={stats.input} color={colors.infoBlue} isDark={isDark} />
          <TokenPill label={t("chat.sessionInfo.pills.out")} value={stats.output} color={colors.successGreen} isDark={isDark} />
          {stats.reasoning > 0 && (
            <TokenPill label={t("chat.sessionInfo.pills.think")} value={stats.reasoning} color={colors.amberPill} isDark={isDark} />
          )}
          {stats.cacheRead > 0 && (
            <TokenPill label={t("chat.sessionInfo.pills.cacheRead")} value={stats.cacheRead} color={colors.violet} isDark={isDark} />
          )}
          {stats.cacheWrite > 0 && (
            <TokenPill
              label={t("chat.sessionInfo.pills.cacheWrite")}
              value={stats.cacheWrite}
              color={colors.pinkPill}
              isDark={isDark}
            />
          )}
        </View>
      )}

      {/* Session metadata */}
      <View style={s.meta}>
        {created && (
          <MetaItem icon="time-outline" label={t("chat.sessionInfo.meta.created")} value={formatTime(created, t)} isDark={isDark} />
        )}
        {updated && updated !== created && (
          <MetaItem icon="refresh-outline" label={t("chat.sessionInfo.meta.updated")} value={formatTime(updated, t)} isDark={isDark} />
        )}
        <MetaItem
          icon="chatbubbles-outline"
          label={t("chat.sessionInfo.meta.messages")}
          value={String(messages.length) + (hasMore ? "+" : "")}
          isDark={isDark}
        />
        {summary && summary.files > 0 && (
          <MetaItem
            icon="code-outline"
            label={t("chat.sessionInfo.meta.changes")}
            value={`${summary.files}f +${summary.additions} -${summary.deletions}`}
            isDark={isDark}
          />
        )}
        {session?.share?.url && (
          <MetaItem icon="share-outline" label={t("chat.sessionInfo.meta.shared")} value={t("chat.sessionInfo.meta.yes")} isDark={isDark} />
        )}
      </View>

      {/* Navigation actions */}
      <View style={s.actions}>
        {hasMore && (
          <TouchableOpacity
            style={[s.action, isDark && s.actionDark]}
            onPress={onLoadAll}
            disabled={loadingAll}
            accessibilityRole="button"
            accessibilityLabel={loadingAll ? t("chat.sessionInfo.loading") : t("chat.sessionInfo.loadAllMessages")}
            accessibilityState={{ disabled: loadingAll }}
          >
            {loadingAll ? (
              <ActivityIndicator size="small" color={colors.iconSecondary} />
            ) : (
              <Ionicons name="download-outline" size={14} color={colors.iconSecondary} />
            )}
            <Text style={[s.actionText, isDark && s.dimDark]}>
              {loadingAll ? t("chat.sessionInfo.loading") : t("chat.sessionInfo.loadAllMessages")}
            </Text>
          </TouchableOpacity>
        )}
        {messages.length > 0 && (
          <TouchableOpacity
            style={[s.action, isDark && s.actionDark]}
            onPress={onScrollToTop}
            accessibilityRole="button"
            accessibilityLabel={t("chat.sessionInfo.jumpToBeginning")}
          >
            <Ionicons name="arrow-up-outline" size={14} color={colors.iconSecondary} />
            <Text style={[s.actionText, isDark && s.dimDark]}>{t("chat.sessionInfo.jumpToBeginning")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function MetaItem({ icon, label, value, isDark }: { icon: string; label: string; value: string; isDark: boolean }) {
  const colors = getTheme(isDark)
  return (
    <View style={s.metaItem}>
      <Ionicons name={icon} size={12} color={isDark ? colors.iconFaint : colors.iconSubtle} />
      <Text style={[s.metaLabel, isDark && s.dimDark]}>{label}</Text>
      <Text style={[s.metaValue, isDark && s.metaValueDark]}>{value}</Text>
    </View>
  )
}

function TokenPill({ label, value, color, isDark }: { label: string; value: number; color: string; isDark: boolean }) {
  return (
    <View style={[s.pill, { borderColor: color + "40" }, isDark && { backgroundColor: color + "15" }]}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.pillLabel, isDark && s.dimDark]}>{label}</Text>
      <Text style={[s.pillValue, isDark && s.textDark]}>{compact(value)}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: light.separatorFixed,
    backgroundColor: light.panelBg,
    gap: 8,
  },
  containerDark: {
    borderBottomColor: dark.hairline,
    backgroundColor: dark.panelBg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tokens: {
    fontSize: 14,
    fontWeight: "700",
    color: light.textInk,
    fontVariant: ["tabular-nums"],
  },
  percent: {
    fontSize: 13,
    fontWeight: "500",
  },
  cost: {
    fontSize: 13,
    color: light.dimText,
    fontVariant: ["tabular-nums"],
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: light.separatorFixed,
    overflow: "hidden",
  },
  barDark: {
    backgroundColor: dark.surfaceInput,
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  barOk: { backgroundColor: light.infoBlue },
  barMid: { backgroundColor: light.amberPill },
  barWarn: { backgroundColor: light.danger },
  breakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: light.white,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    fontSize: 11,
    color: light.iconSecondary,
  },
  pillValue: {
    fontSize: 11,
    fontWeight: "600",
    color: light.textInk,
    fontVariant: ["tabular-nums"],
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: light.dimText,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: "600",
    color: light.iconSecondary,
  },
  metaValueDark: {
    color: dark.metaStrong,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: light.white,
    borderWidth: 1,
    borderColor: light.separatorFixed,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionDark: {
    backgroundColor: dark.surfaceRaised,
    borderColor: dark.surfaceInput,
  },
  actionText: {
    fontSize: 12,
    color: light.iconSecondary,
    fontWeight: "500",
  },
  textDark: { color: dark.textInk },
  dimDark: { color: dark.iconSubtle },
})
