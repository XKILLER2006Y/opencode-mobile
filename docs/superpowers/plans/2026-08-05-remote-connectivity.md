# Implementation Plan — Remote Connectivity (Sub-project A)

Date: 2026-08-05
Branch: `feat/remote-connectivity`
Spec: `docs/superpowers/specs/2026-08-05-remote-connectivity.md`

## Task 1 — CLI core (`scripts/opencode-remote/cli.mjs`)

Files:
- `scripts/opencode-remote/cli.mjs` — single-file Node CLI
- `scripts/opencode-remote/cli.test.mjs` — node:test unit tests
- `scripts/opencode-remote/package.json` — wrapper (name `opencode-remote`,
  bin, engines node >= 18) for future publish; no install needed to run
  in-repo

Functions in `cli.mjs`:
- `main()` — argv dispatch (`start|status|stop|restart|setup-domain|doctor`,
  `--port`)
- `ensureCloudflared()` — find binary on PATH; if missing, print exact
  install instructions per-platform and exit 1 (no silent download — keep
  script predictable)
- `loadState()` / `saveState()` — `~/.config/opencode-remote.json`,
  try/catch around read; write with atomic tmp+rename
- `pickMode(state)` — named if state.mode === "named" && state.tunnelId,
  else quick
- `startQuickTunnel(port)` — spawn cloudflared, parse
  `https://<id>.trycloudflare.com` from stdout, print payload
- `startNamedTunnel(state, port)` — spawn `cloudflared tunnel run <id>`,
  print payload from state.domain
- `setupDomain()` — sequential guidance: run `cloudflared tunnel login`
  (interactive, spawn with inherited stdio), then `tunnel create`, then
  `tunnel route dns`; persist state; idempotent if state already configured
- `printPayload(url, mode)` — single-line JSON:
  `{"v":1,"type":"opencode-connection","name":...,"url":...,"auth":true,"mode":...}`
  name = `os.hostname()`; try `require("qrcode")` for terminal QR, fall back
  to printing the JSON line
- `checkHealth(port)` — fetch `http://127.0.0.1:port/global/health` with
  AbortController timeout (2s); used by `status`/`doctor`
- `status()` / `doctor()` — read state, `ps`-style process check via
  `child_process.execFile("pgrep", ...)` on unix / `tasklist` on win32

Tests (node:test, no network):
- payload JSON shape + fields
- parse of fake quick-tunnel stdout line → URL
- state round-trip
- mode decision both ways
- `--port` parsing

Verification: `node --test scripts/opencode-remote/cli.test.mjs`

## Task 2 — QR payload lib + tests (app)

Files:
- `src/lib/connect-qr.ts` — `parseConnectPayload`, `buildConnectPayload`
- `src/lib/connect-qr.test.ts` — node:test unit tests

Parsing rules (from spec §4): strict type/v check, name trimmed 1..64,
url http(s), no trailing slash, auth default true, mode optional.

Verification: `npx tsc --noEmit; npx eslint src/lib/connect-qr.ts
src/lib/connect-qr.test.ts; npm test`

## Task 3 — Scanner screen (`app/connect/scan.tsx`)

- Install `expo-camera` (plain npm install; pin version from `npx expo
  install --check` equivalent — resolve manually, e.g. `~14.x` for SDK 54;
  confirm against installed expo version)
- `app/connect/scan.tsx` — CameraView, barcode scanner config QR only,
  scan-frame overlay, cancel button, inline invalid-QR message, password
  prompt via existing `addConnection` flow (password → SecureStore),
  success → `router.back()`
- `app/connect/_layout.tsx` — stack header if needed (or headerShown false)

Verification: `npx tsc --noEmit; npx eslint app/connect`

## Task 4 — Connections screen additions

- `src/lib/connect-qr.ts` gains `installCommand` constant + build copy
- `app/(tabs)/connections.tsx`:
  - "Expose over internet" card (copy button via Clipboard)
  - "Scan to connect" button → `/connect/scan`
  - row badges: quick → amber "Quick" chip; named → accent "Stable" chip
  - health dot: extend to gray/amber when `pingHealth` fails
- `src/stores/connections.ts`: optional `tunnelMode`/`tunnelUrl` fields +
  `addConnection` signature extension (backward compatible)

Verification: `npx tsc --noEmit; npx eslint src app; npm test`

## Task 5 — Full gate + docs

- Full gate: `npx eslint src app scripts; npx tsc --noEmit; npm test`
- Update ledger (docs/ledger.md) + README quick-start for remote
- Commit remaining work

## Ordering

1 → 2 (contract parity, app parser tested before scanner UI) → 3 → 4 → 5.
Each task commits separately.
