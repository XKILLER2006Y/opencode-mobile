// OpenCode Mobile Design System Tokens
// Apple system design language — Clarity, Deference, Depth.

export const theme = {
  colors: {
    dark: {
      bg: "#000000",
      bgApp: "#000000",
      surface: "#1C1C1E",
      surfaceElevated: "#2C2C2E",
      border: "#38383A",
      borderSubtle: "#2C2C2E",
      textPrimary: "#FFFFFF",
      textSecondary: "#AEAEB2",
      textMuted: "#8E8E93",
      iconMuted: "#8E8E93",
      accent: "#0A84FF",
      accentGlow: "rgba(10, 132, 255, 0.18)",
      userBubble: "#0A84FF",
      assistantBubble: "#2C2C2E",
      statusIdle: "#AEAEB2",
      statusBusy: "#0A84FF",
      statusSuccess: "#30D158",
      statusWarning: "#FF9F0A",
      statusError: "#FF453A",
      healthOk: "#30D158",
      healthWarn: "#FF9F0A",
      healthUnknown: "#AEAEB2",
      indigo: "#6366F1",
      indigoBg: "#1E1B4B",
      indigoBox: "#312E81",

      /* --- neutral fixed (same value in both modes) --- */
      white: "#FFFFFF",
      black: "#000000",
      ink: "#0a0a0a",
      shadow: "#000000",

      /* --- diff view --- */
      diffAddBg: "#052e16",
      diffRemoveBg: "#2a0a0a",
      diffContainer: "#09090B",
      diffBorder: "#27272A",

      /* --- markdown --- */
      markdownText: "#FAFAFA",
      markdownLink: "#8B5CF6",
      markdownCode: "#A78BFA",
      markdownCodeBg: "rgba(139, 92, 246, 0.15)",
      markdownBlockquoteBorder: "#3F3F46",
      markdownHr: "#27272A",

      /* --- code block --- */
      codeBg: "#1a1a1a",
      codeHeaderBg: "#2a2a2a",
      codeText: "#e5e5e5",
      codeLang: "#888888",
      codeCopy: "#a78bfa",

      /* --- pickers / shared surfaces --- */
      surfaceRaised: "#1a1a1a",
      surfaceInput: "#2a2a2a",
      panelBg: "#111111",
      hairline: "#1a1a1a",
      hairlineStrong: "#2a2a2a",

      /* --- violet marks --- */
      violet: "#8b5cf6",
      violetStrong: "#6d28d9",
      violetSoft: "#c4b5fd",
      chipBg: "#2a2040",
      rowSelected: "#1f1a2e",

      /* --- icon / text scraps --- */
      iconSecondary: "#888888",
      iconSubtle: "#666666",
      iconFaint: "#555555",
      iconInactive: "#3a3a3a",
      iconChevron: "#555555",
      metaStrong: "#aaaaaa",
      textInk: "#e5e5e5",
      mutedText: "#666666",
      subtitleText: "#888888",
      controlMuted: "#8E8E93",
      inputPlaceholder: "#AEAEB2",
      textSoft: "#666666",

      /* --- inverted accents --- */
      invertBg: "#FFFFFF",
      invertText: "#0a0a0a",

      /* --- tinted surfaces (accent / warning / error washes) --- */
      accentBg: "rgba(10, 132, 255, 0.08)",
      accentBorder: "rgba(10, 132, 255, 0.25)",
      accentSelectedBg: "rgba(10, 132, 255, 0.2)",
      accentSoft: "rgba(10, 132, 255, 0.15)",
      warnBg: "rgba(255, 159, 10, 0.08)",
      warnBorder: "rgba(255, 159, 10, 0.25)",
      denyBg: "rgba(255, 59, 48, 0.1)",
      errorBg: "rgba(255, 69, 58, 0.1)",
      errorBorder: "rgba(255, 69, 58, 0.35)",
      errorBannerBg: "rgba(255, 69, 58, 0.12)",
      errorBannerBorder: "rgba(255, 59, 48, 0.2)",
      roleUserFade: "rgba(255, 255, 255, 0.85)",
      overlay: "rgba(0, 0, 0, 0.6)",

      /* --- status feedback (inverted/accent independent) --- */
      infoBlue: "#3b82f6",
      successGreen: "#10b981",
      amberPill: "#f59e0b",
      pinkPill: "#ec4899",
      danger: "#ef4444",
      dangerStrong: "#dc2626",
      success: "#22c55e",
      successStrong: "#16a34a",

      /* --- telemetry / error-boundary palette --- */
      telemTitle: "#f8fafc",
      telemBody: "#94a3b8",
      telemFootnote: "#64748b",
      telemIconBg: "#1e293b",
      telemBtnBg: "#2a2a2a",
      imagePlaceholder: "#f0f0f0",
      ebSubtitle: "#a0a0a0",
      ebCardLabel: "#888",
      ebCode: "#cdd3da",

      /* --- component-exact tokens (dark palette) --- */
      accentTintBg: "rgba(10, 132, 255, 0.08)",
      accentTintBorder: "rgba(10, 132, 255, 0.2)",
      warnTintBg: "rgba(255, 159, 10, 0.15)",
      accentIcon: "#0071E3",
      denyText: "#FF3B30",
      surfaceAlt: "#0a0a0a",
      softMuted: "#6E6E73",
      cardBg: "#1C1C1E",
      todoDoneText: "#AEAEB2",
      dimText: "#999999",
      footnoteText: "#8E8E93",
      hintText: "#888888",
      separatorFixed: "#e5e5e5",
      handleIndicator: "#666666",
      sectionHeaderBg: "#111111",
      roleText: "#6E6E73",
      thumbBadge: "#E9E9EB",
    },
    light: {
      bg: "#F2F2F7",
      bgApp: "#F2F2F7",
      surface: "#FFFFFF",
      surfaceElevated: "#F2F2F7",
      border: "#C6C6C8",
      borderSubtle: "#E9E9EB",
      textPrimary: "#000000",
      textSecondary: "#6E6E73",
      textMuted: "#8E8E93",
      iconMuted: "#8E8E93",
      accent: "#0071E3",
      accentGlow: "rgba(0, 113, 227, 0.12)",
      userBubble: "#0071E3",
      assistantBubble: "#E9E9EB",
      statusIdle: "#6E6E73",
      statusBusy: "#0071E3",
      statusSuccess: "#34C759",
      statusWarning: "#FF9500",
      statusError: "#FF3B30",
      healthOk: "#34C759",
      healthWarn: "#FF9500",
      healthUnknown: "#8E8E93",
      indigo: "#6366F1",
      indigoBg: "#F0F0FF",
      indigoBox: "#EEF2FF",

      /* --- neutral fixed (same value in both modes) --- */
      white: "#FFFFFF",
      black: "#000000",
      ink: "#0a0a0a",
      shadow: "#000000",

      /* --- diff view --- */
      diffAddBg: "#dcfce7",
      diffRemoveBg: "#fee2e2",
      diffContainer: "#FFFFFF",
      diffBorder: "#E4E4E7",

      /* --- markdown --- */
      markdownText: "#09090B",
      markdownLink: "#7C3AED",
      markdownCode: "#7C3AED",
      markdownCodeBg: "rgba(124, 58, 237, 0.08)",
      markdownBlockquoteBorder: "#E4E4E7",
      markdownHr: "#E4E4E7",

      /* --- code block --- */
      codeBg: "#f5f5f5",
      codeHeaderBg: "#e8e8e8",
      codeText: "#1a1a1a",
      codeLang: "#666666",
      codeCopy: "#8b5cf6",

      /* --- pickers / shared surfaces --- */
      surfaceRaised: "#ffffff",
      surfaceInput: "#f5f5f5",
      panelBg: "#fafafa",
      hairline: "#e5e5e5",
      hairlineStrong: "#e5e5e5",

      /* --- violet marks --- */
      violet: "#8b5cf6",
      violetStrong: "#6d28d9",
      violetSoft: "#c4b5fd",
      chipBg: "#e8e5f0",
      rowSelected: "#f5f3ff",

      /* --- icon / text scraps --- */
      iconSecondary: "#666666",
      iconSubtle: "#999999",
      iconFaint: "#bbbbbb",
      iconInactive: "#dddddd",
      iconChevron: "#cccccc",
      metaStrong: "#666666",
      textInk: "#0a0a0a",
      mutedText: "#999999",
      subtitleText: "#666666",
      controlMuted: "#6E6E73",
      inputPlaceholder: "#8E8E93",
      textSoft: "#666666",

      /* --- inverted accents --- */
      invertBg: "#000000",
      invertText: "#FFFFFF",

      /* --- tinted surfaces (accent / warning / error washes) --- */
      accentBg: "rgba(0, 113, 227, 0.06)",
      accentBorder: "rgba(0, 113, 227, 0.2)",
      accentSelectedBg: "rgba(0, 113, 227, 0.12)",
      accentSoft: "rgba(0, 113, 227, 0.08)",
      warnBg: "rgba(255, 149, 0, 0.06)",
      warnBorder: "rgba(255, 149, 0, 0.2)",
      denyBg: "rgba(255, 59, 48, 0.1)",
      errorBg: "rgba(255, 59, 48, 0.06)",
      errorBorder: "rgba(255, 59, 48, 0.3)",
      errorBannerBg: "rgba(255, 59, 48, 0.08)",
      errorBannerBorder: "rgba(255, 59, 48, 0.2)",
      roleUserFade: "rgba(255, 255, 255, 0.85)",
      overlay: "rgba(0, 0, 0, 0.6)",

      /* --- status feedback (inverted/accent independent) --- */
      infoBlue: "#3b82f6",
      successGreen: "#10b981",
      amberPill: "#f59e0b",
      pinkPill: "#ec4899",
      danger: "#ef4444",
      dangerStrong: "#dc2626",
      success: "#22c55e",
      successStrong: "#16a34a",

      /* --- telemetry / error-boundary palette --- */
      telemTitle: "#0a0a0a",
      telemBody: "#374151",
      telemFootnote: "#9ca3af",
      telemIconBg: "#eff6ff",
      telemBtnBg: "#f1f5f9",
      imagePlaceholder: "#f0f0f0",
      ebSubtitle: "#a0a0a0",
      ebCardLabel: "#888",
      ebCode: "#cdd3da",

      /* --- component-exact tokens (light palette) --- */
      accentTintBg: "rgba(0, 113, 227, 0.05)",
      accentTintBorder: "rgba(0, 113, 227, 0.15)",
      warnTintBg: "rgba(255, 149, 0, 0.1)",
      accentIcon: "#0071E3",
      denyText: "#FF3B30",
      surfaceAlt: "#ffffff",
      softMuted: "#8E8E93",
      cardBg: "#F2F2F7",
      todoDoneText: "#AEAEB2",
      dimText: "#999999",
      footnoteText: "#8E8E93",
      hintText: "#999999",
      separatorFixed: "#e5e5e5",
      handleIndicator: "#cccccc",
      sectionHeaderBg: "#f5f5f5",
      roleText: "#6E6E73",
      thumbBadge: "#E9E9EB",
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