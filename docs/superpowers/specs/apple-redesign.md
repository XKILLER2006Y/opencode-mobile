# Apple Look-and-Feel Redesign — Design Spec

Status: Approved (user sign-off 2026-08-05)
Author: build agent
Scope: Full-app Apple system design language, layered rollout (3 phases)

---

## 1. Direction

The app becomes a modern iOS-styled product: frosted glass surfaces,
SF-style system typography (bundled Inter as the cross-platform match),
Apple's system color palette with `#0071E3`/`#0A84FF` accent, iMessage-style
chat bubbles, and iOS Settings-style grouped inset lists.

Both light and dark modes receive the full treatment. The app keeps its
existing architecture, routing, and data flow — this is a presentation-layer
redesign only.

**Non-goals:** no feature changes, no navigation restructuring, no data
model changes, no new backend contracts. The pending keyboard-avoidance fix
in `app/session/[id].tsx` must remain intact and verified.

---

## 2. Phase 1 — Tokens, Typography, Bubbles, Toolbar

### 2.1 Color tokens (`src/lib/theme.ts`)

Apple system palette, both modes. Current Shadcn/Zinc tokens are replaced.

| Token | Light | Dark |
|---|---|---|
| `bg` (grouped) | `#F2F2F7` | `#000000` |
| `surface` (cards/rows) | `#FFFFFF` | `#1C1C1E` |
| `surfaceSecondary` (bubbles/inputs) | `#E9E9EB` | `#2C2C2E` |
| `accent` | `#0071E3` | `#0A84FF` |
| `textPrimary` | `#000000` | `#FFFFFF` |
| `textSecondary` | `#6E6E73` | `#AEAEB2` |
| `textTertiary` | `#8E8E93` | `#8E8E93` |
| `separator` | `#C6C6C8` @60% | `#38383A` |
| `success` | `#34C759` | `#30D158` |
| `warning` | `#FF9500` | `#FF9F0A` |
| `danger` | `#FF3B30` | `#FF453A` |
| `placeholder` | `#8E8E93` | `#8E8E93` |

Violet `#8B5CF6` and all Zinc grays are removed.

### 2.2 Typography

Bundle Inter (regular/medium/semibold/bold) via `expo-font` as the
SF Pro cross-platform match. Use Apple's text-style scale, RN-scaled:

| Style | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `largeTitle` | 28 | 700 | 34 | Screen headers |
| `title1` | 22 | 600 | 28 | Section titles |
| `body` | 17 | 400 | 22 | Chat text, rows |
| `headline` | 17 | 600 | 22 | Emphasized body |
| `footnote` | 13 | 400 | 16 | Metadata, timestamps |
| `caption` | 12 | 400 | 14 | Helper text, badges |

`theme.ts` exposes a `font` scale so every component consumes shared values.

### 2.3 Chat screen (`app/session/[id].tsx`, `src/components/chat/*`)

- **User bubble**: right-aligned, accent fill, white text, uniform **20px
  radius, no tail** (iOS 18+ Messages style), max-width 75%.
- **Assistant bubble**: left-aligned, `surfaceSecondary` fill, `textPrimary`
  text, same 20px radius, max-width 75%.
- Tool call cards, reasoning blocks, permission prompts, question prompts:
  restyled to the same surface tokens; accent-dot status indicators.
- **Composer toolbar**: `expo-blur` `BlurView` with `systemMaterial`
  (light) / `systemMaterialDark` (dark); glass over scrolling content;
  pill send button; input surface `surfaceSecondary`.
- **Keyboard avoidance: no changes.** The existing wrapper, measured
  `kbOffset`, and offset prop are untouched.

### 2.4 Chrome (all tabs)

- Buttons → pill (radius 9999); primary = accent fill, secondary = clear
  with accent or separator border.
- Native-stack headers keep their titles; screen headers use largeTitle
  styling where the title renders.

---

## 3. Phase 2 — Grouped Lists + Glass

- Sessions, connections, settings screens → iOS Settings-style **inset
  grouped lists**: rounded 12px card groups, 16-20px screen insets, hairline
  separators, chevron disclosure where navigation exists.
- Modals and bottom sheets → glass material (BlurView).
- Connection status badges → Apple green/amber/red.

---

## 4. Phase 3 — Motion & Feedback

- Apple spring curves (`cubic-bezier(0.32, 0.72, 0, 1)`), subtle
  scale-on-press, smooth list transitions.
- Empty states rewritten per `ux-writing` voice (short, action-oriented,
  no blame).

---

## 5. Dependencies

| Package | When | Why |
|---|---|---|
| `expo-blur` | Phase 1 (toolbar) | BlurView glass material, cross-platform |
| `expo-font` | Phase 1 | Bundle Inter typeface |
| Inter font files | Phase 1 | SF Pro stand-in (4 weights) |

All added via `npx expo install` to pin compatible versions.

---

## 6. Verification

Each phase gates on:

- `npx eslint src app` — exit 0
- `npx tsc --noEmit` — exit 0
- `npx expo-doctor` — clean
- Keyboard fix regression check on `app/session/[id].tsx` (KAV wrapper +
  offset logic untouched, lint/tsc pass)
- Manual device pass by user (light + dark, Android)

Release cadence: after a phase is verified, bump patch version and tag per
the established release process.

---

## 7. Risks

- `expo-blur` on Android renders an approximation of true iOS glass — visual
  parity is approximate; acceptable per user.
- Chat screen is the highest-churn surface; Phase 1 restyle happens after the
  keyboard fix is verified to avoid overlapping regressions.
- Font loading must not block first paint — splash-screen-safe loading with
  a system-font fallback until Inter is ready.
