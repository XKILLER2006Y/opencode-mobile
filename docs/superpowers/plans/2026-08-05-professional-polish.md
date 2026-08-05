# Professional Polish + First-Launch Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship first-launch onboarding AND close the professional-review gaps found in the audit: accessibility labels on every interactive element, design-token consolidation (no hardcoded colors), haptic feedback on key actions, and component render tests.

**Architecture:** Onboarding gates the root Stack in `app/_layout.tsx` via a SecureStore flag (`src/lib/onboarding.ts`) + `connections.length === 0`. Theme tokens are extended in `src/lib/theme.ts` with exact hex→token mapping tables so screens swap hardcoded colors for tokens with zero visual change. A11y uses RN's `accessibilityRole`/`accessibilityLabel`/`accessibilityHint` on every interactive element. Haptics via `expo-haptics`. Component tests via new jest-expo infra kept alongside the existing `node --test` runner.

**Tech Stack:** Expo SDK 57, React Native 0.86, expo-router, zustand, expo-secure-store, expo-haptics (new), jest-expo + @testing-library/react-native (new, dev-only), react-i18next.

## Global Constraints

- Every test must pass: `npm test` (node --test) AND `npx tsc --noEmit` AND `npx eslint src app scripts` — verified before every commit claim.
- i18n parity: any new `en.json` key MUST be added to `zh-Hans.json` (catalog-parity test enforces).
- Theme consolidation: hex→token swaps MUST use the exact mapping table in Task 1 — no visual change, no invented colors.
- A11y: every `TouchableOpacity`/`Pressable` gets `accessibilityRole="button"` (or "link"/"menuitem" as appropriate) + `accessibilityLabel` (visible text is fine — label optional if text exists) ; `TextInput` gets `accessibilityLabel`; color-only indicators get `accessibilityLabel` text.
- No `any`, no `try/catch` where avoidable, early returns, single-word vars where natural — follow `AGENTS.md` style guide.
- Do NOT touch `scripts/android-cua-smoke.py` or `cua-smoke.yml` (user decision: leave CUA as-is).
- Do NOT reinstall/change existing working dependencies; only ADD `expo-haptics` and jest dev-deps via `npx expo install` so versions match SDK 57.

---

### Task 1: Extend Theme Tokens + Mapping Table

**Files:**
- Modify: `src/lib/theme.ts`
- Modify: `src/lib/theme.test.ts`

**Interfaces:**
- Consumes: existing `theme` object and `getTheme(isDark)`.
- Produces: new semantic tokens `statusNeutral`, `healthOk`, `healthWarn`, `healthUnknown`, `indigo`, `indigoDark`, `zinc*` aliases, `iconDefault`, `iconMuted`, `bgApp` per mode. Later tasks reference `theme.colors.dark/light` via `getTheme`.

**Mapping table (exact — implementers MUST use these, no invention):**

| Hardcoded (light) | Hardcoded (dark) | Token (dark) | Token (light) |
|---|---|---|---|
| `#ffffff` bg / `#0a0a0a` container | `#0a0a0a` | `bgApp: "#000000"` | `bgApp: "#F2F2F7"` |
| `#09090B` text | `#FAFAFA` | `textPrimary` | `textPrimary` |
| `#71717A` url | `#A1A1AA` | `textSecondary` | `textSecondary` |
| `#A1A1AA` meta | `#A1A1AA` | `textMuted` | `textMuted` |
| `#666666` / `#999999` icons | `#888888` / `#666666` | `iconMuted` (same as textMuted) | `iconMuted` |
| `#22c55e` green / `#16A34A` dark | `#16A34A` | `healthOk: "#30D158"` | `healthOk: "#34C759"` |
| `#f59e0b` amber | `#f59e0b` | `healthWarn: "#FF9F0A"` | `healthWarn: "#FF9500"` |
| `#a1a1aa` gray | `#a1a1aa` | `healthUnknown: "#AEAEB2"` | `healthUnknown: "#8E8E93"` |
| `#6366f1` / `#4338ca` indigo | `#3730a3` / `#c7d2fe` | `indigo: "#6366F1"` | `indigo: "#6366F1"` |
| `#f0f0ff` card bg / `#1e1b4b` dark | `#1e1b4b` | `indigoBg: "#1E1B4B"` | `indigoBg: "#F0F0FF"` |
| `#eef2ff` box / `#312e81` dark | `#312e81` | `indigoBox: "#312E81"` | `indigoBox: "#EEF2FF"` |
| `#e5e5e5` / `#1a1a1a` borders | `#1a1a1a` | `border` | `border` |
| `#3b82f6` blue | `#3b82f6` | `accent` | `accent` |
| `#22C55E` badge | `#16A34A` | `statusSuccess` | `statusSuccess` |

