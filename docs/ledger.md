# Project Ledger

Dated record of significant changes, newest first. Each entry links to the
plan/spec that drove it.

---

## 2026-08-05 — Remote connectivity: opencode-remote CLI + QR pairing

Branch: `feat/remote-connectivity` → `main`
Spec: `docs/superpowers/specs/2026-08-05-remote-connectivity.md`
Plan: `docs/superpowers/plans/2026-08-05-remote-connectivity.md`

Expose a local opencode server through a Cloudflare Tunnel and connect from the
app by scanning a QR code — no manual URL entry, no password sharing through
the payload.

### Task 1 — `opencode-remote` CLI (`9798f5b`)

- `scripts/opencode-remote/cli.mjs` — zero-dependency Node CLI:
  - `start` — quick tunnel (cloudflared, random `trycloudflare.com` URL), prints
    QR, waits for Ctrl+C
  - `start --name <subdomain>` — named tunnel (stable URL) via `setup-domain`
  - `setup-domain` — one-time `cloudflared tunnel login` → `tunnel create` →
    DNS route; idempotent, state in `~/.config/opencode-remote.json`
  - `stop`, `restart`, `status` (exit 0 when idle), `doctor` (checks node,
    opencode port, cloudflared, domain config), `version`
- QR payload is connection *metadata only* — never the password
- 19 unit tests: `scripts/opencode-remote/cli.test.mjs` (TAP, `node --test`)

### Task 2 — QR contract shared lib (`0d2b50e`)

- `src/lib/connect-qr.ts` — `buildConnectPayload` / `parseConnectPayload`
  (versioned `{"v":1,"type":"opencode-connection",...}`), `TunnelMode` type
  (`"quick" | "named"`), `INSTALL_COMMAND` constant
- Round-trip + tamper tests: invalid/missing fields, wrong version, unknown
  mode, oversized URL, URL scheme validation
- 9 unit tests alongside the lib

### Task 3 — QR scanner screen (`58ee5dd`)

- `app/connect/scan.tsx` — `expo-camera` `CameraView`, QR-only barcode scan,
  camera permission flow (grant / open settings when permanently denied),
  scan-frame overlay, inline invalid-QR message (keeps scanning), cancel
  button, password bottom-sheet when the payload declares `auth: true`
- Save via existing `addConnection` → SecureStore; success pops back to
  Connections; failure → alert with existing error copy, no partial connection
- `app/_layout.tsx` — `connect/scan` registered as a modal screen
- `src/lib/types.ts` — `ServerConnection.tunnelMode?: TunnelMode`
- i18n: `connectScan.*` added to `en.json` + `zh-Hans.json` (parity enforced
  by test)
- Gate: tsc + eslint clean, 294 tests pass

### Task 4 — Connections screen pairing UI (`a71e089`)

- `app/(tabs)/connections.tsx`:
  - Expose card — shows the one-line `opencode-remote` install command with
    copy-to-clipboard feedback (2s "Copied")
  - "Scan to connect" button → `/connect/scan`
  - Tunnel rows show mode chip: amber **Quick** (random URL) / indigo
    **Stable** (named subdomain)
  - Per-row health dot: green reachable / amber ping failed / gray unknown,
    pinged on screen mount via `pingHealth`
- i18n: `connectionsList.modeBadges.*`, `exposeCard.*`, `scan` in both
  catalogs
- `addConnection` needed no change — it already spreads `ServerConnection`
  fields, so `tunnelMode` persists through SecureStore

### Task 5 — Full gate + docs (`2436925`)

- Full gate: `npx eslint src app scripts; npx tsc --noEmit; npm test`
- This ledger + README quick-start for remote
