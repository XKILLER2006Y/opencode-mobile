import { useState, useCallback, useMemo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { useTranslation } from "react-i18next"
import { nameOf } from "../../lib/path-utils"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>
  current?: string
  recents: string[]
  serverHome: string | null
  isDark: boolean
  onSwitch: (directory?: string) => void
  // Opens a browsable folder picker rooted at the server's filesystem, as an
  // alternative to typing a path. Optional so existing callers keep working.
  onBrowse?: () => void
}

export function DirectorySwitcher({ sheetRef, current, recents, serverHome, isDark, onSwitch, onBrowse }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  const [custom, setCustom] = useState("")

  const handleSelect = useCallback(
    (dir?: string) => {
      onSwitch(dir)
      setCustom("")
      sheetRef.current?.close()
    },
    [onSwitch, sheetRef],
  )

  const handleCustomSubmit = useCallback(() => {
    const dir = custom.trim()
    if (!dir) return
    handleSelect(dir)
  }, [custom, handleSelect])

  // Build list: server default + recents (excluding current)
  const items = useMemo(() => {
    const list: Array<{ label: string; dir?: string; active: boolean }> = [
      { label: t("chat.directorySwitcher.serverDefaultLabel"), dir: undefined, active: !current },
    ]
    for (const dir of recents) {
      if (dir === current) continue
      const short = nameOf(dir)
      list.push({ label: short, dir, active: false })
    }
    return list
  }, [recents, current, t])

  const shortCurrent = current ? nameOf(current) : null

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["45%", "70%"]}
      // See DirectoryBrowserSheet.tsx for why this is required alongside
      // static snapPoints (issue #104): without it the sheet can never open.
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={isDark ? s.sheetDark : s.sheet}
      handleIndicatorStyle={{ backgroundColor: colors.handleIndicator }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
      onChange={(idx) => {
        if (idx === -1) setCustom("")
      }}
    >
      <View style={s.header}>
        <Text style={[s.title, isDark && s.white]}>{t("chat.directorySwitcher.title")}</Text>
        {shortCurrent && (
          <View style={s.current}>
            <Ionicons name="folder" size={14} color={colors.violet} />
            <Text style={s.currentText} numberOfLines={1}>
              {shortCurrent}
            </Text>
          </View>
        )}
      </View>

      {/* Custom directory input */}
      <View style={s.inputWrap}>
        <BottomSheetTextInput
          style={[s.input, isDark && s.inputDark]}
          placeholder={serverHome ? `${serverHome}/...` : "/path/to/project"}
          placeholderTextColor={colors.iconSubtle}
          value={custom}
          onChangeText={(text) => {
            if (serverHome && text === "~") setCustom(serverHome)
            else if (serverHome && text.startsWith("~/")) setCustom(serverHome + text.slice(1))
            else setCustom(text)
          }}
          onSubmitEditing={handleCustomSubmit}
          returnKeyType="go"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("chat.directorySwitcher.inputLabel")}
        />
        {custom.trim() && (
          <TouchableOpacity
            style={[s.goBtn, isDark && s.goBtnDark]}
            onPress={handleCustomSubmit}
            accessibilityRole="button"
            accessibilityLabel={t("chat.directorySwitcher.goButton")}
          >
            <Ionicons name="arrow-forward" size={18} color={isDark ? colors.textInk : colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick path chips */}
      {(serverHome || onBrowse) && (
        <View style={s.chips}>
          {serverHome && (
            <>
              <TouchableOpacity
                style={[s.chip, isDark && s.chipDark]}
                onPress={() => setCustom(serverHome)}
                accessibilityRole="button"
                accessibilityLabel={serverHome}
              >
                <Text style={[s.chipText, isDark && s.chipTextDark]}>~</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.chip, isDark && s.chipDark]}
                onPress={() => setCustom(serverHome + "/")}
                accessibilityRole="button"
                accessibilityLabel={`${serverHome}/`}
              >
                <Text style={[s.chipText, isDark && s.chipTextDark]}>~/</Text>
              </TouchableOpacity>
            </>
          )}
          {onBrowse && (
            <TouchableOpacity
              style={[s.chip, s.chipBrowse, isDark && s.chipDark]}
              onPress={() => {
                sheetRef.current?.close()
                onBrowse()
              }}
              accessibilityRole="button"
              accessibilityLabel={t("chat.directorySwitcher.browseLabel")}
            >
              <Ionicons name="folder-open-outline" size={14} color={isDark ? colors.violet : colors.violetStrong} />
              <Text style={[s.chipText, isDark && s.chipTextDark]}>{t("chat.directorySwitcher.browseLabel")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recent directories */}
      <BottomSheetFlatList
        data={items}
        keyExtractor={(item: (typeof items)[number], i: number) => item.dir || `default-${i}`}
        renderItem={({ item }: { item: (typeof items)[number] }) => (
          <TouchableOpacity
            style={[s.row, isDark && s.rowDark, item.active && s.rowActive]}
            onPress={() => handleSelect(item.dir)}
            accessibilityRole="button"
            accessibilityLabel={
              item.dir
                ? `${item.label}, ${item.dir}`
                : `${item.label}, ${t("chat.directorySwitcher.usesServerDir")}`
            }
            accessibilityState={{ selected: item.active }}
          >
            <View style={s.rowIcon}>
              <Ionicons
                name={item.dir ? "folder-outline" : "server-outline"}
                size={20}
                color={item.active ? colors.violet : colors.iconSecondary}
              />
            </View>
            <View style={s.rowContent}>
              <Text style={[s.rowLabel, isDark && s.white, item.active && s.rowLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.dir && (
                <Text style={[s.rowPath, isDark && s.dimDark]} numberOfLines={1}>
                  {item.dir}
                </Text>
              )}
              {!item.dir && (
                <Text style={[s.rowPath, isDark && s.dimDark]}>{t("chat.directorySwitcher.usesServerDir")}</Text>
              )}
            </View>
            {item.active && <Ionicons name="checkmark-circle" size={20} color={colors.violet} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          items.length > 1 ? (
            <Text style={[s.section, isDark && s.dimDark]}>{t("chat.directorySwitcher.recentProjectsLabel")}</Text>
          ) : null
        }
      />
    </BottomSheet>
  )
}

const s = StyleSheet.create({
  sheet: { backgroundColor: light.white },
  sheetDark: { backgroundColor: dark.surfaceRaised },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  title: { fontSize: 18, fontWeight: "700", color: light.textInk },
  white: { color: dark.textPrimary },
  current: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentText: {
    fontSize: 13,
    color: light.violet,
    fontWeight: "500",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: light.chipBg,
    borderRadius: 16,
  },
  chipDark: {
    backgroundColor: dark.chipBg,
  },
  chipBrowse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: light.violetStrong,
  },
  chipTextDark: {
    color: dark.violetSoft,
  },
  input: {
    flex: 1,
    backgroundColor: light.surfaceInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: light.textInk,
  },
  inputDark: { backgroundColor: dark.surfaceInput, color: dark.textPrimary },
  goBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: light.textInk,
    justifyContent: "center",
    alignItems: "center",
  },
  goBtnDark: { backgroundColor: light.white },
  list: { paddingBottom: 40 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: light.dimText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dimDark: { color: dark.hintText },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: light.separatorFixed,
    gap: 12,
  },
  rowDark: { borderBottomColor: dark.surfaceInput },
  rowActive: { backgroundColor: light.rowSelected },
  rowIcon: { width: 28, alignItems: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "500", color: light.textInk },
  rowLabelActive: { color: light.violet },
  rowPath: { fontSize: 12, color: light.dimText, marginTop: 1 },
})