- [ ] **Step 1: Add tokens to `theme.ts`** — extend `dark` and `light` color objects with `bgApp`, `healthOk`, `healthWarn`, `healthUnknown`, `indigo`, `indigoBg`, `indigoBox`, `iconMuted` (alias), using the table above.
- [ ] **Step 2: Extend `theme.test.ts`** — add assertions: dark `bgApp === "#000000"`, dark `healthOk === "#30D158"`, light `indigoBg === "#F0F0FF"`, `iconMuted` exists in both modes.
- [ ] **Step 3: Run tests** — `npm test` passes (theme tests + everything else).
- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat(theme): add semantic tokens for a11y/health/indigo surfaces"
```

---

### Task 2: Onboarding Persistence Lib (TDD)

**Files:**
- Create: `src/lib/onboarding.ts`
- Test: `src/lib/onboarding.test.ts`

**Interfaces:**
- Consumes: `expo-secure-store` (pattern from `src/lib/telemetry.ts`).
- Produces: `loadOnboardingCompleted(): Promise<boolean>`, `completeOnboarding(): Promise<void>`.

- [ ] **Step 1: Write failing test** — `src/lib/onboarding.test.ts` with three tests: `loadOnboardingCompleted` returns `false` when no flag stored; `completeOnboarding` persists then `loadOnboardingCompleted` returns `true`; both functions resolve without throwing when SecureStore fails (mock rejects).
- [ ] **Step 2: Run to verify fail** — `npm test` shows failing (module missing).
- [ ] **Step 3: Implement** — mirror `telemetry.ts` shape:

```ts
import * as SecureStore from "expo-secure-store"

const ONBOARDING_KEY = "opencode_onboarding_completed"

export async function loadOnboardingCompleted(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(ONBOARDING_KEY)
    return raw === "true"
  } catch {
    return false
  }
}

export async function completeOnboarding(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true")
  } catch {
    // Non-fatal: worst case onboarding shows again next launch
  }
}
```

- [ ] **Step 4: Run to verify pass** — `npm test` green.
- [ ] **Step 5: Commit**

---

### Task 3: Onboarding Screen + i18n (TDD-adjacent)

**Files:**
- Create: `app/onboarding.tsx`
- Modify: `src/lib/i18n/en.json`
- Modify: `src/lib/i18n/zh-Hans.json`

**Interfaces:**
- Consumes: `loadOnboardingCompleted`/`completeOnboarding` from Task 2, `useConnections` (existing), `router` from expo-router, `useTranslation`.
- Produces: route `app/onboarding.tsx` with two internal steps (guide → helper). Buttons: "Get Started" → helper; "Scan QR code" → `router.push("/connect/scan")`; "Add manually" → `router.push("/connection/add")`; "Skip" → `completeOnboarding()` then `router.replace("/(tabs)")`.

- [ ] **Step 1: Add i18n keys** — `onboarding.welcomeTitle`, `onboarding.welcomeSubtitle`, `onboarding.feature1`, `onboarding.feature2`, `onboarding.feature3`, `onboarding.getStarted`, `onboarding.skip`, `onboarding.helperTitle`, `onboarding.scanQr`, `onboarding.addManually` — BOTH `en.json` and `zh-Hans.json`.
- [ ] **Step 2: Verify parity** — `npm test` catalog-parity passes.
- [ ] **Step 3: Build screen** — full-screen Apple-style: large title, 3 feature rows with icons, two CTA buttons. Style with `getTheme(isDark)` tokens (no hardcoded colors). A11y: buttons get `accessibilityRole="button"`; Skip is `accessibilityRole="button"`.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npx eslint app/onboarding.tsx`, `npm test`.
- [ ] **Step 5: Commit**

