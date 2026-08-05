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