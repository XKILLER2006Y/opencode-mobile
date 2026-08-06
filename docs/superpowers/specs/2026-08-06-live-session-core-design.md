# Live Session Core — Design Spec

Status: Approved (owner full-authority grant 2026-08-06)
Author: build agent
Scope: Targeted deep refactor of the session experience — streaming renderer,
activity river, screen decomposition. Apple design polish layered on top.
Strategy: "Rewrite mindset" applied ONLY where it unlocks capability; stable
surfaces (navigation, tabs, connections, settings, stores, publish pipeline)
are preserved untouched.

---

## 1. Direction

The session screen becomes a PC-TUI-parity live experience: real streaming
thinking, live tool progress, continuous chat feel, and live session stats —
on an Apple-designed surface. Three structural unlocks, in order:

1. **Block-level streaming markdown** — replace `react-native-marked` with
   `streamdown-rn` (v0.2.1, peer React ^19 / RN ^0.81 — matches React 19.2.3 /
   RN 0.86.2). This was the explicit TODO in `MessageBubble.tsx:30` waiting on
   the React 19 types PR, which has landed. Kills O(n²) full-markdown reparse
   during token streaming; re-renders only the block that changed.
2. **Live Activity River** — a unified event-driven activity layer where tool
   calls, reasoning, todos, and file diffs flow as one continuous stream
   synchronized with the chat, mirroring the TUI's activity panel.
3. **Session screen decomposition** — split the 1,174-line `app/session/[id].tsx`
   into focused, testable units.

**Non-goals (deliberately preserved):** store architecture (Zustand + SSE
dispatch is sound), navigation/tabs/connections/settings, publish pipeline,
F-Droid patches, icons. No backend contract changes.

---

## 2. Phase 1 — Streaming Renderer (streamdown-rn)

### 2.1 Dependency

```bash
npx expo install streamdown-rn
```

Strict-scripts gate applies — `.npmrc` forbids bare `npm install` of
incompatible versions; `npx expo install` resolves the compatible set.

### 2.2 Integration (`src/components/markdown/`)

Current `Markdown` wrapper around `react-native-marked` gets a sibling
`StreamMarkdown` path used for assistant streaming text:

- Stable blocks (code fences, lists, tables) are memoized at block level —
  unchanged blocks do NOT re-render when later blocks stream.
- The existing `useBatchedText` (60ms window, `src/lib/use-batched-text.ts`)
  stays as the outer throttle so SSE token pushes coalesce to ≤16 renders/sec.
  streamdown-rn removes the *reparse* cost inside each of those renders.
- `CodeBlock` (copy button) and block styling must keep their current visual
  output — same theme tokens, same copy affordance.
- User messages keep the cheap plain `<Text>` path (zero markdown cost).

### 2.3 Reasoning streaming fix (carried from optimization review)

`MessageBubble` currently batches only the `text` parts. `reasoning` streams
raw into `ReasoningBlock` with NO batching — O(n²) over the stream. Fix:

- Apply `useBatchedText` to the reasoning accumulator too (60ms window).
- `ReasoningBlock` gets `memo()` + a `live` prop: auto-expands while the
  message is actively streaming, stays expanded on completion, manual tap
  collapses. Live thinking = PC parity.

---

## 3. Phase 2 — Live Activity River

### 3.1 Concept

One continuous stream of activity events, chat-synchronized, replacing the
isolated cards approach. The TUI shows tools/thinking/todos/diffs as an
interleaved timeline; the app mirrors that.

### 3.2 Architecture

- **Derived timeline**: build the river from the existing message+parts data
  (no new backend contract). Each part is one river entry: `reasoning`,
  `tool`, `text`, `file`. Order = message order = SSE order.
- **Live statuses**: tool parts already carry `state.status` (pending/running/
  completed/error) + `state.time` — the river reads these directly.
- **Auto-expand rules**:
  - Running tool card expands automatically (live output), collapses on
    completion.
  - Reasoning block auto-expands while its message is streaming.
  - Elapsed timer ticks for running tools (single interval while any tool
    runs, not per-card timers — no re-render storm).
- **Jump-to-latest chip**: when the user scrolls away from the bottom during
  an active stream, a floating "↓ Latest" glass pill appears (scroll-state
  debounced, threshold-crossing only). Tap = instant scroll to newest.

