// Pure formatting for notification bodies, extracted from stores/events.ts so the
// sanitization rules are unit-testable without the event store's RN dependencies.

export const MAX_NOTIF_BODY = 200

/**
 * Make a server-supplied string safe to show in a notification:
 * strip C0 control characters and DEL (which can corrupt the notification shade
 * or hide content), collapse surrounding whitespace, and cap the length. Falls
 * back to `fallback` when the input is empty/whitespace-only or undefined.
 */
export function sanitizeBody(s: string | undefined, fallback: string): string {
  // eslint-disable-next-line no-control-regex -- C0 controls are exactly what must be stripped
  return (s ? s.replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, MAX_NOTIF_BODY) : "") || fallback
}

// Lock-screen notification bodies are pure "come look" signals. The in-app
// permission/question cards render the full request; nothing server-supplied
// (permission names, file-path globs, question text) may reach the
// notification shade before the device is unlocked (M-03). The request is
// deliberately NOT accepted as a parameter — callers that want to leak
// content have to write it here themselves, and the tests pin the body as a
// fixed generic string.

export const PERMISSION_NOTIF_BODY = "A tool needs your approval"
export const QUESTION_NOTIF_BODY = "The assistant has a question"

export function permissionNotificationBody(): string {
  return PERMISSION_NOTIF_BODY
}

export function questionNotificationBody(): string {
  return QUESTION_NOTIF_BODY
}