---

### Task 4: Root Gate in `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `loadOnboardingCompleted` from Task 2, `useConnections().connections`, `completeOnboarding` (via screens).
- Produces: conditional Stack — onboarding Stack when `!onboardingCompleted && connections.length === 0`, normal Stack otherwise. Both configs register `connect/scan` + `connection/add`.

- [ ] **Step 1: Read current `_layout.tsx`** and locate the bootstrap `useEffect` that loads stores.
- [ ] **Step 2: Add onboarding state** — `const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)`; load `loadOnboardingCompleted()` in bootstrap alongside connections; set state.
- [ ] **Step 3: Conditional render** — while loading (`connectionsLoading || onboardingDone === null`) render existing splash/loading. Then:
  - if `!onboardingDone && connections.length === 0` → render `<Stack>` with screens `onboarding`, `connect/scan`, `connection/add` (headerShown false / modal options).
  - else → existing normal `<Stack>` (unchanged).
  - Both `Stack.Screen` configs MUST include `connect/scan` and `connection/add` so a modal opened from onboarding stays valid after flag flip.
- [ ] **Step 4: Completion path** — in `app/onboarding.tsx`, after `completeOnboarding()` on skip AND in `connect/scan.tsx` + `connection/add.tsx` success paths, call `router.replace("/(tabs)")` when onboarding is active. Implement by checking a small shared helper `finishOnboarding()` in `src/lib/onboarding.ts` that calls `completeOnboarding()`; screens call it before their existing `router.back()`.
- [ ] **Step 5: Update scan/add success** — in `connect/scan.tsx` `saveConnection` and `connection/add.tsx` both save branches: call `await completeOnboarding()` BEFORE `router.back()` (flag flip makes root gate render normal Stack; back lands on app).
- [ ] **Step 6: Verify** — `npx tsc --noEmit`, `npx eslint app/_layout.tsx app/connect/scan.tsx app/connection/add.tsx app/onboarding.tsx`, `npm test`.
- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx app/onboarding.tsx app/connect/scan.tsx app/connection/add.tsx src/lib/onboarding.ts
git commit -m "feat(onboarding): root gate + first-launch flow"
```

---

### Task 5: A11y Pass — App Screens

**Files:**
- Modify: `app/(tabs)/connections.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`, `app/connect/scan.tsx`, `app/connection/add.tsx`, `app/connection/[id].tsx`, `app/session/[id].tsx`, `app/demo.tsx`

**Pattern (apply to EVERY interactive element):**
- `<TouchableOpacity onPress={...}>` → add `accessibilityRole="button"`; if the element has no text child (icon-only, e.g. FAB, ellipsis, copy icon), add `accessibilityLabel={t("...")}` — reuse existing i18n key text where it exists.
- `<TextInput ...>` → add `accessibilityLabel` (placeholder is NOT a label for screen readers).
- Color-only indicators: `healthDot` view gets `accessible={true}` + `accessibilityLabel={health === true ? t("connectionsList.health.healthy") : health === false ? t("connectionsList.health.unreachable") : t("connectionsList.health.unknown")}` — add these 3 keys to both i18n files.
- Long-press-only actions (connection item long-press) — add `accessibilityHint` describing "Long press for actions".

- [ ] **Step 1: Add i18n health keys** — `connectionsList.health.*` in en + zh.
- [ ] **Step 2: `connections.tsx`** — FAB, scan button, copy button, edit ellipsis, page-size options, connection item (role button + hint), healthDot label.
- [ ] **Step 3: `scan.tsx`** — camera permission button, scan controls, manual-entry fields.
- [ ] **Step 4: `add.tsx`** — all inputs (name/url/username/password/token fields) + save/test buttons + tunnel mode pickers.
- [ ] **Step 5: `[id].tsx`, `settings.tsx`, `index.tsx`, `session/[id].tsx`, `demo.tsx`** — every interactive element per pattern.
- [ ] **Step 6: Verify** — `npx tsc --noEmit` + `npx eslint app` + `npm test` (parity catches key drift).
- [ ] **Step 7: Commit**

```bash
git add app src/lib/i18n/en.json src/lib/i18n/zh-Hans.json
git commit -m "fix(a11y): labels/roles/hints on all app-screen interactives"
```

---

### Task 6: A11y Pass — Components

**Files:**
- Modify: all `src/components/**/*.tsx` interactive files: `AuthGate.tsx`, `ErrorBoundary.tsx`, `TelemetryConsentModal.tsx`, `chat/DirectoryBrowserSheet.tsx`, `chat/DirectorySwitcher.tsx`, `chat/ImageAttachments.tsx`, `chat/MessageBubble.tsx`, `chat/ModelPicker.tsx`, `chat/PermissionPrompt.tsx`, `chat/QuestionPrompt.tsx`, `chat/ReasoningBlock.tsx`, `chat/SessionInfo.tsx`, `chat/SlashPopover.tsx`, `chat/ToolCallCard.tsx`, `chat/VariantPicker.tsx`, `markdown/CodeBlock.tsx`

**Pattern:** same as Task 5 — every `TouchableOpacity`/`Pressable` gets role + label when icon-only; `Modal` gets `accessibilityViewIsModal`; confirm/cancel buttons already have text but add role.

- [ ] **Step 1: AuthGate, ErrorBoundary, TelemetryConsentModal** (consent modal already has some — finish it: role on Allow/Decline).
- [ ] **Step 2: chat/* sheets and pickers** (bottom-sheet rows, model/variant rows, permission/confirm buttons, copy button in CodeBlock, slash popover rows).
- [ ] **Step 3: Verify** — `npx tsc --noEmit` + `npx eslint src/components` + `npm test`.
- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "fix(a11y): roles/labels on component interactives"
```

