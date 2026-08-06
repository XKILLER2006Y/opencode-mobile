import type { SessionStatus } from "./sdk"

/**
 * Which sessions might be stuck marked "busy" after a (re)connect?
 *
 * A session can carry a busy mark in either of two flags:
 *
 * 1. `sessionStatus[id].type === "busy"` — driven by SSE `session.status`
 *    events. The events store clears it on the busy -> idle transition.
 * 2. `sending[id] === true` — the optimistic flag set by sessions.ts
 *    `sendMessage()` while a prompt is in flight. SSE `session.status idle`
 *    and `session.error` are the normal clears; `selectSession` also clears
 *    it defensively.
 *
 * The two flags are cleared independently and on different paths. In
 * particular `useEvents.disconnect()` resets `sessionStatus` entirely but
 * intentionally leaves `useSessions.sending` alone — so after a manual
 * disconnect -> reconnect (connection removed, app backgrounded with a run
 * in flight, etc.) the busy mark can survive in `sending` while
 * `sessionStatus` says nothing. A reconcile that only looked at one map
 * would miss it and the UI would show an endless 'processing' spinner
 * (the same class of issue #123 as the network-drop case).
 *
 * This is the candidate selection for resyncBusySessions (events.ts): the
 * union of both maps, deduped. It deliberately includes sending-only
 * candidates because the resync's verdict (`isSessionActuallyIdle`) is
 * conservative — it only clears a flag the server confirms is stale, so
 * being generous here can't force a genuinely-busy session to look idle.
 */
export function busySessionCandidates(
  sessionStatus: Record<string, SessionStatus>,
  sending: Record<string, boolean>,
): string[] {
  const ids = new Set<string>()
  for (const [id, status] of Object.entries(sessionStatus)) {
    if (status.type === "busy") ids.add(id)
  }
  for (const [id, isSending] of Object.entries(sending)) {
    if (isSending) ids.add(id)
  }
  return [...ids]
}

/**
 * Is THIS session currently running (busy), for list rows that want a
 * live "working" badge without computing the whole candidate set?
 *
 * Semantically identical to `busySessionCandidates(...).includes(id)` but
 * O(1) per call — the sessions list renders one row per session, so building
 * the full union per row would be O(n*m).
 */
export function isSessionRunning(
  sessionStatus: Record<string, SessionStatus>,
  sending: Record<string, boolean>,
  sessionID: string,
): boolean {
  if (sessionStatus[sessionID]?.type === "busy") return true
  return sending[sessionID] === true
}
