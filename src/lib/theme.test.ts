import { test } from "node:test"
import assert from "node:assert/strict"
import { getTheme, theme } from "./theme.ts"

test("theme: dark colors contain required design system properties", () => {
  const dark = theme.colors.dark
  assert.equal(dark.bg, "#000000")
  assert.equal(dark.surface, "#1C1C1E")
  assert.equal(dark.accent, "#0A84FF")
  assert.equal(dark.textPrimary, "#FFFFFF")
  assert.equal(dark.statusSuccess, "#30D158")
  assert.equal(dark.statusError, "#FF453A")
})

test("theme: light colors contain required design system properties", () => {
  const light = theme.colors.light
  assert.equal(light.bg, "#F2F2F7")
  assert.equal(light.surface, "#FFFFFF")
  assert.equal(light.accent, "#0071E3")
  assert.equal(light.textPrimary, "#000000")
  assert.equal(light.statusSuccess, "#34C759")
  assert.equal(light.statusError, "#FF3B30")
})

test("theme: semantic tokens exist in both modes", () => {
  for (const mode of ["dark", "light"] as const) {
    const c = theme.colors[mode]
    assert.equal(typeof c.bgApp, "string")
    assert.equal(typeof c.iconMuted, "string")
    assert.equal(typeof c.healthOk, "string")
    assert.equal(typeof c.healthWarn, "string")
    assert.equal(typeof c.healthUnknown, "string")
    assert.equal(typeof c.indigo, "string")
    assert.equal(typeof c.indigoBg, "string")
    assert.equal(typeof c.indigoBox, "string")
  }
})

test("theme: semantic token values match mapping table", () => {
  const dark = theme.colors.dark
  const light = theme.colors.light
  assert.equal(dark.bgApp, "#000000")
  assert.equal(dark.healthOk, "#30D158")
  assert.equal(dark.healthWarn, "#FF9F0A")
  assert.equal(dark.healthUnknown, "#AEAEB2")
  assert.equal(dark.indigo, "#6366F1")
  assert.equal(dark.indigoBg, "#1E1B4B")
  assert.equal(dark.indigoBox, "#312E81")
  assert.equal(light.healthOk, "#34C759")
  assert.equal(light.healthWarn, "#FF9500")
  assert.equal(light.healthUnknown, "#8E8E93")
  assert.equal(light.indigoBg, "#F0F0FF")
  assert.equal(light.indigoBox, "#EEF2FF")
})

test("theme: getTheme returns appropriate palette based on isDark flag", () => {
  const darkPalette = getTheme(true)
  const lightPalette = getTheme(false)

  assert.equal(darkPalette.bg, "#000000")
  assert.equal(lightPalette.bg, "#F2F2F7")
  assert.notEqual(darkPalette.surface, lightPalette.surface)
})

test("theme: spacing and radii tokens are positive numbers", () => {
  assert.ok(theme.radius.sm > 0)
  assert.ok(theme.radius.md > 0)
  assert.ok(theme.radius.lg > 0)
  assert.equal(theme.radius.full, 9999)

  assert.ok(theme.spacing.xs > 0)
  assert.ok(theme.spacing.sm > 0)
  assert.ok(theme.spacing.md > 0)
  assert.ok(theme.spacing.lg > 0)
})

test("theme: typography scale has valid font sizes and weights", () => {
  assert.equal(theme.typography.largeTitle.fontSize, 28)
  assert.equal(theme.typography.title1.fontSize, 22)
  assert.equal(theme.typography.body.fontSize, 17)
  assert.equal(theme.typography.footnote.fontSize, 13)
})

