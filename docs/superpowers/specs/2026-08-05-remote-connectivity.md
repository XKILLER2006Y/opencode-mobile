# Remote Connectivity — `opencode-remote` Tunnel Wizard

Date: 2026-08-05
Status: Approved
Branch: `feat/remote-connectivity`
Base: `main` (Phase 1 Apple redesign merged)

## 1. Purpose

Let a phone running this app connect to a self-hosted opencode server from
anywhere on the internet — outside the local network — with zero ongoing cost
and minimal setup, while keeping the existing security model (opencode
username/password over HTTPS).

The app already connects to any HTTP(S) URL via the SDK, and the SSE layer
already has reconnect-with-backoff. Remote connectivity therefore reduces to:
**get a public HTTPS URL for the local opencode port, and make it trivial to
add that URL as a connection from the phone.**

## 2. Architecture

```
┌─ Server machine (runs opencode) ─┐      ┌─ Phone (runs this app) ─┐
│  opencode serve :4096            │      │  Connections tab          │
│  └─ opencode-remote CLI          │      │  ├─ "Scan to connect"     │
│     ├─ cloudflared (named/quick) │      │  ├─ "Expose over internet"│
│     └─ prints QR + payload JSON  │      │  └─ row badges + health   │
└──────────────────────────────────┘      └───────────────────────────┘
        │  QR encodes connection config          ▲
        └──────────────► phone scans ────────────┘
```

The CLI and the app are coupled through **one contract: the QR payload
format** (`src/lib/connect-qr.ts` is the canonical parser; the CLI's payload
generator mirrors it). Both ship in this repo, so they stay version-locked.
No new backend infrastructure is required.

## 3. Server CLI — `opencode-remote`

Single-file Node script at `scripts/opencode-remote/cli.mjs`. Zero runtime
dependencies for core commands (Node is guaranteed — opencode runs on it).
Optional `qrcode` module prints a terminal QR when installed; without it the
CLI prints the payload JSON on one line, which the app's "paste" flow accepts.

Run forms:
- `node scripts/opencode-remote/cli.mjs start`
- `curl -fsSL <raw-github>/scripts/opencode-remote/cli.mjs | node -- start`

### 3.1 Commands

| Command | Behavior |
|---|---|
| `start` (default) | Detect opencode port (default 4096, `--port`), ensure cloudflared, decide quick vs named, bring tunnel up, print URL + QR/payload |
| `status` | Show current tunnel URL, mode, cloudflared process state, health of `http://127.0.0.1:<port>/global/health` |
| `stop` | Stop the tunnel (leave config intact) |
| `restart` | Stop then start |
| `setup-domain` | One-time named-tunnel setup: cloudflared login → tunnel create → DNS route. Writes state |
| `doctor` | Check prerequisites: node, opencode reachable on port, cloudflared installed, domain configured (if named mode) |

### 3.2 Tunnel modes

**Quick tunnel** (default, $0, zero setup):
- Runs `cloudflared tunnel --url http://127.0.0.1:<port>`
- Parses the `https://<random>.trycloudflare.com` URL from stdout
- Ephemeral: URL changes on restart. QR payload tags `mode: "quick"` so the
  app shows a "URL may change" badge.

