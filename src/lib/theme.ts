// OpenCode Mobile Design System Tokens
// Apple system design language — Clarity, Deference, Depth.

export const theme = {
  colors: {
    dark: {
      bg: "#000000",
      surface: "#1C1C1E",
      surfaceElevated: "#2C2C2E",
      border: "#38383A",
      borderSubtle: "#2C2C2E",
      textPrimary: "#FFFFFF",
      textSecondary: "#AEAEB2",
      textMuted: "#8E8E93",
      accent: "#0A84FF",
      accentGlow: "rgba(10, 132, 255, 0.18)",
      userBubble: "#0A84FF",
      assistantBubble: "#2C2C2E",
      statusIdle: "#AEAEB2",
      statusBusy: "#0A84FF",
      statusSuccess: "#30D158",
      statusWarning: "#FF9F0A",
      statusError: "#FF453A",
    },
    light: {
      bg: "#F2F2F7",
      surface: "#FFFFFF",
      surfaceElevated: "#F2F2F7",
      border: "#C6C6C8",
      borderSubtle: "#E9E9EB",
      textPrimary: "#000000",
      textSecondary: "#6E6E73",
      textMuted: "#8E8E93",
      accent: "#0071E3",
      accentGlow: "rgba(0, 113, 227, 0.12)",
      userBubble: "#0071E3",
      assistantBubble: "#E9E9EB",
      statusIdle: "#6E6E73",
      statusBusy: "#0071E3",
      statusSuccess: "#34C759",
      statusWarning: "#FF9500",
      statusError: "#FF3B30",
    },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    huge: 32,
  },
  typography: {
    largeTitle: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
    title1: { fontSize: 22, fontWeight: "600" as const, lineHeight: 28 },
    body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
    headline: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
    footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 16 },
    caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 14 },
    code: { fontSize: 13, fontFamily: "monospace" },
  },
  font: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
}

export function getTheme(isDark: boolean) {
  return isDark ? theme.colors.dark : theme.colors.light
}