test("theme: component tokens exist in both modes", () => {
  const shared = [
    "white",
    "black",
    "ink",
    "shadow",
    "diffAddBg",
    "diffRemoveBg",
    "diffContainer",
    "diffBorder",
    "markdownText",
    "markdownLink",
    "markdownCode",
    "markdownCodeBg",
    "markdownBlockquoteBorder",
    "markdownHr",
    "codeBg",
    "codeHeaderBg",
    "codeText",
    "codeLang",
    "codeCopy",
    "surfaceRaised",
    "surfaceInput",
    "panelBg",
    "hairline",
    "hairlineStrong",
    "violet",
    "violetStrong",
    "violetSoft",
    "chipBg",
    "rowSelected",
    "iconSecondary",
    "iconSubtle",
    "iconFaint",
    "iconInactive",
    "iconChevron",
    "metaStrong",
    "textInk",
    "mutedText",
    "subtitleText",
    "controlMuted",
    "inputPlaceholder",
    "textSoft",
    "invertBg",
    "invertText",
    "accentBg",
    "accentBorder",
    "accentSelectedBg",
    "accentSoft",
    "warnBg",
    "warnBorder",
    "denyBg",
    "errorBg",
    "errorBorder",
    "errorBannerBg",
    "errorBannerBorder",
    "roleUserFade",
    "overlay",
    "infoBlue",
    "successGreen",
    "amberPill",
    "pinkPill",
    "danger",
    "dangerStrong",
    "success",
    "successStrong",
    "telemTitle",
    "telemBody",
    "telemFootnote",
    "telemIconBg",
    "telemBtnBg",
    "imagePlaceholder",
    "ebSubtitle",
    "ebCardLabel",
    "ebCode",
    "accentTintBg",
    "accentTintBorder",
    "warnTintBg",
    "accentIcon",
    "denyText",
    "surfaceAlt",
    "softMuted",
    "cardBg",
    "todoDoneText",
    "dimText",
    "footnoteText",
    "hintText",
    "separatorFixed",
    "handleIndicator",
    "sectionHeaderBg",
    "roleText",
    "thumbBadge",
  ]
  for (const mode of ["dark", "light"] as const) {
    const c = theme.colors[mode]
    for (const token of shared) {
      assert.equal(typeof c[token as keyof typeof c], "string", `${token} missing in ${mode}`)
    }
  }
})

