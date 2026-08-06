import type { Message } from "./sdk"

export interface SessionStats {
  cost: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  total: number
  context: number
  percent: number
}

interface PerMessage {
  cost: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
}

function contribution(msg: Message): PerMessage {
  const t = msg.tokens
  return {
    cost: msg.cost || 0,
    input: t?.input || 0,
    output: t?.output || 0,
    reasoning: t?.reasoning || 0,
    cacheRead: t?.cache?.read || 0,
    cacheWrite: t?.cache?.write || 0,
  }
}

function add(into: PerMessage, c: PerMessage, sign: 1 | -1): PerMessage {
  return {
    cost: into.cost + sign * c.cost,
    input: into.input + sign * c.input,
    output: into.output + sign * c.output,
    reasoning: into.reasoning + sign * c.reasoning,
    cacheRead: into.cacheRead + sign * c.cacheRead,
    cacheWrite: into.cacheWrite + sign * c.cacheWrite,
  }
}

/**
 * Incremental O(1) session stats accumulator.
 *
 * The previous SessionInfo implementation scanned every message on every
 * store update — O(n) per SSE token push, O(n²) over a long streaming
 * session. Here each push is O(1): a map of per-message snapshots plus
 * running totals.
 *
 * Unlike a naive id Set, the map keeps the LATEST snapshot per message.
 * `mergeIncomingMessage` replaces a message in place (same id) on every
 * `message.updated` during streaming, with token counts that grow as the
 * stream progresses. A Set would freeze at the first-seen (often token-less)
 * value and permanently undercount. A map lets a re-push subtract the stale
 * contribution and add the new one — same O(1) cost, correct totals.
 */
export function createSessionStatsAccumulator() {
  const seen = new Map<string, PerMessage>()
  let total: PerMessage = { cost: 0, input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
  let context = 0

  return {
    push(msg: Message): void {
      if (msg.role !== "assistant") return
      const c = contribution(msg)
      const prev = seen.get(msg.id)
      if (prev) total = add(total, prev, -1)
      seen.set(msg.id, c)
      total = add(total, c, 1)
    },
    setContext(c: number): void {
      context = c
    },
    get(): SessionStats {
      const sum = total.input + total.output + total.reasoning + total.cacheRead + total.cacheWrite
      return {
        cost: total.cost,
        input: total.input,
        output: total.output,
        reasoning: total.reasoning,
        cacheRead: total.cacheRead,
        cacheWrite: total.cacheWrite,
        total: sum,
        context,
        percent: context > 0 ? Math.round((sum / context) * 100) : 0,
      }
    },
  }
}
