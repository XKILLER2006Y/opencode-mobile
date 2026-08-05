# First-Launch Onboarding — Spec

Date: 2026-08-05
Status: Approved design (pending implementation plan)

## Problem

A fresh install shows an empty Connections screen with no guidance. New users
don't know what the app is (a remote client for an opencode server running on
their PC) or how to set up their first connection. There is no guide or setup
helper.

## Goal

Show a short onboarding flow on **first install only**: a guide screen
explaining what the app does, then a setup helper that gets the user to add
their first server connection (QR scan or manual add). Once shown (completed
or skipped), onboarding never appears again.

Non-goals: no explainer carousels beyond one welcome screen, no biometric /
notification / telemetry setup inside onboarding (those stay in their existing
first-launch surfaces), no "show until connected" persistence.

## User Flow

1. User installs and opens app for the first time.
2. Welcome screen appears (full screen, no tabs):
   - Title + one-line value prop: *"Control the opencode server running on
     your PC from your phone."*
   - 2–3 feature bullets: Sessions, Remote commands, QR pairing.
   - Primary button **"Get Started"** → setup helper.
   - Text button **"Skip"** → mark onboarding complete, go to app.
3. Setup helper screen shows two options:
   - **"Scan QR code"** → existing `connect/scan.tsx` (QR pairing from
     remote-connectivity).
   - **"Add manually"** → existing `connection/add.tsx`.
   - Both screens already work: successful `addConnection` → `router.back()`.
4. After a successful connection (or Skip): onboarding flag is set. The app
   opens to normal UI (Connections tab is the active state after back).
5. Every subsequent launch: flag present → straight into the app. Never
   shown again, even if the user later deletes all connections.

## Trigger Logic

Onboarding shows when **both**:

- `onboardingCompleted !== true` (flag absent in SecureStore), AND
- `connections.length === 0` (fresh install; a user who reinstalls and
  restores their connection list does not get pushed through setup again).

Root layout waits for `onboardingLoading` alongside the existing
`connectionsLoading` before rendering (same loading gate as today).

## Architecture

### New files

- `app/onboarding.tsx` — welcome + setup-helper screen (single route;
  internal state flips between the guide step and the two-option helper).
- `src/lib/onboarding.ts` — persistence helpers following the existing
  `src/lib/telemetry.ts` pattern:
  - `loadOnboardingCompleted(): Promise<boolean>` — reads SecureStore key.
  - `completeOnboarding(): Promise<void>` — writes the flag.
- `src/lib/onboarding.test.ts` — unit tests for the two helpers
  (round-trip, default false, error fallback).

### Changed files

- `app/_layout.tsx` — root gate:
  - Load onboarding flag with the other bootstrap loads.
  - If `!onboardingCompleted && connections.length === 0`, render a Stack
    that registers `onboarding`, `connect/scan`, `connection/add`
    (headerShown false / modal, same options as today) instead of the normal
    Stack.
  - Otherwise render the normal Stack (unchanged).
  - Because `connect/scan` and `connection/add` are registered in **both**
    Stack configs, a modal opened from onboarding stays open when the flag
    flips; `router.back()` then lands on the normal app. If the route the
    user is on (e.g. `onboarding`) is not in the new config, explicitly
    `router.replace("/(tabs)")` after `completeOnboarding()`.
- `src/stores/connections.ts` — no change needed (verified: `addConnection`
  already activates the first connection and persists via SecureStore).
- `src/lib/i18n/en.json` + `zh-Hans.json` — `onboarding.*` keys; parity is
  enforced by the existing `catalog-parity` test.

## Edge Cases

- **Notification tap on first launch** — root gate renders before any
  navigation, so onboarding still shows first.
- **Reinstall with restored connections** — `connections.length > 0` →
  gate false → no onboarding.
- **Skip** — sets the flag immediately; user lands in the app with the
  existing empty Connections state; onboarding never returns.
- **Connection save failure inside onboarding** — the existing screens
  already show their own error alerts and stay open; onboarding remains on
  screen, nothing extra needed.
- **Biometric lock** — `AuthGate` wraps the Stack; onboarding sits inside it
  like every other screen (no change).

## Testing

- Unit: `src/lib/onboarding.test.ts` (persistence round-trip, default,
  failure fallback).
- Existing gates: `npx eslint src app scripts`, `npx tsc --noEmit`,
  `npm test` (294+ tests must stay green, incl. i18n parity).
- CI: feature branch runs Build Android APK, iOS CI, Activation E2E
  (Maestro) automatically. CUA Smoke Test stays as-is (per decision: keep,
  manual/human-gated).

## Open Questions

None — resolved during brainstorming:
- Scope: connection setup only (no full wizard).
- Skip: allowed; flag persists forever (first-install-only, per user).
- UI: dedicated onboarding screen reusing existing scan/add screens.
- Post-connection: straight into app with success (existing back behavior).
