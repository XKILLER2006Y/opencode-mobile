import { Platform, useColorScheme } from "react-native"
import { StreamdownRN } from "streamdown-rn"
import { getTheme } from "../../lib/theme"
import { Markdown } from "./Markdown"

interface Props {
  children: string
  streaming?: boolean
}

// streamdown-rn does not export ThemeConfig from its public API, so mirror the
// shape locally; TS still verifies it structurally against the theme prop.
interface StreamdownTheme {
  colors: {
    background: string
    foreground: string
    muted: string
    accent: string
    codeBackground: string
    codeForeground: string
    border: string
    link: string
    syntaxDefault: string
    syntaxKeyword: string
    syntaxString: string
    syntaxNumber: string
    syntaxComment: string
    syntaxFunction: string
    syntaxClass: string
    syntaxOperator: string
  }
  fonts: { mono: string }
  spacing: { block: number; inline: number; indent: number }
}

// Maps the app's Apple design tokens (src/lib/theme.ts) into streamdown-rn's
// ThemeConfig so the streaming path matches the stable Markdown path visually.
function appleStreamdownTheme(isDark: boolean): StreamdownTheme {
  const c = getTheme(isDark)
  return {
    colors: {
      background: c.bg,
      foreground: c.textPrimary,
      muted: c.textMuted,
      accent: c.accent,
      codeBackground: c.codeBg,
      codeForeground: c.codeText,
      border: c.border,
      link: c.markdownLink,
      syntaxDefault: c.codeText,
      syntaxKeyword: c.violetStrong,
      syntaxString: c.markdownCode,
      syntaxNumber: c.codeCopy,
      syntaxComment: c.iconSubtle,
      syntaxFunction: c.codeCopy,
      syntaxClass: c.violet,
      syntaxOperator: c.textMuted,
    },
    fonts: { mono: Platform.OS === "ios" ? "Menlo" : "monospace" },
    spacing: { block: 8, inline: 4, indent: 16 },
  }
}

// Hybrid markdown path. While a message is actively streaming, StreamdownRN
// parses incrementally (block-level memoization — only the active block
// re-renders per token, killing the O(n²) full reparse of react-native-marked).
// On completion we switch to the stable Markdown wrapper once: it re-parses
// the final text a single time (negligible O(n)) and restores the copy-button
// CodeBlock + the Android selectable workaround, which streamdown-rn's
// syntax-highlighter code path does not provide. One remount at completion is
// the deliberate, bounded cost of keeping the flagship copy affordance.
export function StreamMarkdown({ children, streaming = false }: Props) {
  const isDark = useColorScheme() === "dark"

  if (streaming) {
    return (
      <StreamdownRN theme={appleStreamdownTheme(isDark)} isComplete={false}>
        {children}
      </StreamdownRN>
    )
  }

  return <Markdown>{children}</Markdown>
}
