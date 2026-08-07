import { test } from "node:test"
import assert from "node:assert/strict"
import {
  sanitizeBody,
  MAX_NOTIF_BODY,
  PERMISSION_NOTIF_BODY,
  permissionNotificationBody,
  questionNotificationBody,
} from "./notify-format.ts"

// Notification bodies come from the server (and ultimately the AI). They must be
// neutralized before display: control chars stripped, whitespace trimmed, length capped.

test("returns the fallback for undefined or empty input", () => {
  assert.equal(sanitizeBody(undefined, "fb"), "fb")
  assert.equal(sanitizeBody("", "fb"), "fb")
})

test("returns the fallback when input is only whitespace/control chars", () => {
  assert.equal(sanitizeBody("   ", "fb"), "fb")
  assert.equal(sanitizeBody("\x00\x07\x1f", "fb"), "fb")
})

test("passes ordinary text through, trimmed", () => {
  assert.equal(sanitizeBody("  hello world  ", "fb"), "hello world")
})

test("replaces C0 control chars and DEL with spaces", () => {
  // newline, tab, bell, DEL between the words become spaces
  assert.equal(sanitizeBody("a\nb\tc\x07d\x7fe", "fb"), "a b c d e")
})

test("does not strip non-ASCII/emoji content", () => {
  assert.equal(sanitizeBody("café 🚀 プロジェクト", "fb"), "café 🚀 プロジェクト")
})

test("caps length at MAX_NOTIF_BODY", () => {
  const long = "x".repeat(500)
  const out = sanitizeBody(long, "fb")
  assert.equal(out.length, MAX_NOTIF_BODY)
  assert.equal(out, "x".repeat(MAX_NOTIF_BODY))
})

test("trims before slicing so leading whitespace doesn't eat the budget", () => {
  const out = sanitizeBody("   " + "y".repeat(250), "fb")
  assert.equal(out, "y".repeat(MAX_NOTIF_BODY))
})

// Lock-screen notification bodies must be pure "come look" signals. The
// in-app permission/question cards render the full request; nothing
// server-supplied (permission names, file-path globs, question text) may
// reach the notification shade before the device is unlocked (M-03).

test("permission notification body is a fixed generic string", () => {
  assert.equal(permissionNotificationBody(), "A tool needs your approval")
})

test("permission notification body can never carry server-supplied content", () => {
  // The body has no parameters — there is no input channel for permission
  // names or file-path globs to leak through (M-03).
  assert.equal(permissionNotificationBody(), PERMISSION_NOTIF_BODY)
  assert.ok(!PERMISSION_NOTIF_BODY.includes("bash"))
  assert.ok(!PERMISSION_NOTIF_BODY.includes(".env"))
  assert.ok(!PERMISSION_NOTIF_BODY.includes(".pem"))
})

test("question notification body is a fixed generic string", () => {
  assert.equal(questionNotificationBody(), "The assistant has a question")
})
