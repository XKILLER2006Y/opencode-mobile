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