test("theme: component token values match the mapping table (exact, no visual change)", () => {
  const dark = theme.colors.dark
  const light = theme.colors.light

  // Fixed across modes
  const fixed: Array<[keyof typeof dark, string]> = [
    ["white", "#FFFFFF"],
    ["black", "#000000"],
    ["ink", "#0a0a0a"],
    ["shadow", "#000000"],
    ["violet", "#8b5cf6"],
    ["violetStrong", "#6d28d9"],
    ["violetSoft", "#c4b5fd"],
    ["denyBg", "rgba(255, 59, 48, 0.1)"],
    ["errorBannerBorder", "rgba(255, 59, 48, 0.2)"],
    ["roleUserFade", "rgba(255, 255, 255, 0.85)"],
    ["overlay", "rgba(0, 0, 0, 0.6)"],
    ["infoBlue", "#3b82f6"],
    ["successGreen", "#10b981"],
    ["amberPill", "#f59e0b"],
    ["pinkPill", "#ec4899"],
    ["danger", "#ef4444"],
    ["dangerStrong", "#dc2626"],
    ["success", "#22c55e"],
    ["successStrong", "#16a34a"],
    ["ebSubtitle", "#a0a0a0"],
    ["ebCardLabel", "#888"],
    ["ebCode", "#cdd3da"],
    ["accentIcon", "#0071E3"],
    ["denyText", "#FF3B30"],
    ["todoDoneText", "#AEAEB2"],
    ["dimText", "#999999"],
    ["footnoteText", "#8E8E93"],
    ["separatorFixed", "#e5e5e5"],
    ["roleText", "#6E6E73"],
    ["thumbBadge", "#E9E9EB"],
  ]
  for (const [token, value] of fixed) {
    assert.equal(dark[token], value, `dark.${token}`)
    assert.equal(light[token], value, `light.${token}`)
  }

  // Mode-paired
  const paired: Array<[keyof typeof dark, string, string]> = [
    ["diffAddBg", "#052e16", "#dcfce7"],
    ["diffRemoveBg", "#2a0a0a", "#fee2e2"],
    ["diffContainer", "#09090B", "#FFFFFF"],
    ["diffBorder", "#27272A", "#E4E4E7"],
    ["markdownText", "#FAFAFA", "#09090B"],
    ["markdownLink", "#8B5CF6", "#7C3AED"],
    ["markdownCode", "#A78BFA", "#7C3AED"],
    ["markdownCodeBg", "rgba(139, 92, 246, 0.15)", "rgba(124, 58, 237, 0.08)"],
    ["markdownBlockquoteBorder", "#3F3F46", "#E4E4E7"],
    ["markdownHr", "#27272A", "#E4E4E7"],
    ["codeBg", "#1a1a1a", "#f5f5f5"],
    ["codeHeaderBg", "#2a2a2a", "#e8e8e8"],
    ["codeText", "#e5e5e5", "#1a1a1a"],
    ["codeLang", "#888888", "#666666"],
    ["codeCopy", "#a78bfa", "#8b5cf6"],
    ["surfaceRaised", "#1a1a1a", "#ffffff"],
    ["surfaceInput", "#2a2a2a", "#f5f5f5"],
    ["panelBg", "#111111", "#fafafa"],
    ["hairline", "#1a1a1a", "#e5e5e5"],
    ["hairlineStrong", "#2a2a2a", "#e5e5e5"],
    ["chipBg", "#2a2040", "#e8e5f0"],
    ["rowSelected", "#1f1a2e", "#f5f3ff"],
    ["iconSecondary", "#888888", "#666666"],
    ["iconSubtle", "#666666", "#999999"],
    ["iconFaint", "#555555", "#bbbbbb"],
    ["iconInactive", "#3a3a3a", "#dddddd"],
    ["iconChevron", "#555555", "#cccccc"],
    ["metaStrong", "#aaaaaa", "#666666"],
    ["textInk", "#e5e5e5", "#0a0a0a"],
    ["mutedText", "#666666", "#999999"],
    ["subtitleText", "#888888", "#666666"],
    ["controlMuted", "#8E8E93", "#6E6E73"],
    ["inputPlaceholder", "#AEAEB2", "#8E8E93"],
    ["textSoft", "#666666", "#666666"],
    ["invertBg", "#FFFFFF", "#000000"],
    ["invertText", "#0a0a0a", "#FFFFFF"],
    ["accentBg", "rgba(10, 132, 255, 0.08)", "rgba(0, 113, 227, 0.06)"],
    ["accentBorder", "rgba(10, 132, 255, 0.25)", "rgba(0, 113, 227, 0.2)"],
    ["accentSelectedBg", "rgba(10, 132, 255, 0.2)", "rgba(0, 113, 227, 0.12)"],
    ["accentSoft", "rgba(10, 132, 255, 0.15)", "rgba(0, 113, 227, 0.08)"],
    ["warnBg", "rgba(255, 159, 10, 0.08)", "rgba(255, 149, 0, 0.06)"],
    ["warnBorder", "rgba(255, 159, 10, 0.25)", "rgba(255, 149, 0, 0.2)"],
    ["errorBg", "rgba(255, 69, 58, 0.1)", "rgba(255, 59, 48, 0.06)"],
    ["errorBorder", "rgba(255, 69, 58, 0.35)", "rgba(255, 59, 48, 0.3)"],
    ["errorBannerBg", "rgba(255, 69, 58, 0.12)", "rgba(255, 59, 48, 0.08)"],
    ["imagePlaceholder", "#f0f0f0", "#f0f0f0"],
    ["telemTitle", "#f8fafc", "#0a0a0a"],
    ["telemBody", "#94a3b8", "#374151"],
    ["telemFootnote", "#64748b", "#9ca3af"],
    ["telemIconBg", "#1e293b", "#eff6ff"],
    ["telemBtnBg", "#2a2a2a", "#f1f5f9"],
    ["accentTintBg", "rgba(10, 132, 255, 0.08)", "rgba(0, 113, 227, 0.05)"],
    ["accentTintBorder", "rgba(10, 132, 255, 0.2)", "rgba(0, 113, 227, 0.15)"],
    ["warnTintBg", "rgba(255, 159, 10, 0.15)", "rgba(255, 149, 0, 0.1)"],
    ["surfaceAlt", "#0a0a0a", "#ffffff"],
    ["softMuted", "#6E6E73", "#8E8E93"],
    ["cardBg", "#1C1C1E", "#F2F2F7"],
    ["hintText", "#888888", "#999999"],
    ["handleIndicator", "#666666", "#cccccc"],
    ["sectionHeaderBg", "#111111", "#f5f5f5"],
  ]
  for (const [token, darkValue, lightValue] of paired) {
    assert.equal(dark[token], darkValue, `dark.${token}`)
    assert.equal(light[token], lightValue, `light.${token}`)
  }
})