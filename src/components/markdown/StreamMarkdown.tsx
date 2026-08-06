import { useColorScheme } from "react-native"
import { StreamdownRN } from "streamdown-rn"
import { Markdown } from "./Markdown"

interface Props {
  children: string
  streaming?: boolean
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
      <StreamdownRN theme={isDark ? "dark" : "light"} isComplete={false}>
        {children}
      </StreamdownRN>
    )
  }

  return <Markdown>{children}</Markdown>
}
