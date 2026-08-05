import { test } from "node:test"
import assert from "node:assert/strict"
import { theme } from "./theme.ts"

test("theme: font scale maps all four Inter weights", () => {
  assert.equal(theme.font.regular, "Inter-Regular")
  assert.equal(theme.font.medium, "Inter-Medium")
  assert.equal(theme.font.semibold, "Inter-SemiBold")
  assert.equal(theme.font.bold, "Inter-Bold")
})
