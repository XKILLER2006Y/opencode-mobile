import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform, ScrollView } from "react-native"
import * as Clipboard from "expo-clipboard"
import { WIDE_CONTENT_SCROLL_CONFIG } from "../../lib/scroll-config"
import { theme } from "../../lib/theme"

const dark = theme.colors.dark
const light = theme.colors.light

interface Props {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: Props) {
  const isDark = useColorScheme() === "dark"
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard failure: leave the button state untouched (nothing useful to recover)
    }
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.language, isDark && styles.languageDark]}>{language || "code"}</Text>
        <TouchableOpacity
          onPress={copy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={copied ? "Copied!" : `Copy ${language || "code"}`}
        >
          <Text style={[styles.copyBtn, isDark && styles.copyBtnDark]}>{copied ? "Copied!" : "Copy"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView {...WIDE_CONTENT_SCROLL_CONFIG} testID="code-block-scroll" contentContainerStyle={styles.codeScroll}>
        <Text style={[styles.code, isDark && styles.codeDark]} selectable>
          {code}
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: light.codeBg,
    borderRadius: 8,
    marginVertical: 8,
    overflow: "hidden",
  },
  containerDark: {
    backgroundColor: dark.codeBg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: light.codeHeaderBg,
  },
  headerDark: {
    backgroundColor: dark.codeHeaderBg,
  },
  language: {
    fontSize: 11,
    fontWeight: "600",
    color: light.codeLang,
    textTransform: "uppercase",
  },
  languageDark: {
    color: dark.codeLang,
  },
  copyBtn: {
    fontSize: 11,
    color: light.codeCopy,
    fontWeight: "600",
  },
  copyBtnDark: {
    color: dark.codeCopy,
  },
  codeScroll: {
    padding: 12,
  },
  code: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    lineHeight: 20,
    color: light.codeText,
  },
  codeDark: {
    color: dark.codeText,
  },
})