---

### Task 7: Theme Consolidation — App Screens

**Files:** same as Task 5 file list (app screens).

**Rule:** replace every hardcoded hex in `StyleSheet` with the token from the Task 1 mapping table. Use `getTheme(isDark)` at component top and reference via a local `const c = getTheme(isDark)` (or inline `isDark ? c.dark.x : c.light.x`). Keep the existing `isDark && styles.xDark` override structure where present — swap hex literals for token references inside both light and dark style blocks. Do NOT change any radius, spacing, or layout.

- [ ] **Step 1: `connections.tsx`** — all 60+ hex literals via table (this file is the worst offender).
- [ ] **Step 2: `index.tsx`, `settings.tsx`, `scan.tsx`, `add.tsx`, `[id].tsx`, `session/[id].tsx`, `demo.tsx`** — same.
- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npx eslint app`, `npm test`; grep that no `#[0-9a-fA-F]` literals remain in `app/**/*.tsx` EXCEPT in `_layout.tsx` (tab bar uses tokens already — clean those too).
- [ ] **Step 4: Commit**

```bash
git add app
git commit -m "refactor(theme): replace hardcoded colors with design tokens in app screens"
```

---

### Task 8: Theme Consolidation — Components

**Files:** `src/components/**/*.tsx` (same list as Task 6).

**Rule:** same as Task 7.

- [ ] **Step 1: Swap all hex literals in `src/components/**` per mapping table.**
- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npx eslint src/components`, `npm test`; grep no hex literals remain in `src/components/**/*.tsx`.
- [ ] **Step 3: Commit**

```bash
git add src/components
git commit -m "refactor(theme): design tokens in components"
```

---

### Task 9: Haptics

**Files:**
- Modify: `package.json` (via `npx expo install expo-haptics`)
- Modify: `app/(tabs)/connections.tsx`, `app/connect/scan.tsx`, `app/connection/add.tsx`, `app/session/[id].tsx`

- [ ] **Step 1: Install** — `npx expo install expo-haptics` (SDK-57-pinned).
- [ ] **Step 2: Add feedback** — helper `src/lib/haptics.ts`:

```ts
import * as Haptics from "expo-haptics"

