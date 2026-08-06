import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface VariantOption {
  id: string | null
  label: string
  description: string
}

interface Props {
  variants: Record<string, { reasoningEffort?: string }> | undefined
  selected: string | null
  isDark: boolean
  onSelect: (variant: string | null) => void
  sheetRef: React.RefObject<BottomSheet | null>
}

export function VariantPicker({ variants, selected, isDark, onSelect, sheetRef }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)

  const effortDescriptions: Record<string, string> = {
    low: t("chat.variantPicker.effort.low"),
    medium: t("chat.variantPicker.effort.medium"),
    high: t("chat.variantPicker.effort.high"),
  }
  const autoOption: VariantOption = {
    id: null,
    label: t("chat.variantPicker.autoLabel"),
    description: t("chat.variantPicker.autoDescription"),
  }

  const options: VariantOption[] = [
    autoOption,
    ...Object.keys(variants || {}).map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      description: effortDescriptions[id] ?? id,
    })),
  ]

  const handleSelect = (id: string | null) => {
    onSelect(id)
    sheetRef.current?.close()
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["30%", "50%"]}
      // See DirectoryBrowserSheet.tsx for why this is required alongside
      // static snapPoints (issue #104): without it the sheet can never open.
      enableDynamicSizing={false}
      enablePanDownToClose
      backgroundStyle={isDark ? s.sheetDark : s.sheet}
      handleIndicatorStyle={{ backgroundColor: colors.handleIndicator }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
    >
      <View style={s.header}>
        <Text style={[s.title, isDark && s.textWhite]}>{t("chat.variantPicker.title")}</Text>
      </View>
      <BottomSheetFlatList
        data={options}
        keyExtractor={(item: VariantOption) => item.id ?? "auto"}
        renderItem={({ item }: { item: VariantOption }) => {
          const active = item.id === selected
          return (
            <TouchableOpacity
              style={[s.row, isDark && s.rowDark, active && (isDark ? s.rowSelectedDark : s.rowSelected)]}
              onPress={() => handleSelect(item.id)}
              testID={`variant-option-${item.id ?? "auto"}`}
              accessibilityRole="button"
              accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
              accessibilityState={{ selected: active }}
            >
              <View style={s.rowText}>
                <Text style={[s.rowName, isDark && s.textWhite]}>{item.label}</Text>
                <Text style={[s.rowDesc, isDark && s.metaDark]}>{item.description}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.violet} />}
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={s.content}
      />
    </BottomSheet>
  )
}

const s = StyleSheet.create({
  sheet: { backgroundColor: light.white },
  sheetDark: { backgroundColor: dark.surfaceRaised },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", color: light.textInk },
  textWhite: { color: dark.textPrimary },
  metaDark: { color: dark.hintText },
  content: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: light.separatorFixed,
  },
  rowDark: { borderBottomColor: dark.surfaceInput },
  rowSelected: { backgroundColor: light.rowSelected },
  rowSelectedDark: { backgroundColor: dark.rowSelected },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: light.textInk },
  rowDesc: { fontSize: 12, color: light.dimText, marginTop: 2 },
})
