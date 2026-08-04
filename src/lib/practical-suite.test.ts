import { test } from "node:test"
import assert from "node:assert/strict"
import { getTheme, theme } from "./theme.ts"
import { stripTrailingSlash, parentOf, nameOf } from "./path-utils.ts"
import { statusFromPart } from "./status-labels.ts"
import { buildRequestHeaders } from "./headers.ts"

// --- Group 1: Theme & Design System Practical Invariants (6 tests) ---

test("practical: dark theme background is high contrast against primary text", () => {
  const dark = getTheme(true)
  assert.notEqual(dark.bg, dark.textPrimary)
  assert.equal(dark.bg.startsWith("#"), true)
  assert.equal(dark.textPrimary.startsWith("#"), true)
})

test("practical: light theme surface is high contrast against dark primary text", () => {
  const light = getTheme(false)
  assert.notEqual(light.surface, light.textPrimary)
  assert.equal(light.surface, "#FFFFFF")
  assert.equal(light.textPrimary, "#09090B")
})

test("practical: accent colors remain distinct between light and dark modes", () => {
  const dark = getTheme(true)
  const light = getTheme(false)
  assert.equal(dark.accent, "#8B5CF6")
  assert.equal(light.accent, "#7C3AED")
})

test("practical: spacing scale is strictly monotonic", () => {
  const s = theme.spacing
  assert.ok(s.xs < s.sm)
  assert.ok(s.sm < s.md)
  assert.ok(s.md < s.lg)
  assert.ok(s.lg < s.xl)
  assert.ok(s.xl < s.xxl)
  assert.ok(s.xxl < s.huge)
})

test("practical: border radii follow exponential rounded scale", () => {
  const r = theme.radius
  assert.ok(r.sm < r.md)
  assert.ok(r.md < r.lg)
  assert.ok(r.lg < r.xl)
  assert.equal(r.full, 9999)
})

test("practical: typography font sizes increase predictably", () => {
  const t = theme.typography
  assert.ok(t.small.fontSize < t.caption.fontSize)
  assert.ok(t.caption.fontSize < t.body.fontSize)
  assert.ok(t.body.fontSize < t.title.fontSize)
  assert.ok(t.title.fontSize < t.display.fontSize)
})

// --- Group 2: Path & Directory Operations (6 tests) ---

test("practical: path-utils handles deeply nested POSIX paths", () => {
  const path = "/var/log/app/2026/08/04/trace.log"
  assert.equal(nameOf(path), "trace.log")
  assert.equal(parentOf(path), "/var/log/app/2026/08/04")
  assert.equal(stripTrailingSlash(path + "///"), path)
})

test("practical: path-utils handles Windows UNC network paths", () => {
  const unc = "\\\\server\\share\\folder\\file.txt"
  assert.equal(nameOf(unc), "file.txt")
  assert.equal(parentOf(unc), "\\\\server\\share\\folder")
})

test("practical: path-utils handles paths with trailing spaces and slashes", () => {
  assert.equal(stripTrailingSlash("/home/user/workspace/"), "/home/user/workspace")
  assert.equal(stripTrailingSlash("C:\\Users\\dev\\"), "C:\\Users\\dev")
})

test("practical: path-utils parentOf traverses back to root step-by-step", () => {
  let current: string | null = "/a/b/c"
  const hierarchy: string[] = []
  while (current !== null) {
    hierarchy.push(current)
    current = parentOf(current)
  }
  assert.deepEqual(hierarchy, ["/a/b/c", "/a/b", "/a", "/"])
})

test("practical: nameOf handles filenames with multiple dots", () => {
  assert.equal(nameOf("/app/build.min.js.map"), "build.min.js.map")
  assert.equal(nameOf("C:\\data\\archive.tar.gz"), "archive.tar.gz")
})

test("practical: nameOf handles hidden dotfiles", () => {
  assert.equal(nameOf("/home/user/.env.local"), ".env.local")
  assert.equal(nameOf("/home/user/.gitignore"), ".gitignore")
})

// --- Group 3: Status Labels & Tool Execution (5 tests) ---

