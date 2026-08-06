# Project Ledger

Dated record of significant changes, newest first. Each entry links to the
plan/spec that drove it.

---

## 2026-08-06 — UI polish: branding leak, FAB overlap, clean app icon

Follow-up to the UI screenshot review. Three verified issues fixed:

1. **Branding leak in install command.** `INSTALL_COMMAND` in
   `src/lib/connect-qr.ts` pointed at `dzianisv/opencode-mobile` (upstream
   author's repo). Distributed builds now install the CLI from this project's
   own repo (`XKILLER2006Y/opencode-mobile`) so the app is self-consistent.
   Test hardened with a branding guard (asserts owner + absence of upstream).

2. **FAB overlapped page-size pills.** Connections screen FAB is absolutely
   positioned (bottom:16/right:16) and the FlatList had no bottom padding, so
   the footer (preferences / last connection) scrolled under it. Added
   `fabClearance` (paddingBottom: 96) to the content container in both states.

3. **App icon wordmark garbled on launchers.** The adaptive icon had a baked-in
   "opencode" wordmark under the terminal chevron; Android's circular mask
   cropped it into unreadable text ("pencod"). Regenerated all four icon assets
   (`icon.png`, `adaptive-icon.png`, `splash-icon.png`, `icon-appstore.png`)
   via `scripts/gen-icon.mjs` (pngjs only): clean `>_` terminal prompt, mint
   on `#0F172A`, fully opaque squares for App Store compliance. Generator is
   committed so future icon changes are reproducible.

Note: the "(tabs)" header seen in old screenshots was already fixed upstream
(`headerShown: false` for the group in `app/_layout.tsx`, since the onboarding
root gate) — no code change needed; it only appears on pre-fix installs.

## 2026-08-06 — Remote monitoring: live connection state + running session badges

Motivation (user pain): "har ek cheez ke liye pc pe bhaagna pade" — the app is
meant to be the remote control so you don't have to run to the PC, but two
monitoring signals lied or were missing.

1. **Connection dot was hardcoded green.** The sessions home bar always rendered
   `theme.colors.light.statusSuccess` even when the SSE stream was down or
   reconnecting — a remote watcher saw "connected" while the agent was silently
   stalled.
   - `src/lib/connection-status.ts` (new): `connectionDotState(connected,
     reconnectAttempts, authError)` → `online | reconnecting | auth_error |
     offline`, plus a label-key helper. Order: auth_error > online >
     reconnecting > offline.
   - `app/(tabs)/index.tsx`: dot color + accessibilityLabel now follow the live
     state (green/amber/red/grey, scheme-aware). `useEvents` selectors for
     `connected` / `reconnectAttempts` added.

2. **No way to tell which session is still running at a glance.** You had to open
   each session to see the StatusIndicator.
   - `src/lib/busy-reconcile.ts`: added `isSessionRunning(sessionStatus, sending,
     sessionID)` — O(1) per row, semantically the union of
     `busySessionCandidates` for one id.
   - `app/(tabs)/index.tsx`: `SessionItem` gains a live "Working…" badge (pulsing
     dot + label) when the session is busy in either flag.
   - i18n: new `connectionBar.status.*` group + `sessionsList.running` in
     `en.json` and `zh-Hans.json` (catalog-parity preserved).

Full gate: `npm test` 319/319, `npx jest --ci` 5/5, `tsc --noEmit` clean,
`eslint .` clean. Version bumped 0.4.14 (41) → 0.4.15 (42) across app.json,
package.json, android/app/build.gradle for the tagged release.

---

## 2026-08-06 — Fix: stale busy/processing spinner on resilient reconnects

Bug: a session could stay marked busy — endless 'processing' spinner — after
certain reconnects where a `busy -> idle` `session.status` event was missed
during the tear-down window.

Root causes (both in `src/stores/events.ts`):
1. The busy-session resync on reconnect was gated on `reconnectAttempts > 0`,
   but that counter is only nonzero after a *retry loop*. When the prior
   connection was live and stable it is `0`, so these paths skipped resync:
   the connection-edit reconnect (`app/connection/[id].tsx`), the post-
   `authError` reconnect, and a manual `disconnect()` → `connect()`.
2. `disconnect()` wipes `sessionStatus` but intentionally leaves
   `useSessions.sending`, so a stuck optimistic send could not even be seen
   by the resync (which only looked at `sessionStatus`).

Fix:
- `src/lib/busy-reconcile.ts` (new): `busySessionCandidates()` — the union of
  `sessionStatus.busy` and `sending === true` entries, deduped. Safe by
  design: it never forces a session busy, only surfaces candidates the
  conservative `isSessionActuallyIdle` verdict may clear if the server
  confirms they're stale.
- `events.ts`: resync now arms on the FIRST live event of every established
  stream (no longer gated on retry count), and considers both busy flags.

Tests: `src/lib/busy-reconcile.test.ts` (7 cases, `node:test`). Full gate green:
`npm test` 310/310, `npx jest --ci` 5/5, `tsc --noEmit` clean, `eslint .` clean.

---

## 2026-08-06 — Upstream parity audit (dzianisv/opencode-mobile main)

Line-level audit of all 45 meaningful changed files between our fork and
upstream `main` (285 commits, 221 files, no shared merge base). Result:
**nothing critical left to port** — every upstream runtime/UX/security fix is
already present in our fork, and where we differ we are equal or ahead.

Verified as **already present / identical or better**, with evidence:
- `session-load-reconcile.ts`, `sse.ts`, `message-merge.ts`, `speech.ts`,
  `analytics.ts`, `diagnostics-classify.ts`, `session-status-reconcile.ts`,
  `src/stores/events.ts` rotation + per-session permission/question filtering,
  `product-intelligence.yml` — **file-identical** to upstream (0 diff lines).
- Recent sessions grouping, reasoning-effort picker, filesystem-roots browser
  (`/file/roots`), `summary.files > 0` guard (no "0 files"), toolbar-above-
  keyboard `KeyboardAvoidingView`, revert/edit messages, per-session
  permission/question keys, `apiErrorFor` auth classification — **all present**.
- CI: `check-version-parity.mjs` wired, Maestro diagnostics archive + upload,
  progressive-failure streak classification, `build-fdroid` stripped artifact
  job — **already in our workflows**.
- i18n `en.json`/`zh-Hans.json`: full key parity; the few upstream-only keys
  are waitlist/growth copy we intentionally do not ship.

Deliberately NOT ported (out of scope for a personal Android fork): growth/
marketing layer (founding-member leads, SEO landing pages, OpenCode Connect
waitlist funnel, Chatwoot, PostHog funnel scripts, store-review prompts) and
iOS/Play metadata that only applies to the owner's accounts.

Infra where our fork is AHEAD of upstream:
- Android Gradle **9.3.1** vs upstream 8.14.3; JVM heap **4096m** vs 2048m;
  `edgeToEdgeEnabled=true` present.
- `expo-notifications ~57.0.8` vs upstream `~0.32.16` (modern FCM patch layout
  `com/google/firebase/messaging/` matches our SDK; upstream's `notifications/`
  layout targets its older SDK).
- `versionCode 41` / `0.4.14` vs upstream `main` 0.4.12.

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
