import { test } from "node:test"
import assert from "node:assert/strict"
import { busySessionCandidates, isSessionRunning } from "./busy-reconcile.ts"
import type { SessionStatus } from "./sdk.ts"

test("no busy flags -> no candidates to reconcile", () => {
  assert.deepEqual(busySessionCandidates({}, {}), [])
})

test("sessionStatus busy entries are candidates", () => {
  const status: Record<string, SessionStatus> = { s1: { type: "busy" }, s2: { type: "busy" } }
  assert.deepEqual(busySessionCandidates(status, {}).sort(), ["s1", "s2"])
})

test("non-busy statuses (idle / retry) are NOT candidates", () => {
  const status: Record<string, SessionStatus> = {
    s1: { type: "idle" },
    s2: { type: "retry", attempt: 1, message: "queued" },
  }
  assert.deepEqual(busySessionCandidates(status, {}), [])
})

test("a stuck optimistic sending flag is a candidate even without a busy sessionStatus", () => {
  // disconnect() wipes sessionStatus but deliberately does not clear
  // useSessions.sending — so after a manual disconnect -> reconnect the busy
  // mark is gone while sending survives. Without this the stuck flag is never
  // reconciled and shows an endless 'processing' spinner.
  assert.deepEqual(busySessionCandidates({}, { s9: true }), ["s9"])
})

test("sending:false entries are NOT candidates", () => {
  assert.deepEqual(busySessionCandidates({}, { s9: false, s8: false }), [])
})

test("union of both maps, deduped when the same session is marked busy twice", () => {
  const status: Record<string, SessionStatus> = { s1: { type: "busy" }, s3: { type: "busy" } }
  // s1 is busy in both maps — must appear once.
  assert.deepEqual(busySessionCandidates(status, { s1: true, s2: true }).sort(), ["s1", "s2", "s3"])
})

test("mixed: busy sessionStatus + a stuck sending flag are both reconciled", () => {
  const status: Record<string, SessionStatus> = { gotBusyEvent: { type: "busy" } }
  assert.deepEqual(busySessionCandidates(status, { gotStuckSending: true }).sort(), [
    "gotBusyEvent",
    "gotStuckSending",
  ])
})

test("isSessionRunning: busy sessionStatus counts as running", () => {
  const status: Record<string, SessionStatus> = { s1: { type: "busy" } }
  assert.equal(isSessionRunning(status, {}, "s1"), true)
})

test("isSessionRunning: optimistic sending flag counts as running", () => {
  // Mirrors the candidate semantics: a prompt in flight (before SSE busy lands)
  // is just as "working" for a remote watcher as an SSE-confirmed busy state.
  assert.equal(isSessionRunning({}, { s1: true }, "s1"), true)
})

test("isSessionRunning: idle / retry / sending:false are NOT running", () => {
  const status: Record<string, SessionStatus> = {
    s1: { type: "idle" },
    s2: { type: "retry", attempt: 1, message: "queued" },
  }
  assert.equal(isSessionRunning(status, { s3: false }, "s1"), false)
  assert.equal(isSessionRunning(status, { s3: false }, "s2"), false)
  assert.equal(isSessionRunning(status, { s3: false }, "s3"), false)
})

test("isSessionRunning: unknown session is NOT running", () => {
  assert.equal(isSessionRunning({}, {}, "ghost"), false)
})