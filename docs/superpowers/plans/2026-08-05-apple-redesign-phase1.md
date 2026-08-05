# Apple Look-and-Feel Redesign — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the app's presentation layer to Apple's system design language — tokens, typography, chat bubbles, and composer toolbar — with both light and dark modes.

**Architecture:** Replace the Shadcn/Zinc tokens in `src/lib/theme.ts` with Apple's system palette + SF-style type scale (bundled Inter via `expo-font`). Restyle `MessageBubble` to iMessage-style (user = accent-filled right bubble, assistant = gray left bubble, 20px radius, no tail). Wrap the composer in `expo-blur` BlurView for frosted glass. The keyboard-avoidance fix already applied in `app/session/[id].tsx` (measured `kbOffset`) is untouched by this plan.

**Tech Stack:** React Native (0.86) / Expo (~54) / expo-router, expo-blur, expo-font, TypeScript, node:test.

## Global Constraints

- Palette (verbatim from approved spec): light `bg #F2F2F7`, `surface #FFFFFF`, `surfaceSecondary #E9E9EB`, `accent #0071E3`, `textPrimary #000000`, `textSecondary #6E6E73`, `textTertiary #8E8E93`, `separator #C6C6C8`; dark `bg #000000`, `surface #1C1C1E`, `surfaceSecondary #2C2C2E`, `accent #0A84FF`, `textPrimary #FFFFFF`, `textSecondary #AEAEB2`, `textTertiary #8E8E93`, `separator #38383A`. Status: light `success #34C759 / warning #FF9500 / danger #FF3B30`; dark `#30D158 / #FF9F0A / #FF453A`.
- Typography (verbatim): largeTitle 28/700/34, title1 22/600/28, body 17/400/22, headline 17/600/22, footnote 13/400/16, caption 12/400/14.
- Bubbles: uniform 20px radius, no tail, max-width 75%; user = accent fill + white text, right-aligned; assistant = surfaceSecondary + textPrimary, left-aligned.
- Keyboard avoidance in `app/session/[id].tsx`: DO NOT modify the KAV wrapper, `kbOffset` state, `measureKbOffset`, `kavWrapRef`, or the `keyboardVerticalOffset` prop.
- Deps added only via `npx expo install` (pins Expo-compatible versions).
- Verification gates per phase: `npx eslint src app` exit 0, `npx tsc --noEmit` exit 0, `npx expo-doctor` clean, `npm test` green, keyboard-fix regression check.
- Tests live next to code (`*.test.ts`, node:test). Commit per task.
- This plan covers Phase 1 only. Phase 2 (grouped lists + glass modals) and Phase 3 (motion/feedback) get their own plans.

---
## File Structure

- `src/lib/theme.ts` — design tokens (colors, radius, spacing, typography, font scale). Single source of truth.
- `src/lib/theme.test.ts` — token assertions, updated to Apple values.
- `assets/fonts/` — Inter TTFs (4 weights: Regular, Medium, SemiBold, Bold).
- `src/lib/fonts.ts` — NEW: font-loading hook (`useLoadedFonts`) with splash-safe fallback.
- `app/_layout.tsx` — registers fonts; Apple header/content backgrounds.
- `app/(tabs)/_layout.tsx` — Apple tab bar tint/background.
- `src/components/chat/MessageBubble.tsx` — iMessage-style bubbles consuming theme tokens.
- `app/session/[id].tsx` — composer toolbar + input container glass; pill send button; toolbar/input token cleanup.
- `src/components/chat/ToolCallCard.tsx`, `ReasoningBlock.tsx`, `StatusIndicator.tsx`, `PermissionPrompt.tsx`, `QuestionPrompt.tsx`, `SlashPopover.tsx` — token swap from hardcoded Zinc hexes to theme values.
- `package.json` — new deps: `expo-blur` (expo-font already present).

---

### Task 1: Apple design tokens in `theme.ts` + test update