**Named tunnel** (stable URL, $0 software + user's own domain):
- `setup-domain`: runs `cloudflared tunnel login` (browser OAuth), then
  `cloudflared tunnel create opencode-<hostname>`, then
  `cloudflared tunnel route dns <id> <subdomain>.<domain>`
- `start`: runs `cloudflared tunnel run <id>`
- State persisted to `~/.config/opencode-remote.json`; re-runs idempotent
- QR payload tags `mode: "named"`

Mode decision at `start`: named if state has a configured tunnel, else quick.

### 3.3 Security posture

- Tunnel targets `127.0.0.1:<port>` only — never exposes a LAN IP
- opencode's own username/password auth remains the app-level gate
- State file stores no credentials (cloudflared owns its cert/token files)
- QR/payload is connection *metadata* only — never contains the password

### 3.4 State file

`~/.config/opencode-remote.json`:
```json
{
  "mode": "named" | "quick" | null,
  "port": 4096,
  "tunnelName": "opencode-hostname",
  "tunnelId": "<cloudflare-tunnel-id>",
  "domain": "chat.example.com",
  "lastUrl": "https://chat.example.com",
  "createdAt": "<iso>"
}
```

## 4. QR payload contract

Canonical parser: `src/lib/connect-qr.ts`. Functions:

- `parseConnectPayload(text: string): ConnectPayload | null` — strict parse,
  validates `type === "opencode-connection"`, `v === 1`, required fields,
  URL scheme http/https. Returns `null` on any failure.
- `buildConnectPayload(input): string` — single-line JSON (used by tests +
  CLI parity checks).

Payload shape:
```json
{
  "v": 1,
  "type": "opencode-connection",
  "name": "Home server",
  "url": "https://chat.example.com",
  "auth": true,
  "mode": "quick"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `v` | number | yes | must be 1 |
| `type` | string | yes | must be `opencode-connection` |
| `name` | string | yes | display name, trimmed, non-empty, max 64 chars |
| `url` | string | yes | http(s) URL, no trailing slash |
| `auth` | boolean | no | default true; if true the app prompts for a password on import |
| `mode` | string | no | `"quick"` \| `"named"`; if quick the row shows an ephemeral badge |

Password is never part of the payload.

## 5. App-side changes

### 5.1 Dependency

- `expo-camera` (via `npx expo install expo-camera` — note npm 11 script gate:
  use plain `npm install` after the version lands in package.json).

### 5.2 New route — `app/connect/scan.tsx`

Camera scanner screen:
- Uses `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ["qr"] }}`
  and `onBarcodeScanned`
- On scan: `parseConnectPayload(data)` → if null, show inline "not a valid
  connection QR" and keep scanning
- If valid: if `auth` is true, show a password prompt (SecureStore flow reuses
  `addConnection` from the connections store); create the connection, show
  success, `router.back()` to Connections
- Full-screen camera with a scan-frame overlay, cancel/back button,
  Apple-dark styling consistent with Phase 1 tokens

### 5.3 Connections screen — `app/(tabs)/connections.tsx`

- **"Expose over internet" card** at top of the list: explains one-line
  install, shows copyable command
  `curl -fsSL https://raw.githubusercontent.com/<repo>/main/scripts/opencode-remote/cli.mjs | node -- start`,
  mentions the QR appears on screen and "Scan to connect" reads it
- **"Scan to connect"** button (near the FAB) → `router.push("/connect/scan")`
- Connection rows gain:
  - tunnel mode badge: `quick` → amber "Quick" chip; `named` → accent "Stable" chip
  - health dot already exists (green when active) — extend to gray/amber when
    `pingHealth` fails, without blocking the list
- Manual add / edit screens unchanged (existing `app/connection/add.tsx`)

### 5.4 Store changes

- `ServerConnection` gains optional `tunnelMode?: "quick" | "named"` and
  `tunnelUrl?: string` (informational; `url` remains the canonical connect
  target). Defaults preserve backward compatibility with saved connections.
- `addConnection` accepts the new optional fields (existing signature
  extended, not changed).

## 6. Error handling

CLI:
- Exit non-zero with a human message on: cloudflared missing, port not open,
  domain not configured for named mode, cloudflared failing to launch
- `doctor` prints exactly what to fix, command by command
- `status` reports cloudflared not running as a normal state (exit 0) — only
  true errors exit non-zero

App:
- Scanner invalid-QR → inline message, keep scanning (no modal churn)
- Password prompt cancel → abort import, no partial connection
- Network failure on import → toast/alert with existing error copy

## 7. Testing

CLI (`scripts/opencode-remote/cli.test.mjs`, node:test):
- payload builder produces valid single-line JSON matching the app parser's
  expectations (contract parity test reads the payload shape)
- state file read/write round-trip
- quick-tunnel URL parsing from fake cloudflared stdout
- port detection with `--port` and default
- mode decision: named when state configured, quick otherwise

App (node --test, `src/lib/connect-qr.test.ts`):
- `parseConnectPayload`: valid payload round-trips through build+parse
- rejects: wrong type, wrong v, missing name/url, bad URL scheme, trailing
  slash stripped, non-JSON garbage
- optional fields default correctly (`auth` true, `mode` undefined)
- max name length

Full gate: `npx eslint src app scripts; npx tsc --noEmit; npm test`
(285+ existing must stay green).

## 8. Scope boundaries (explicit non-goals for this sub-project)

- No Cloudflare Access integration (auth stays opencode username/password)
- No push notifications (later sub-project)
- No changes to SSE transport or the reconnect loop (already works)
- No iOS/Android widgets or share extensions (later sub-project)
- No full health dashboard (latency/uptime history) — later sub-project; only
  row-level health dot extension here
- No npm publication of the CLI yet — raw GitHub URL is the distribution path;
  a package.json wrapper is included so `npm publish` becomes a future option