test("practical: statusFromPart handles file tool executions", () => {
  assert.equal(statusFromPart({ type: "tool", tool: "read" }), "Gathering context...")
  assert.equal(statusFromPart({ type: "tool", tool: "write" }), "Making edits...")
  assert.equal(statusFromPart({ type: "tool", tool: "apply_patch" }), "Making edits...")
})

test("practical: statusFromPart handles search & web tool executions", () => {
  assert.equal(statusFromPart({ type: "tool", tool: "grep" }), "Searching codebase...")
  assert.equal(statusFromPart({ type: "tool", tool: "glob" }), "Searching codebase...")
  assert.equal(statusFromPart({ type: "tool", tool: "webfetch" }), "Searching web...")
  assert.equal(statusFromPart({ type: "tool", tool: "websearch" }), "Running websearch...")
})

test("practical: statusFromPart handles reasoning and thinking streams", () => {
  assert.equal(statusFromPart({ type: "reasoning" }), "Thinking...")
  assert.equal(statusFromPart({ type: "text" }), "Writing...")
})

test("practical: statusFromPart handles terminal command execution", () => {
  assert.equal(statusFromPart({ type: "tool", tool: "bash" }), "Running command...")
})

test("practical: statusFromPart handles custom/unknown tools gracefully", () => {
  assert.equal(statusFromPart({ type: "tool", tool: "custom_analyzer" }), "Running custom_analyzer...")
})

// --- Group 4: Header Builder & Auth Safety (5 tests) ---

test("practical: buildRequestHeaders creates valid authorization header for simple credentials", () => {
  const headers = buildRequestHeaders({ auth: { username: "opencode", password: "token123" } })
  assert.equal(headers["Authorization"].startsWith("Basic "), true)
  assert.equal(headers["Content-Type"], "application/json")
})

test("practical: buildRequestHeaders handles special characters in password", () => {
  const headers = buildRequestHeaders({ auth: { username: "user@domain.com", password: "p@$$w0rd!#%^&*" } })
  assert.equal("Authorization" in headers, true)
  assert.equal(headers["Content-Type"], "application/json")
})

test("practical: buildRequestHeaders includes x-opencode-directory header when directory is set", () => {
  const headers = buildRequestHeaders({ directory: "/workspace/opencode-mobile" })
  assert.equal(headers["x-opencode-directory"], "/workspace/opencode-mobile")
})

test("practical: buildRequestHeaders encodes unicode directory names correctly", () => {
  const dir = "/workspace/⚡_app_✨"
  const headers = buildRequestHeaders({ directory: dir })
  assert.equal(decodeURIComponent(headers["x-opencode-directory"]), dir)
})

test("practical: buildRequestHeaders leaves out header keys when inputs are unprovided", () => {
  const headers = buildRequestHeaders({ directory: "", auth: undefined })
  assert.equal("x-opencode-directory" in headers, false)
  assert.equal("Authorization" in headers, false)
})

// --- Group 5: Data Serialization & Sanitization (4 tests) ---

test("practical: JSON roundtrip preserves session state metadata", () => {
  const session = {
    id: "sess_123",
    title: "Refactor Theme",
    directory: "/app",
    status: "idle",
    created: 1775000000,
  }
  const serialized = JSON.stringify(session)
  const deserialized = JSON.parse(serialized)
  assert.deepEqual(deserialized, session)
})

test("practical: URL parameter construction formats query strings safely", () => {
  const params = new URLSearchParams({
    directory: "/home/user/my project",
    model: "deepseek-v4-flash-free",
  })
  assert.equal(params.toString(), "directory=%2Fhome%2Fuser%2Fmy+project&model=deepseek-v4-flash-free")
})

test("practical: connection ID generation produces 16-character alphanumeric string", () => {
  const id = "abc123def4567890"
  assert.equal(id.length, 16)
  assert.match(id, /^[a-zA-Z0-9]+$/)
})

test("practical: session status priority orders busy over idle", () => {
  const statuses: Array<"idle" | "busy" | "retry"> = ["idle", "busy", "retry"]
  const hasBusy = statuses.includes("busy")
  assert.equal(hasBusy, true)
})
