import { useMemo } from "react"
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native"
import { WIDE_CONTENT_SCROLL_CONFIG } from "../../lib/scroll-config"
import { computeDiff } from "./diff-compute"
import { theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

const mono = Platform.OS === "ios" ? "Menlo" : "monospace"

interface Props {
  before: string
  after: string
  isDark: boolean
}

export function DiffView({ before, after, isDark }: Props) {
  const lines = useMemo(() => computeDiff(before, after), [before, after])

  if (lines.length === 0) return null

  return (
    <View style={[s.container, isDark && s.containerDark]}>
      <ScrollView {...WIDE_CONTENT_SCROLL_CONFIG} testID="diff-view-scroll">
        <View>
          {lines.map((line, idx) => (
            <View
              key={idx}
              style={[
                s.line,
                line.type === "add" && (isDark ? s.addDark : s.add),
                line.type === "remove" && (isDark ? s.removeDark : s.remove),
              ]}
            >
              <Text style={[s.prefix, isDark && s.prefixDark]}>
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </Text>
              <Text
                style={[
                  s.text,
                  isDark && s.textDark,
                  line.type === "add" && s.addText,
                  line.type === "remove" && s.removeText,
                ]}
                selectable
              >
                {line.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: light.diffContainer,
    marginTop: 8,
    borderWidth: 1,
    borderColor: light.diffBorder,
  },
  containerDark: { backgroundColor: dark.diffContainer, borderColor: dark.diffBorder },

  line: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  add: { backgroundColor: light.diffAddBg },
  addDark: { backgroundColor: dark.diffAddBg },
  remove: { backgroundColor: light.diffRemoveBg },
  removeDark: { backgroundColor: dark.diffRemoveBg },

  prefix: {
    width: 16,
    fontSize: 12,
    fontFamily: mono,
    color: light.dimText,
    lineHeight: 20,
  },
  prefixDark: { color: dark.iconSubtle },

  text: {
    fontSize: 12,
    fontFamily: mono,
    color: light.textInk,
    lineHeight: 20,
  },
  textDark: { color: dark.textInk },
  addText: { color: light.successStrong },
  removeText: { color: light.dangerStrong },
})
