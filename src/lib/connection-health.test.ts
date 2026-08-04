import { test } from "node:test"
import assert from "node:assert/strict"

function normalizeServerUrl(rawUrl: string): { ok: boolean; normalized?: string; error?: string } {
  let trimmed = rawUrl.trim()
  if (!trimmed) return { ok: false, error: "URL cannot be empty" }

  // Add default http scheme if omitted
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`
  }

  try {
    const parsed = new URL(trimmed)
    if (!parsed.hostname) return { ok: false, error: "Invalid hostname" }
    // Strip trailing slash from pathname if empty
    const cleanUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`
    return { ok: true, normalized: cleanUrl }
  } catch {
    return { ok: false, error: "Invalid URL format" }
  }
}

test("connection-health: normalizeServerUrl handles IP with port", () => {
  const res = normalizeServerUrl("100.108.64.76:4096")
  assert.equal(res.ok, true)
  assert.equal(res.normalized, "http://100.108.64.76:4096")
})

test("connection-health: normalizeServerUrl handles full https URL", () => {
  const res = normalizeServerUrl("https://opencode.agentlabs.cc/")
  assert.equal(res.ok, true)
  assert.equal(res.normalized, "https://opencode.agentlabs.cc")
})

test("connection-health: normalizeServerUrl rejects empty string", () => {
  const res = normalizeServerUrl("   ")
  assert.equal(res.ok, false)
  assert.equal(res.error, "URL cannot be empty")
})

test("connection-health: normalizeServerUrl rejects malformed strings", () => {
  const res = normalizeServerUrl("http://:8080")
  assert.equal(res.ok, false)
})
