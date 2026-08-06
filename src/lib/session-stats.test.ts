import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createSessionStatsAccumulator } from "./session-stats.ts"
import type { Message } from "./sdk.ts"

function msg(id: string, over: Partial<Message> = {}): Message {
  return {
    id,
    role: "assistant",
    cost: 0.01,
    tokens: { input: 10, output: 20, reasoning: 5, cache: { read: 3, write: 2 } },
    ...over,
  } as unknown as Message
}

describe("createSessionStatsAccumulator", () => {
  test("accumulates totals O(1) per message", () => {
    const acc = createSessionStatsAccumulator()
    acc.push(msg("a"))
    acc.push(msg("b"))
    const s = acc.get()
    assert.ok(Math.abs(s.cost - 0.02) < 1e-9)
    assert.equal(s.total, 40 + 40) // 10+20+5+3+2 = 40 per message
  })

  test("ignores duplicate pushes of the same message id", () => {
    const acc = createSessionStatsAccumulator()
    acc.push(msg("a"))
    acc.push(msg("a"))
    assert.equal(acc.get().total, 40)
  })

  test("recomputes percent when context changes", () => {
    const acc = createSessionStatsAccumulator()
    acc.push(msg("a"))
    acc.setContext(200)
    assert.equal(acc.get().percent, 20)
    acc.setContext(100)
    assert.equal(acc.get().percent, 40)
  })

  test("tracks a message updated in place during streaming (same id, newer values)", () => {
    const acc = createSessionStatsAccumulator()
    // First push: message exists but tokens aren't populated yet
    acc.push(msg("a", { tokens: undefined, cost: 0 }))
    assert.equal(acc.get().total, 0)
    // Streaming completes: same id, real tokens now present
    acc.push(msg("a"))
    assert.equal(acc.get().total, 40)
    assert.ok(Math.abs(acc.get().cost - 0.01) < 1e-9)
  })

  test("ignores non-assistant messages", () => {
    const acc = createSessionStatsAccumulator()
    acc.push({ id: "u1", role: "user" } as Message)
    assert.equal(acc.get().total, 0)
    assert.equal(acc.get().cost, 0)
  })
})
