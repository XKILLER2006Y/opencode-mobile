import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { getTheme, theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

export interface Attachment {
  uri: string
  mime: string
  filename?: string
  width?: number
  height?: number
  base64?: string
}

interface Props {
  attachments: Attachment[]
  isDark: boolean
  onRemove: (index: number) => void
}

export function ImageAttachments({ attachments, isDark, onRemove }: Props) {
  const { t } = useTranslation()
  const colors = getTheme(isDark)
  if (attachments.length === 0) return null

  return (
    <View style={[s.container, isDark && s.containerDark]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {attachments.map((att, idx) => (
          <View key={`${att.uri}-${idx}`} style={s.thumb}>
            <Image source={{ uri: att.uri }} style={s.image} resizeMode="cover" accessibilityLabel={att.filename} />
            <TouchableOpacity
              style={[s.remove, isDark && s.removeDark]}
              onPress={() => onRemove(idx)}
              accessibilityRole="button"
              accessibilityLabel={t("chat.imageAttachments.removeButton", { name: att.filename || `#${idx + 1}` })}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color={colors.white} />
            </TouchableOpacity>
            {att.filename && (
              <Text style={[s.label, isDark && s.labelDark]} numberOfLines={1}>
                {att.filename}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: light.separatorFixed,
    backgroundColor: light.surfaceAlt,
  },
  containerDark: { backgroundColor: dark.surfaceAlt, borderTopColor: dark.hairline },
  scroll: { gap: 8 },
  thumb: { position: "relative" },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: light.imagePlaceholder,
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: dark.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: light.white,
  },
  removeDark: { backgroundColor: light.danger, borderColor: dark.surfaceAlt },
  label: {
    fontSize: 10,
    color: light.iconSecondary,
    marginTop: 2,
    maxWidth: 72,
    textAlign: "center",
  },
  labelDark: { color: dark.iconSecondary },
})
