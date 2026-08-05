import { test } from "node:test"
import assert from "node:assert/strict"
import { buildConnectPayload, INSTALL_COMMAND, parseConnectPayload } from "./connect-qr.ts"

test("connect-qr: valid payload round-trips through build + parse", () => {
  const text = buildConnectPayload({
    v: 1,
    type: "opencode-connection",
    name: "Home lab",
    url: "https://abc-123.trycloudflare.com",
    auth: true,
    mode: "quick",
  })
  const parsed = parseConnectPayload(text)
  assert.ok(parsed)
  assert.equal(parsed.name, "Home lab")
  assert.equal(parsed.url, "https://abc-123.trycloudflare.com")
  assert.equal(parsed.auth, true)
  assert.equal(parsed.mode, "quick")
})

test("connect-qr: named tunnel payload keeps mode", () => {
  const text = buildConnectPayload({
    v: 1,
    type: "opencode-connection",
    name: "Server",
    url: "https://chat.example.com",
    auth: true,
    mode: "named",
  })
  const parsed = parseConnectPayload(text)
  assert.ok(parsed)
  assert.equal(parsed.mode, "named")
})

test("connect-qr: rejects wrong type and wrong version", () => {
  const base = { v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com" }
  assert.equal(parseConnectPayload(JSON.stringify({ ...base, type: "other" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ ...base, v: 2 })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ ...base, v: "1" })), null)
})

test("connect-qr: rejects missing or malformed fields", () => {
  assert.equal(parseConnectPayload(""), null)
  assert.equal(parseConnectPayload("not json"), null)
  assert.equal(parseConnectPayload("42"), null)
  assert.equal(parseConnectPayload(JSON.stringify({ type: "opencode-connection" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "", url: "https://x.example.com" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "x" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "ftp://x.example.com" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "x" })), null)
})

test("connect-qr: name is trimmed, collapses spaces, caps at 64", () => {
  const ok = parseConnectPayload(
    JSON.stringify({ v: 1, type: "opencode-connection", name: "  Home   server  ", url: "https://x.example.com" }),
  )
  assert.ok(ok)
  assert.equal(ok.name, "Home server")
  const tooLong = "n".repeat(65)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: tooLong, url: "https://x.example.com" })), null)
})

test("connect-qr: trailing slashes stripped from url", () => {
  const parsed = parseConnectPayload(
    JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com///" }),
  )
  assert.ok(parsed)
  assert.equal(parsed.url, "https://x.example.com")
})

test("connect-qr: auth defaults true, mode optional", () => {
  const parsed = parseConnectPayload(
    JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com" }),
  )
  assert.ok(parsed)
  assert.equal(parsed.auth, true)
  assert.equal(parsed.mode, undefined)
})

test("connect-qr: auth false honored, invalid auth/mode rejected", () => {
  const noAuth = parseConnectPayload(
    JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com", auth: false }),
  )
  assert.ok(noAuth)
  assert.equal(noAuth.auth, false)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com", auth: "yes" })), null)
  assert.equal(parseConnectPayload(JSON.stringify({ v: 1, type: "opencode-connection", name: "x", url: "https://x.example.com", mode: "fast" })), null)
})

test("connect-qr: INSTALL_COMMAND is the curl pipe documented in the CLI", () => {
  assert.ok(INSTALL_COMMAND.startsWith("curl -fsSL "))
  assert.ok(INSTALL_COMMAND.includes("opencode-remote/cli.mjs"))
  assert.ok(INSTALL_COMMAND.includes("node -- start"))
})
