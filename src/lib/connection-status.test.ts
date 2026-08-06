import { test } from "node:test"
import assert from "node:assert/strict"
import { connectionDotState } from "./connection-status.ts"

test("reports online when the SSE stream is connected", () => {
  assert.equal(connectionDotState(true, 0, false), "online")
})

test("reports online even after previous reconnect attempts if now connected", () => {
  assert.equal(connectionDotState(true, 3, false), "online")
})

test("reports auth_error ahead of everything else", () => {
  // Auth rejection outranks an established stream — the server rejected our
  // creds, so the live view is a lie and must not show green.
  assert.equal(connectionDotState(true, 0, true), "auth_error")
  assert.equal(connectionDotState(true, 4, true), "auth_error")
  assert.equal(connectionDotState(false, 0, true), "auth_error")
})

test("reports reconnecting when disconnected but retrying", () => {
  assert.equal(connectionDotState(false, 1, false), "reconnecting")
  assert.equal(connectionDotState(false, 9, false), "reconnecting")
})

test("reports offline when disconnected with no retries in flight", () => {
  assert.equal(connectionDotState(false, 0, false), "offline")
})