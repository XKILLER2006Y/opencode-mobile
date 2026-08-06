// Canonical parser for the opencode-remote connection QR payload.
// The CLI (scripts/opencode-remote/cli.mjs) generates these payloads; this
// module is the app-side validator. Contract:
//   {"v":1,"type":"opencode-connection","name":"...","url":"https://...",
//    "auth":true,"mode":"quick"|"named"}
// A payload never contains credentials — the password is entered separately.

export type TunnelMode = "quick" | "named"

export interface ConnectPayload {
  v: 1
  type: "opencode-connection"
  name: string
  url: string
  auth: boolean
  mode?: TunnelMode
}

const MAX_NAME_LENGTH = 64

// One-line install command shown on the Connections screen and by the CLI.
// Points at this project's repo (not the upstream author) so distributed
// builds install the CLI from the same source they were released from.
export const INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/XKILLER2006Y/opencode-mobile/main/scripts/opencode-remote/cli.mjs | node -- start'

export function buildConnectPayload(input: Omit<ConnectPayload, "type"> & { type?: "opencode-connection" }): string {
  const payload: ConnectPayload = {
    v: 1,
    type: "opencode-connection",
    name: input.name,
    url: input.url.replace(/\/+$/, ""),
    auth: input.auth,
    mode: input.mode,
  }
  return JSON.stringify(payload)
}

export function parseConnectPayload(text: string): ConnectPayload | null {
  if (!text) return null
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof raw !== "object" || raw === null) return null

  const candidate = raw as Record<string, unknown>
  if (candidate.v !== 1) return null
  if (candidate.type !== "opencode-connection") return null

  const name = typeof candidate.name === "string" ? candidate.name.trim().replace(/\s+/g, " ") : ""
  if (!name || name.length > MAX_NAME_LENGTH) return null

  const url = typeof candidate.url === "string" ? candidate.url.trim().replace(/\/+$/, "") : ""
  if (!isHttpUrl(url)) return null

  let auth = true
  if (typeof candidate.auth === "boolean") {
    auth = candidate.auth
  } else if (candidate.auth !== undefined) {
    return null
  }

  let mode: TunnelMode | undefined
  if (candidate.mode === undefined) {
    mode = undefined
  } else if (candidate.mode === "quick" || candidate.mode === "named") {
    mode = candidate.mode
  } else {
    return null
  }

  return { v: 1, type: "opencode-connection", name, url, auth, mode }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0
  } catch {
    return false
  }
}