**Files:**
- Modify: `src/lib/theme.ts` (entire file)
- Test: `src/lib/theme.test.ts` (assertions)
- Modify: `src/lib/theme.ts` consumers are NOT touched yet (token names preserved: `bg`, `surface`, `surfaceElevated`, `border`, `borderSubtle`, `textPrimary`, `textSecondary`, `textMuted`, `accent`, `accentGlow`, `userBubble`, `assistantBubble`, `statusIdle`, `statusBusy`, `statusSuccess`, `statusWarning`, `statusError`)

**Interfaces:**
- Produces: `theme.colors.dark` / `theme.colors.light` with same shape as before (so existing consumers compile unchanged), plus `theme.font` (NEW: `{ regular: string; medium: string; semibold: string; bold: string }` for RN font-family values) and `theme.typography` updated to Apple scale with `fontFamily` on every style.

- [ ] **Step 1: Update the failing test**

Replace the hex assertions in `src/lib/theme.test.ts` with Apple values:

```ts
test("theme: dark colors contain required design system properties", () => {
  const dark = theme.colors.dark
  assert.equal(dark.bg, "#000000")
  assert.equal(dark.surface, "#1C1C1E")
  assert.equal(dark.accent, "#0A84FF")
  assert.equal(dark.textPrimary, "#FFFFFF")
  assert.equal(dark.statusSuccess, "#30D158")
  assert.equal(dark.statusError, "#FF453A")
})

test("theme: light colors contain required design system properties", () => {
  const light = theme.colors.light
  assert.equal(light.bg, "#F2F2F7")
  assert.equal(light.surface, "#FFFFFF")
  assert.equal(light.accent, "#0071E3")
  assert.equal(light.textPrimary, "#000000")
  assert.equal(light.statusSuccess, "#34C759")
  assert.equal(light.statusError, "#FF3B30")
})

test("theme: getTheme returns appropriate palette based on isDark flag", () => {
  const darkPalette = getTheme(true)
  const lightPalette = getTheme(false)
  assert.equal(darkPalette.bg, "#000000")
  assert.equal(lightPalette.bg, "#F2F2F7")
  assert.notEqual(darkPalette.surface, lightPalette.surface)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx node --test src/lib/theme.test.ts`
Expected: FAIL — `#09090B` !== `#000000` (old tokens still in theme.ts)

- [ ] **Step 3: Rewrite `src/lib/theme.ts`**

```ts
// OpenCode Mobile Design System Tokens
// Apple system design language — Clarity, Deference, Depth.

export const theme = {
  colors: {
    dark: {
      bg: "#000000",
      surface: "#1C1C1E",
      surfaceElevated: "#2C2C2E",
      border: "#38383A",
      borderSubtle: "#2C2C2E",
      textPrimary: "#FFFFFF",
      textSecondary: "#AEAEB2",
      textMuted: "#8E8E93",
      accent: "#0A84FF",
      accentGlow: "rgba(10, 132, 255, 0.18)",
      userBubble: "#0A84FF",
      assistantBubble: "#2C2C2E",
      statusIdle: "#AEAEB2",
      statusBusy: "#0A84FF",
      statusSuccess: "#30D158",
      statusWarning: "#FF9F0A",
      statusError: "#FF453A",
    },
    light: {
      bg: "#F2F2F7",
      surface: "#FFFFFF",
      surfaceElevated: "#F2F2F7",
      border: "#C6C6C8",
      borderSubtle: "#E9E9EB",
      textPrimary: "#000000",
      textSecondary: "#6E6E73",
      textMuted: "#8E8E93",
      accent: "#0071E3",
      accentGlow: "rgba(0, 113, 227, 0.12)",
      userBubble: "#0071E3",
      assistantBubble: "#E9E9EB",
      statusIdle: "#6E6E73",
      statusBusy: "#0071E3",
      statusSuccess: "#34C759",
      statusWarning: "#FF9500",
      statusError: "#FF3B30",
    },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    huge: 32,
  },
  typography: {
    largeTitle: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
    title1: { fontSize: 22, fontWeight: "600" as const, lineHeight: 28 },
    body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
    headline: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
    footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 16 },
    caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 14 },
    code: { fontSize: 13, fontFamily: "monospace" },
  },
}

export function getTheme(isDark: boolean) {
  return isDark ? theme.colors.dark : theme.colors.light
}
```

