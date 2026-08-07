import { StyleSheet, View, Text, FlatList, ActivityIndicator, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native"
import type { RefObject } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { theme } from "../../lib/theme"
import type { Message, Part } from "../../lib/sdk"
// Direct file import (not the chat barrel) so jest doesn't pull the
// bottom-sheet/reanimated graph through the barrel's re-exports.
import { MessageBubble } from "../chat/MessageBubble"
import { JumpToLatest } from "./JumpToLatest"

export interface MessageListItem {
  message: Message
  parts: Part[]
}

interface Props {
  data: MessageListItem[]
  isDark: boolean
  listRef?: RefObject<FlatList<MessageListItem> | null>
  loadingMore: boolean
  onLoadMore: () => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  showScrollButton: boolean
  onScrollToBottom: () => void
  onLongPress: (messageID: string) => void
}

export function MessageList({
  data,
  isDark,
  listRef,
  loadingMore,
  onLoadMore,
  onScroll,
  showScrollButton,
  onScrollToBottom,
  onLongPress,
}: Props) {
  const { t } = useTranslation()
  return (
    <View style={s.listWrap}>
      <FlatList
        ref={listRef}
        data={data}
        inverted
        keyExtractor={(item) => item.message.id}
        // Virtualization tuning for long streaming sessions. Default
        // windowSize (21) keeps ~21 screens of rows mounted — halving
        // it cuts the per-update diff cost during token streaming.
        // updateCellsBatchingPeriod slightly below default keeps new
        // streamed rows appearing promptly. removeClippedSubviews is
        // deliberately left alone (buggy with inverted lists +
        // maintainVisibleContentPosition), and getItemLayout is unusable
        // here since markdown rows are variable-height.
        windowSize={11}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={40}
        renderItem={({ item }) => (
          <MessageBubble message={item.message} parts={item.parts} isDark={isDark} onLongPress={onLongPress} />
        )}
        contentContainerStyle={s.messageList}
        onScroll={onScroll}
        scrollEventThrottle={100}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        // Prevent jump when older messages are prepended
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListFooterComponent={
          loadingMore ? (
            <View style={s.loadingMore}>
              <ActivityIndicator
                size="small"
                color={isDark ? theme.colors.dark.textMuted : theme.colors.light.textSecondary}
              />
              <Text style={[s.loadingMoreText, isDark && s.metaDark]}>{t("session.loadingOlder")}</Text>
            </View>
          ) : null
        }
      />
      {/* Empty state rendered OUTSIDE the inverted list to avoid the
          inverted transform mirroring its text/icon (see #ui-mirror). */}
      {data.length === 0 && (
        <View style={s.emptyOverlay} pointerEvents="none">
          <Ionicons
            name="chatbubble-outline"
            size={48}
            color={isDark ? theme.colors.dark.textMuted : theme.colors.light.border}
          />
          <Text style={[s.emptyText, isDark && s.metaDark]}>{t("session.empty.title")}</Text>
          <Text style={[s.emptyHint, isDark && s.metaDark]}>{t("session.empty.hint")}</Text>
        </View>
      )}
      {showScrollButton && <JumpToLatest visible onPress={onScrollToBottom} isDark={isDark} />}
    </View>
  )
}

const s = StyleSheet.create({
  listWrap: { flex: 1, position: "relative" },

  // Messages
  messageList: { padding: 16, paddingBottom: 8 },

  // Loading more (appears at top in inverted list = ListFooterComponent)
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: { fontSize: 13, color: theme.colors.light.textMuted },

  // Empty state overlay — sits on top of the (empty) inverted list,
  // untransformed, so its text/icon render upright and un-mirrored on Android.
  emptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: { fontSize: 16, color: theme.colors.light.textMuted, marginTop: 12 },
  emptyHint: { fontSize: 13, color: theme.colors.light.textMuted, marginTop: 4 },
  metaDark: { color: theme.colors.dark.textSecondary },
})