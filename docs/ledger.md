# Project Ledger

Dated record of significant changes, newest first. Each entry links to the
plan/spec that drove it.

---

## 2026-08-05 — Merged: remote connectivity + CI keystore fix

- PR #2 `fix/ci-keytool-keystore` → main (`43c2b11`): `rm -f
  android/app/debug.keystore` before `keytool -genkey` in
  `cua-smoke.yml`, `activation-e2e.yml`, `publish-fdroid.yml`. Root cause:
  `expo prebuild` already generates the debug keystore, so keytool failed
  with "alias androiddebugkey already exists" on every run — killed CUA
  Smoke, Activation E2E, and publish-fdroid.
- PR #1 `feat/remote-connectivity` → main (`fc11770`), merge commit for the
  entry below. All automated checks green on merge: Build Android APK,
  iOS CI, Activation E2E (Maestro). CUA Smoke deferred to human (needs
  Azure secrets + Mac emulator on this repo).
- Main CI after both merges: Build Android APK ✅, iOS CI ✅, Activation
  E2E ✅.

---

## 2026-08-05 — Merged: professional polish (onboarding, a11y, theme tokens, haptics, component tests)

- PR #3 `feat/professional-polish` → main (`cdf4a17`, fast-forward merge),
  entry below. All CI green on the branch: Build Android APK ✅ (23m),
  iOS CI ✅ (4m51s), Activation E2E ✅ (28m, core flows; demo/diff-scroll
  newer flows remain non-blocking #104). Full suite green on merged main:
  `npm test` 303/0, `npm run test:ui` 5/5, tsc clean, eslint clean.
- CUA Smoke deferred to human as before (needs Azure secrets + Mac emulator).

---

## 2026-08-05 — Professional polish: onboarding, a11y, theme tokens, haptics, component tests

Branch: `feat/professional-polish` → `main` (merged, PR #3)
Plan: `docs/superpowers/plans/2026-08-05-professional-polish.md`

Sequential implementation plan covering the onboarding flow (welcome screen,
helper screen, persistence via `src/lib/onboarding-secure.ts` +
`src/stores/onboarding.ts`), accessibility labels/roles across app screens and
chat components, consolidation of hardcoded colors/typography/spacing into
design tokens (`src/lib/theme.ts`), tactile haptics on connect/send actions,
and a jest-expo + React Native Testing Library harness with component tests.

### Task 8 — Theme tokens in components (`704ed70`)

`refactor(theme): design tokens in components` — replaced hex literals across
20 components + `src/lib/theme.ts` with `theme.colors`/`theme.spacing`/
`theme.radius`/`theme.typography` tokens; fixed eslint hook deps in
`chat/ToolCallCard.tsx` and `chat/DirectoryBrowserSheet.tsx`.

### Task 9 — Haptics (`52adf80`)

`feat(haptics): tactile feedback on connect and send actions` — added
`src/lib/haptics.ts` (`hapticTap`/`hapticSuccess`/`hapticError`) wired into
the connect FAB, scan/add-success, failure paths, and send action.

### Task 10 — Jest + RTL infra (`0dd4a02`)

`test(ui): jest-expo + RTL infra and CI wiring` — `jest.config.js`,
`jest.setup.js`, `test:ui` script, `TelemetryConsentModal.test.tsx`, and CI
wiring in build.yml/ios-ci.yml. `react-test-renderer` is a bad fit on React
19.2; RNTL v14 needs `test-renderer@1.2`.

### Task 11 — Component tests (`9329cdb`)

`test(ui): onboarding flow component tests` — `src/lib/onboarding-flow.test.tsx`
covers the welcome render and Skip completing onboarding + navigating to
`(tabs)`; added jest globals to eslint for `jest.setup.js`.

### Task 12 — Final verification

Full suite green (`npm test` 303/0, `npm run test:ui` 5/5, `tsc` clean,
`eslint` clean); hex-literal grep guard found one leftover `#FFFFFF` in
`app/onboarding.tsx` — tokenized (`fc2995c`). Branch pushed, PR #3 opened,
all CI green on `feat/professional-polish`: Build Android APK ✅ (23m),
iOS CI ✅ (4m51s), Activation E2E ✅ (28m, core flows; demo/diff-scroll
newer flows remain non-blocking #104), typecheck + unit + component tests ✅.

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
