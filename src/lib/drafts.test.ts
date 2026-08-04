import { test } from "node:test"
import assert from "node:assert/strict"

interface DraftsMap {
  [sessionID: string]: string
}

function updateDraft(drafts: DraftsMap, sessionID: string, text: string): DraftsMap {
  const trimmed = text.trim()
  if (!trimmed) {
    const next = { ...drafts }
    delete next[sessionID]
    return next
  }
  return { ...drafts, [sessionID]: text }
}

function removeDraft(drafts: DraftsMap, sessionID: string): DraftsMap {
  if (!drafts[sessionID]) return drafts
  const next = { ...drafts }
  delete next[sessionID]
  return next
}

test("drafts: updateDraft stores text for session", () => {
  const initial: DraftsMap = {}
  const next = updateDraft(initial, "sess-1", "Hello OpenCode")
  assert.equal(next["sess-1"], "Hello OpenCode")
})

test("drafts: updateDraft removes entry when text is empty or whitespace", () => {
  const initial: DraftsMap = { "sess-1": "Draft text" }
  const next = updateDraft(initial, "sess-1", "   ")
  assert.equal(next["sess-1"], undefined)
  assert.equal(Object.keys(next).length, 0)
})

test("drafts: removeDraft deletes specified session draft", () => {
  const initial: DraftsMap = { "sess-1": "Draft 1", "sess-2": "Draft 2" }
  const next = removeDraft(initial, "sess-1")
  assert.equal(next["sess-1"], undefined)
  assert.equal(next["sess-2"], "Draft 2")
})

test("drafts: removeDraft does not mutate input if key does not exist", () => {
  const initial: DraftsMap = { "sess-1": "Draft 1" }
  const next = removeDraft(initial, "sess-99")
  assert.equal(next, initial)
})
