// OpenCode Mobile Design System Tokens
// Blending Agentic AI + Bento Grid + Shadcn Minimal UI aesthetics

export const theme = {
  colors: {
    dark: {
      bg: "#09090B",
      surface: "#18181B",
      surfaceElevated: "#27272A",
      border: "#27272A",
      borderSubtle: "#1F1F23",
      textPrimary: "#FAFAFA",
      textSecondary: "#A1A1AA",
      textMuted: "#71717A",
      accent: "#8B5CF6",
      accentGlow: "rgba(139, 92, 246, 0.15)",
      userBubble: "#27272A",
      assistantBubble: "#18181B",
      statusIdle: "#A1A1AA",
      statusBusy: "#8B5CF6",
      statusSuccess: "#22C55E",
      statusWarning: "#F59E0B",
      statusError: "#EF4444",
    },
    light: {
      bg: "#F4F4F5",
      surface: "#FFFFFF",
      surfaceElevated: "#F4F4F5",
      border: "#E4E4E7",
      borderSubtle: "#F4F4F5",
      textPrimary: "#09090B",
      textSecondary: "#71717A",
      textMuted: "#A1A1AA",
      accent: "#7C3AED",
      accentGlow: "rgba(124, 58, 237, 0.10)",
      userBubble: "#7C3AED",
      assistantBubble: "#FFFFFF",
      statusIdle: "#71717A",
      statusBusy: "#7C3AED",
      statusSuccess: "#16A34A",
      statusWarning: "#D97706",
      statusError: "#DC2626",
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
    display: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
    title: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
    subtitle: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
    body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
    bodyMedium: { fontSize: 15, fontWeight: "500" as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18 },
    small: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14 },
    code: { fontSize: 13, fontFamily: "monospace" },
  },
}

export function getTheme(isDark: boolean) {
  return isDark ? theme.colors.dark : theme.colors.light
}
