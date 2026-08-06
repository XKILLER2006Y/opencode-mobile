/**
 * Connection indicator state for the sessions screen's connection bar.
 *
 * Deriving the dot colour from the live SSE state instead of a hardcoded
 * green solves a real remote-monitoring lie: before this, the dot was always
 * `statusSuccess` even when the SSE stream was down/reconnecting, so someone
 * checking their session from across the room would see "connected" while the
 * agent was actually silently stalled.
 *
 * Precedence (most important wins):
 *  1. `authError`      -> the server rejected our credentials; nothing retries
 *                         will fix until the user edits the connection (#76).
 *  2. `connected`      -> stream is up, events flowing.
 *  3. `reconnectAttempts > 0` -> stream dropped, backing off to retry.
 *  4. default          -> stream never started / manuallosed.
 */
export type ConnectionDotState = "online" | "reconnecting" | "auth_error" | "offline"

export function connectionDotState(
  connected: boolean,
  reconnectAttempts: number,
  authError: boolean,
): ConnectionDotState {
  if (authError) return "auth_error"
  if (connected) return "online"
  if (reconnectAttempts > 0) return "reconnecting"
  return "offline"
}

/** i18n key (under `connectionBar.status`) for a given dot state. */
export function connectionDotLabelKey(state: ConnectionDotState): string {
  return `connectionBar.status.${state}`
}