### 3.3 Component boundary

`src/components/chat/ActivityRiver.tsx` — receives the derived entries for the
visible message window, renders the interleaved timeline. `MessageBubble`
keeps responsibility for a single message's parts; the river composes bubbles
+ live chrome at the screen level. Session screen renders the river inside
the existing inverted FlatList so virtualization tuning is preserved.

---

## 4. Phase 3 — Session Screen Decomposition

`app/session/[id].tsx` (1,174 lines) splits into focused units:

| File | Responsibility |
|---|---|
| `app/session/[id].tsx` | Shell: header, banners, orchestration, KAV wrapper |
| `src/components/session/MessageList.tsx` | FlatList + virtualization tuning, scroll tracking, load-more |
| `src/components/session/ComposerToolbar.tsx` | Input, send, attach, slash popover, model/variant chips |
| `src/components/session/InfoSheet.tsx` | SessionInfo pull-down (tokens/cost/context bar) |
| `src/components/session/StatusChrome.tsx` | StatusIndicator + banners + reconnect |
| `src/components/session/JumpToLatest.tsx` | Floating chip |

Rules: no logic moves into components that isn't already screen-local; the
existing KAV wrapper + measured `kbOffset` keyboard-avoidance logic is
preserved byte-for-byte in behavior (regression guard).

### 4.1 Live stats incremental fix (carried from optimization review)

`SessionInfo` recomputes totals by scanning ALL messages on every update —
O(n) per token push. Fix: incremental accumulator — per-message totals cached
in a Map, only new messages contribute. O(n) → O(1) per update. The stats bar
ticks live during streaming (tokens / context % / cost).

---

## 5. Phase 4 — Apple Design Polish (completes approved apple-redesign spec)

### 5.1 Dependencies

```bash
npx expo install expo-blur expo-font
```

### 5.2 Glass toolbar

Composer toolbar renders in `expo-blur` `BlurView` with `systemMaterial`
(light) / `systemMaterialDark` (dark) — glass over scrolling content.
Android renders an approximation (accepted in apple-redesign.md §7).

### 5.3 Inter font

Bundle Inter regular/medium/semibold/bold via `expo-font` as the SF Pro
cross-platform match. Splash-safe loading: system-font fallback until ready,
no first-paint block (per apple-redesign.md §7).

### 5.4 Surface polish

- Pill buttons (radius 9999) on session chrome.
- iMessage bubbles already styled (20px radius, no tail, max-width 75%) —
  verify only, no change.
- Apple springs for sheet/pill motion (`cubic-bezier(0.32, 0.72, 0, 1)`).

---

## 6. Verification

Each phase gates on:

- `npx eslint src app` — exit 0
- `npx tsc --noEmit` — exit 0
- `npm test` — 319 existing tests pass + new tests:
  - streamdown-rn block memoization: stable block does not re-render during
    later-block streaming (render-count test)
  - reasoning batching: reasoning text updates coalesce (stream-batcher reuse)
  - incremental stats: O(1) accumulator correctness vs O(n) reference
  - ActivityRiver: ordering, status transitions, auto-expand rules
- `npx expo-doctor` — clean
- KAV regression: keyboard wrapper behavior unchanged (lint/tsc + manual pass)
- Manual device pass by user (light + dark, Android)

Release cadence: after Phase 1 verified → bump patch + tag. Phase 2, 3, 4
each gated and released separately.

---

## 7. Risks

- **streamdown-rn maturity**: v0.2.1 is young. Mitigation: keep the
  `react-native-marked` wrapper as a fallback; `StreamMarkdown` is isolated so
  a rollback is a one-line switch. Verify all current markdown render
  scenarios (code blocks w/ copy, tables, lists, inline styles) before
  shipping.
- **Block memoization correctness**: stable blocks must not go stale when the
  *same* block's content updates (e.g. a still-running bash block). streamdown
  updates a block when its own content changes; test covers the boundary.
- **Activity River + virtualization**: river must not mount unbounded content.
  Stays inside the existing FlatList window; no new infinite-mount paths.
- **Android glass approximation**: accepted; blur intensity tuned conservatively
  so list scroll stays 60fps.
- **expo install resolution**: `.npmrc` strict-scripts gate — all new deps via
  `npx expo install`, never bare npm.