export const hapticTap = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
export const hapticSuccess = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
export const hapticError = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
```

- [ ] **Step 3: Wire** — `hapticSuccess()` after successful `addConnection` in scan + add; `hapticTap()` on FAB press and session send button; `hapticError()` on connection save failure.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npx eslint`, `npm test`.
- [ ] **Step 5: Commit**

---

### Task 10: Component Test Infra (jest-expo + RTL)

**Files:**
- Modify: `package.json` (devDeps), `jest.config.js` (new), `package.json` scripts
- Create: `jest.setup.js`
- Modify: `.github/workflows/build.yml` + `ios-ci.yml` (add `npm run test:ui`)

**Interfaces:** produces `npm run test:ui` (jest) that runs `*.test.tsx` component tests; `npm test` (node --test) keeps running logic tests. CI runs both.

- [ ] **Step 1: Install dev-deps** — `npx expo install jest-expo jest @testing-library/react-native react-test-renderer -- --dev` (SDK-57-compatible versions).
- [ ] **Step 2: Create `jest.config.js`:**

```js
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)/)",
  ],
}
```

- [ ] **Step 3: `jest.setup.js`** — mock `expo-secure-store`, `expo-haptics`, `expo-camera`, `expo-font` via `jest.mock` no-ops.
- [ ] **Step 4: Smoke test** — write `src/lib/onboarding.test.tsx` rendering nothing RN-specific OR first real test (Task 11) — verify `npx jest` runs green on a trivial component test of `TelemetryConsentModal` (already a11y'd).
- [ ] **Step 5: CI** — in `build.yml` and `ios-ci.yml`, add `run: npm run test:ui` next to `npm test`.
- [ ] **Step 6: Commit**

```bash
git add package.json jest.config.js jest.setup.js .github/workflows/build.yml .github/workflows/ios-ci.yml
git commit -m "test(ui): jest-expo + RTL infra and CI wiring"
```

---

### Task 11: Component Render Tests

**Files:**
- Create: `src/components/TelemetryConsentModal.test.tsx`
- Create: `src/lib/onboarding-flow.test.tsx` (onboarding screen render + skip path, mocked SecureStore)

**Pattern:** render component with mocked stores/i18n, assert key elements + button press effects.

- [ ] **Step 1: `TelemetryConsentModal.test.tsx`** — renders title, Allow/Decline buttons; press Allow calls `onAllow`.
- [ ] **Step 2: `onboarding-flow.test.tsx`** — mock `useConnections` with zero connections, mock `completeOnboarding`; assert welcome text renders; press Skip → `completeOnboarding` called.
- [ ] **Step 3: Run** — `npm run test:ui` green; `npm test` still green.
- [ ] **Step 4: Commit**

---

### Task 12: Final Verification + Regression

- [ ] **Step 1: Full suite** — `npm test`, `npm run test:ui`, `npx tsc --noEmit`, `npx eslint src app scripts`.
- [ ] **Step 2: Grep guards** — no hex literals in `app/**/*.tsx` or `src/components/**/*.tsx` (allow `theme.ts`); every interactive element has role/label (spot-check via grep for `accessibilityRole` count > 0 in each touched file).
- [ ] **Step 3: Push feature branch** — create `feat/professional-polish` from `main`, push, let CI run (Build APK + iOS + Activation E2E).
- [ ] **Step 4: Ledger entry** — append to `docs/ledger.md`, commit.
- [ ] **Step 5: Summarize** — report diff stats + CI status to user.

---

## Self-Review Notes

- Spec coverage: onboarding (Tasks 2-4) ✓; a11y app screens (Task 5) ✓; a11y components (Task 6) ✓; theme consolidation (Tasks 7-8) ✓; haptics (Task 9) ✓; component tests (Tasks 10-11) ✓; CI + verification (Task 12) ✓.
- Placeholder scan: no TBD/TODO; every task has concrete files + commands. Task 5/6 element lists are exhaustive file lists; per-element labels follow one documented pattern + existing i18n text.
- Type consistency: `loadOnboardingCompleted`/`completeOnboarding` names consistent across Tasks 2-4; `hapticTap`/`hapticSuccess`/`hapticError` consistent across Task 9; tokens from Task 1 table referenced identically in Tasks 7-8.