Note: `display`/`title`/`subtitle`/`bodyMedium`/`small` keys were replaced by the Apple scale. If any consumer references the removed keys (`display`, `title`, `subtitle`, `bodyMedium`, `small`), update those consumers in Task 5 to the new names. `tsc` in Step 4 catches every miss.

- [ ] **Step 4: Run test + typecheck + lint**

Run: `npx node --test src/lib/theme.test.ts; npx tsc --noEmit; npx eslint src/lib/theme.ts`
Expected: all pass. If `tsc` reports consumers of removed typography keys, fix them minimally by mapping to the Apple scale (e.g. `typography.display` → `typography.largeTitle`, `typography.title` → `typography.title1`, `typography.subtitle` → `typography.headline`, `typography.bodyMedium` → `typography.body`, `typography.small` → `typography.caption`, `typography.caption` → `typography.footnote`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat(theme): Apple system design tokens (light+dark)"
```

---

### Task 2: Bundle Inter font + splash-safe loading

**Files:**
- Create: `assets/fonts/Inter-Regular.ttf`, `assets/fonts/Inter-Medium.ttf`, `assets/fonts/Inter-SemiBold.ttf`, `assets/fonts/Inter-Bold.ttf`
- Create: `src/lib/fonts.ts`
- Modify: `app/_layout.tsx` (font load + header/content backgrounds)

**Interfaces:**
- Consumes: nothing.
- Produces: `useLoadedFonts(): { loaded: boolean }` from `src/lib/fonts.ts`. `theme.font = { regular: "Inter-Regular", medium: "Inter-Medium", semibold: "Inter-SemiBold", bold: "Inter-Bold" }` (added in this task to `theme.ts`).

- [ ] **Step 1: Download the 4 Inter TTFs**

Run (PowerShell, from repo root):
```powershell
New-Item -ItemType Directory -Force -Path "assets\fonts" | Out-Null
$base = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin"
Invoke-WebRequest -Uri "$base-400-normal.ttf" -OutFile "assets\fonts\Inter-Regular.ttf"
Invoke-WebRequest -Uri "$base-500-normal.ttf" -OutFile "assets\fonts\Inter-Medium.ttf"
Invoke-WebRequest -Uri "$base-600-normal.ttf" -OutFile "assets\fonts\Inter-SemiBold.ttf"
Invoke-WebRequest -Uri "$base-700-normal.ttf" -OutFile "assets\fonts\Inter-Bold.ttf"
```
Expected: 4 files exist, each > 20KB. Verify: `Get-ChildItem assets\fonts | Select-Object Name, Length`

- [ ] **Step 2: Write the failing test for the font map**

Create `src/lib/fonts.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { theme } from "./theme.ts"

test("theme: font scale maps all four Inter weights", () => {
  assert.equal(theme.font.regular, "Inter-Regular")
  assert.equal(theme.font.medium, "Inter-Medium")
  assert.equal(theme.font.semibold, "Inter-SemiBold")
  assert.equal(theme.font.bold, "Inter-Bold")
})
```
Expected: FAIL (theme.font undefined).

- [ ] **Step 3: Add font scale to `theme.ts`**

Append to `theme` object in `src/lib/theme.ts` (after `typography`):
```ts
  font: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
```

- [ ] **Step 4: Write the loading hook**

Create `src/lib/fonts.ts`:
```ts
import { useFonts } from "expo-font"

// Loads the bundled Inter typeface (SF Pro stand-in) before first paint.
// Returns loaded=false until ready; the root layout renders the splash
// placeholder during that window. A font load failure must NOT brick the
// app — loaded falls back to true so the UI renders with the system font.
export function useLoadedFonts(): { loaded: boolean } {
  const [loaded, error] = useFonts({
    "Inter-Regular": require("../../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter-Bold.ttf"),
  })
  return { loaded: loaded || !!error }
}
```

- [ ] **Step 5: Wire fonts into root layout + Apple chrome**

In `app/_layout.tsx`:
1. Import: `import { useLoadedFonts } from "../src/lib/fonts"`
2. Inside `RootLayout`, after `const { t } = useTranslation()`: `const { loaded: fontsLoaded } = useLoadedFonts()`
3. Change the loading gate to include fonts: `const isLoading = authLoading || connectionsLoading || consentState === "loading" || !fontsLoaded`
4. Update the `Stack` `screenOptions` (lines ~148-157):
```tsx
screenOptions={{
  headerStyle: {
    backgroundColor: isDark ? "#000000" : "#F2F2F7",
  },
  headerTintColor: isDark ? "#FFFFFF" : "#000000",
  headerTitleStyle: { fontFamily: "Inter-SemiBold" },
  contentStyle: {
    backgroundColor: isDark ? "#000000" : "#F2F2F7",
  },
}}
```
5. Loading placeholder background (line ~134): `backgroundColor: isDark ? "#000000" : "#F2F2F7"`

- [ ] **Step 6: Run tests + typecheck + lint**

Run: `npx node --test src/lib/fonts.test.ts; npx tsc --noEmit; npx eslint src/lib/fonts.ts app/_layout.tsx`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add assets/fonts src/lib/fonts.ts src/lib/fonts.test.ts src/lib/theme.ts app/_layout.tsx
git commit -m "feat(fonts): bundle Inter typeface with splash-safe loading"
```

---

### Task 3: iMessage-style MessageBubble

**Files:**
- Modify: `src/components/chat/MessageBubble.tsx`

**Interfaces:**
- Consumes: `getTheme(isDark)` from `src/lib/theme.ts` (already imported by consumers; bubble currently uses hardcoded hexes), `theme.radius.xl` (20).
- Produces: `MessageBubble` with same props (`message`, `parts`, `isDark`, `onLongPress`) and same `testID`s — no interface change, so `app/session/[id].tsx` and stores keep working.

- [ ] **Step 1: Rewrite bubble styles to consume theme tokens**

Replace the `StyleSheet.create` block (lines 157-199) in `src/components/chat/MessageBubble.tsx`:

```tsx
const s = StyleSheet.create({
  bubble: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20, // uniform, no tail — iOS 18+ Messages
    maxWidth: "75%",
  },
  user: { backgroundColor: "#0071E3", alignSelf: "flex-end" },
  userDark: { backgroundColor: "#0A84FF" },
  assistant: { backgroundColor: "#E9E9EB", alignSelf: "flex-start" },
  assistantDark: { backgroundColor: "#2C2C2E" },

  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  role: { fontSize: 13, fontWeight: "600", color: "#6E6E73" },
  roleUser: { color: "rgba(255,255,255,0.85)" },
  roleUserDark: { color: "rgba(255,255,255,0.85)" },
  textWhite: { color: "#FFFFFF" },
  textWhiteDark: { color: "#FFFFFF" },

  modelTag: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6E6E73",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  modelTagDark: { backgroundColor: "#1C1C1E", color: "#AEAEB2" },

  messageText: { fontSize: 17, lineHeight: 22, color: "#000000" },
  messageTextUser: { color: "#FFFFFF" },
  messageTextUserDark: { color: "#FFFFFF" },
  markdownWrap: { marginHorizontal: -4 },

  tokens: { fontSize: 11, color: "#8E8E93", marginTop: 8 },
  tokensDark: { color: "#8E8E93" },

  // Images
  imageScroll: { marginBottom: 8 },
  imageRow: { gap: 8 },
  imageWrap: { alignItems: "center" },
  attachedImage: {
    width: Math.min(200, SCREEN_WIDTH * 0.5),
    height: Math.min(200, SCREEN_WIDTH * 0.5),
    borderRadius: 12,
    backgroundColor: "#E9E9EB",
  },
  imageLabel: { fontSize: 10, color: "#6E6E73", marginTop: 4, maxWidth: 200 },
  imageLabelDark: { color: "#AEAEB2" },
})
```

- [ ] **Step 2: Update the JSX to use the new styles**

Key edits inside the component body:
1. Role header icons + text (lines ~76-86): role text gets `isUser ? s.roleUser : s.role`, and `isUser && isDark && s.roleUserDark`; the user icon color becomes `#FFFFFF` when user (both modes), assistant icon keeps accent:
```tsx
<View style={s.header}>
  <Ionicons
    name={isUser ? "person" : "sparkles"}
    size={14}
    color={isUser ? "#FFFFFF" : "#0071E3"}
  />
  <Text style={[s.role, isUser && s.roleUser, isUser && isDark && s.roleUserDark]}>
    {isUser ? "You" : "Assistant"}
  </Text>
  ...
```
2. Message text (lines ~113-122): user text style becomes `[s.messageText, s.messageTextUser, isDark && s.messageTextUserDark]`; assistant text uses `[s.messageText, isDark && s.textWhiteDark]` — **but note the Markdown component** (assistant messages) renders its own text with its own colors; for now the assistant bubble background/surfaces come from the Markdown wrapper styles, which are covered in Task 5's markdown token pass. `s.textWhite` on the role line: rename usage to `s.textWhiteDark` for assistant context if still referenced.

3. Keep `TouchableOpacity` wrapper, `testID`s, memo comparator exactly as-is.

- [ ] **Step 3: Run typecheck + lint**

Run: `npx tsc --noEmit; npx eslint src/components/chat/MessageBubble.tsx`
Expected: pass. Fix any leftover hardcoded Zinc colors by mapping: `#F4F4F5`→`#F2F2F7`, `#27272A`→`#2C2C2E`, `#18181B`→`#2C2C2E`/`#1C1C1E` as appropriate, `#3F3F46`→`#2C2C2E`, `#E4E4E7`→`#C6C6C8`/`#E9E9EB`, `#71717A`→`#6E6E73`, `#A1A1AA`→`#AEAEB2`, `#09090B`→`#000000`, `#FAFAFA`→`#FFFFFF`.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/MessageBubble.tsx
git commit -m "feat(chat): iMessage-style message bubbles"
```

---

### Task 4: Token swap in chat sub-components

**Files:**
- Modify: `src/components/chat/ToolCallCard.tsx`
- Modify: `src/components/chat/ReasoningBlock.tsx`
- Modify: `src/components/chat/StatusIndicator.tsx`
- Modify: `src/components/chat/PermissionPrompt.tsx`
- Modify: `src/components/chat/QuestionPrompt.tsx`
- Modify: `src/components/chat/SlashPopover.tsx`
- Test: `src/components/chat/diff-compute.test.ts` (must stay green — untouched)

**Interfaces:**
- Consumes: `getTheme(isDark)` pattern already used across the chat package; `theme` status colors.
- Produces: same props/behavior; only style constants change. The `VariantPicker`/`ModelPicker`/`SessionInfo`/`ImageAttachments` components are intentionally left for Phase 2 (they render in sheets/modals).

- [ ] **Step 1: Sweep each file for hardcoded hexes**

For each file above, replace hardcoded colors per the mapping:
- `#8b5cf6` / `#8B5CF6` (violet) → accent: `isDark ? "#0A84FF" : "#0071E3"` (or `colors.accent` when `getTheme` is already in scope)
- `#F4F4F5` → `#F2F2F7`
- `#27272A` → `#2C2C2E`
- `#18181B` → `#1C1C1E` (surface) or `#2C2C2E` (elevated/input)
- `#3F3F46` → `#2C2C2E`
- `#E4E4E7` → `#C6C6C8` (border) or `#E9E9EB` (secondary surface)
- `#71717A` → `#6E6E73` (light secondary) / `#AEAEB2` (dark secondary)
- `#A1A1AA` → `#AEAEB2`
- `#09090B` → `#000000`
- `#FAFAFA` → `#FFFFFF`
- `#22C55E` → `#34C759` (light) / `#30D158` (dark)
- `#F59E0B` → `#FF9500` (light) / `#FF9F0A` (dark)
- `#EF4444` → `#FF3B30` (light) / `#FF453A` (dark)
- `#16A34A` → `#34C759`
- `#D97706` → `#FF9500`
- `#DC2626` → `#FF3B30`

Prefer `getTheme(isDark)` where a component already has `isDark`; fall back to the light/dark hex pair inline (`isDark ? "#0A84FF" : "#0071E3"`).

- [ ] **Step 2: Run typecheck + lint + full tests**

Run: `npx tsc --noEmit; npx eslint src/components/chat; npm test`
Expected: all pass (including `diff-compute.test.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ToolCallCard.tsx src/components/chat/ReasoningBlock.tsx src/components/chat/StatusIndicator.tsx src/components/chat/PermissionPrompt.tsx src/components/chat/QuestionPrompt.tsx src/components/chat/SlashPopover.tsx
git commit -m "feat(theme): Apple token swap in chat sub-components"
```

---

### Task 5: Composer glass + pill send button + session chrome

**Files:**
- Modify: `app/session/[id].tsx`
- Modify: `package.json` (via `npx expo install expo-blur`)
- Modify: `src/components/chat/index.ts` (export `ImageAttachments` — no change expected; verify)

**Interfaces:**
- Consumes: theme typography keys renamed in Task 1; `expo-blur` BlurView.
- Produces: glass composer bar (agent/model/variant chips + attachment preview + input row) on a `BlurView`; pill send button; keyboard fix untouched.

- [ ] **Step 1: Install expo-blur**

Run: `npx expo install expo-blur`
Expected: adds `expo-blur` to `package.json` at a version compatible with the installed Expo SDK.

- [ ] **Step 2: Wrap composer in BlurView**

In `app/session/[id].tsx`:
1. Import: `import { BlurView } from "expo-blur"`
2. Replace the outer composer wrapper (currently the toolbar `View` at line ~779, the `ImageAttachments` at ~816, and the input container `View` at ~819) by wrapping them in a single BlurView:
```tsx
<BlurView
  intensity={isDark ? 40 : 60}
  tint={isDark ? "dark" : "light"}
  style={s.composerGlass}
>
  {/* Agent/model toolbar */}
  ...existing toolbar JSX unchanged...
  {/* Attachment preview */}
  <ImageAttachments ... />
  {/* Input */}
  <View style={[s.inputContainer, isDark && s.inputContainerDark, { paddingBottom: Math.max(12, insets.bottom) }]}>
    ...existing input JSX unchanged (including send button)...
  </View>
</BlurView>
```
3. Add style: `composerGlass: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "transparent" }` and give the toolbar/input containers transparent backgrounds so the blur shows through: set `s.toolbar.backgroundColor` → `"transparent"`, `s.inputContainer.backgroundColor` → `"transparent"` (or remove the explicit bg in dark/light variants).
4. IMPORTANT: the `KeyboardAvoidingView` and `kavWrapRef` wrapper (lines 616-617, 876-877) stay EXACTLY as-is. The BlurView goes INSIDE the KAV, replacing the toolbar+input block, so keyboard behavior is unchanged.

- [ ] **Step 3: Pill send button + chip text tokens**

In the same file:
1. `s.sendBtn`: `borderRadius: 9999, minWidth: 40, height: 40` (currently square) — keep white icon.
2. Stop/mic active buttons: `borderRadius: 9999`.
3. Toolbar chip typography: switch `s.agentLabel`, `s.modelLabel`, `s.variantLabel` to the theme font family + Apple sizes:
   - `agentLabel`: `{ fontFamily: "Inter-SemiBold", fontSize: 13, color: "#000000" }` (dark: `#FFFFFF`)
   - `modelLabel`/`variantLabel`: `{ fontFamily: "Inter-Medium", fontSize: 13, color: "#6E6E73" }` (dark: `#AEAEB2`)
4. Replace any remaining hardcoded Zinc hexes in the file's StyleSheet per the Task 4 mapping (including `#8b5cf6` in the variant chip icon → `isDark ? "#0A84FF" : "#0071E3"`, `#ef4444` placeholder → `isDark ? "#FF453A" : "#FF3B30"`).

- [ ] **Step 4: Verify keyboard fix regression**

Run: `npx tsc --noEmit; npx eslint app/session/[id].tsx`
Then confirm by inspection that these are untouched and still present:
- `kavWrapRef`, `kbOffset`, `measureKbOffset` (lines ~98-106)
- `<View ref={kavWrapRef} style={s.container} onLayout={measureKbOffset}>` (line 616)
- `behavior="padding"` and `keyboardVerticalOffset={Platform.OS === "ios" ? 90 : kbOffset}` (lines 631-632)
- closing `</View>` after `</KeyboardAvoidingView>` (lines 876-877)

- [ ] **Step 5: Run full verification**

Run: `npx eslint src app; npx tsc --noEmit; npx expo-doctor; npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/session/[id].tsx
git commit -m "feat(chat): frosted glass composer + pill send button"
```

---

### Task 6: Tab bar + header Apple chrome

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/_layout.tsx` (already partially done in Task 2 — finish any misses)

**Interfaces:**
- Consumes: theme tokens via `isDark` branch.
- Produces: Apple tab bar (active accent blue, inactive secondary gray, frosted/neutral backgrounds), headers matching Apple surface colors.

- [ ] **Step 1: Update tab bar**

Replace the `screenOptions` in `app/(tabs)/_layout.tsx`:

```tsx
screenOptions={{
  tabBarActiveTintColor: isDark ? "#0A84FF" : "#0071E3",
  tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93",
  tabBarStyle: {
    backgroundColor: isDark ? "#000000" : "#FFFFFF",
    borderTopColor: isDark ? "#1C1C1E" : "#E9E9EB",
  },
  headerStyle: {
    backgroundColor: isDark ? "#000000" : "#F2F2F7",
  },
  headerTintColor: isDark ? "#FFFFFF" : "#000000",
  headerTitleStyle: { fontFamily: "Inter-SemiBold", fontSize: 17 },
}}
```

- [ ] **Step 2: Run typecheck + lint**

Run: `npx tsc --noEmit; npx eslint app/(tabs)/_layout.tsx`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat(theme): Apple tab bar and header chrome"
```

---

### Task 7: Phase 1 verification gate

**Files:** none (verification only)

- [ ] **Step 1: Full static verification**

Run: `npx eslint src app`
Run: `npx tsc --noEmit`
Run: `npx expo-doctor`
Run: `npm test`
Expected: all green.

- [ ] **Step 2: Keyboard fix regression check**

Run: `git diff HEAD -- app/session/[id].tsx` — confirm the KAV block diff contains only the BlurView/composer styling, and `kavWrapRef`/`kbOffset`/`measureKbOffset`/`keyboardVerticalOffset` are unchanged from the pre-existing local fix. If the fix was committed before this plan ran, confirm no diff touches those lines.

- [ ] **Step 3: Device pass (manual, light + dark, Android)**

Start the dev server, open the app, verify:
- Sessions list + settings screens use Apple surfaces (light `#F2F2F7` bg, dark `#000000`)
- Chat: user message = right blue bubble, assistant = left gray bubble, both rounded 20px
- Composer sits on frosted glass; keyboard opens → composer stays above keyboard (regression)
- Buttons are pill-shaped; headers use Inter SemiBold
- No font flash: app stays on splash until Inter loads

- [ ] **Step 4: Report**

Summarize per-screen deltas and any visual deviations from the spec. Do NOT create a release tag yet — Phase 2 (grouped lists + glass modals) and Phase 3 (motion) follow the same task structure in separate plans.

---

## Self-Review

- **Spec coverage:** §2.1 tokens → Task 1; §2.2 typography → Tasks 1+2; §2.3 bubbles → Tasks 3+4; §2.3 toolbar glass + pill → Task 5; §2.4 chrome → Tasks 2+6; §6 verification → Task 7. The keyboard non-goal is enforced in Task 5 Step 4.
- **Placeholder scan:** no TBD/TODO; every code step has full content. The Task 4 mapping table is the concrete recipe; each file's exact StyleSheet names are left to the implementer because they vary, but the mapping is unambiguous.
- **Type consistency:** typography key renames (`display`→`largeTitle`, `title`→`title1`, `subtitle`→`headline`, `bodyMedium`→`body`, `small`→`caption`, `caption`→`footnote`) are documented in Task 1 Step 4 and consumed in Task 5. `theme.font` produced in Task 2, consumed in Tasks 5-6. `getTheme` signature unchanged.
