import { test } from "node:test"
import assert from "node:assert/strict"
import { getTheme, theme } from "./theme.ts"

test("theme: dark colors contain required design system properties", () => {
  const dark = theme.colors.dark
  assert.equal(dark.bg, "#09090B")
  assert.equal(dark.surface, "#18181B")
  assert.equal(dark.accent, "#8B5CF6")
  assert.equal(dark.textPrimary, "#FAFAFA")
  assert.equal(dark.statusSuccess, "#22C55E")
  assert.equal(dark.statusError, "#EF4444")
})

test("theme: light colors contain required design system properties", () => {
  const light = theme.colors.light
  assert.equal(light.bg, "#F4F4F5")
  assert.equal(light.surface, "#FFFFFF")
  assert.equal(light.accent, "#7C3AED")
  assert.equal(light.textPrimary, "#09090B")
  assert.equal(light.statusSuccess, "#16A34A")
  assert.equal(light.statusError, "#DC2626")
})

test("theme: getTheme returns appropriate palette based on isDark flag", () => {
  const darkPalette = getTheme(true)
  const lightPalette = getTheme(false)

  assert.equal(darkPalette.bg, "#09090B")
  assert.equal(lightPalette.bg, "#F4F4F5")
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
  assert.equal(theme.typography.display.fontSize, 24)
  assert.equal(theme.typography.title.fontSize, 18)
  assert.equal(theme.typography.body.fontSize, 15)
  assert.equal(theme.typography.caption.fontSize, 13)
})
