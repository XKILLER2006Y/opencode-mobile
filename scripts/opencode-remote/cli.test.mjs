import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildPayload,
  checkHealth,
  configPath,
  loadState,
  parseArgs,
  parseQuickUrl,
  pickMode,
  sanitizeName,
  saveState,
} from "./cli.mjs";

test("parseArgs: defaults to start on port 4096", () => {
  assert.deepEqual(parseArgs([]), { command: "start", port: 4096 });
});

test("parseArgs: accepts --port and a command", () => {
  assert.deepEqual(parseArgs(["start", "--port", "5000"]), { command: "start", port: 5000 });
  assert.deepEqual(parseArgs(["--port", "5000", "status"]), { command: "status", port: 5000 });
});

test("parseArgs: help flag", () => {
  assert.deepEqual(parseArgs(["--help"]), { command: "help", port: 4096 });
  assert.deepEqual(parseArgs(["-h"]), { command: "help", port: 4096 });
});

test("parseArgs: rejects invalid ports", () => {
  assert.throws(() => parseArgs(["--port", "abc"]), /invalid --port/);
  assert.throws(() => parseArgs(["--port", "0"]), /invalid --port/);
  assert.throws(() => parseArgs(["--port", "70000"]), /invalid --port/);
  assert.throws(() => parseArgs(["--port"]), /invalid --port/);
});

test("parseArgs: rejects unknown flags and extra commands", () => {
  assert.throws(() => parseArgs(["--bogus"]), /unknown flag/);
  assert.throws(() => parseArgs(["status", "stop"]), /unknown command/);
});

test("pickMode: named only when fully configured, else quick", () => {
  assert.equal(pickMode({ mode: "named", tunnelId: "abc" }), "named");
  assert.equal(pickMode({ mode: "named" }), "quick");
  assert.equal(pickMode({ mode: "quick" }), "quick");
  assert.equal(pickMode({}), "quick");
  assert.equal(pickMode(undefined), "quick");
});

test("sanitizeName: trims, collapses whitespace, caps at 64", () => {
  assert.equal(sanitizeName("  Home   server  "), "Home server");
  assert.equal(sanitizeName("x".repeat(100)).length, 64);
  assert.equal(sanitizeName(""), "");
  assert.equal(sanitizeName(undefined), "");
});

test("buildPayload: emits the exact connect contract", () => {
  const payload = JSON.parse(buildPayload({ url: "https://abc.trycloudflare.com", mode: "quick", name: "lab" }));
  assert.equal(payload.v, 1);
  assert.equal(payload.type, "opencode-connection");
  assert.equal(payload.name, "lab");
  assert.equal(payload.url, "https://abc.trycloudflare.com");
  assert.equal(payload.auth, true);
  assert.equal(payload.mode, "quick");
});

test("buildPayload: strips trailing slashes and pins mode", () => {
  const quick = JSON.parse(buildPayload({ url: "https://x.example.com/", mode: "quick", name: "a" }));
  assert.equal(quick.url, "https://x.example.com");
  const named = JSON.parse(buildPayload({ url: "https://y.example.com", mode: "named", name: "a" }));
  assert.equal(named.mode, "named");
  const bogusMode = JSON.parse(buildPayload({ url: "https://z.example.com", mode: "weird", name: "a" }));
  assert.equal(bogusMode.mode, "quick");
});

test("buildPayload: sanitizes name", () => {
  const payload = JSON.parse(buildPayload({ url: "https://a.example.com", mode: "quick", name: "  big   name  " }));
  assert.equal(payload.name, "big name");
});

test("parseQuickUrl: extracts from cloudflared banner output", () => {
  const banner = [
    "INF Starting local tunnel",
    "INF +--------------------------------------------------------------------------------------------+",
    "INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |",
    "INF |  https://secret-123-abc.trycloudflare.com                                                   |",
    "INF +--------------------------------------------------------------------------------------------+",
  ].join("\n");
  assert.equal(parseQuickUrl(banner), "https://secret-123-abc.trycloudflare.com");
});

test("parseQuickUrl: tolerates chunk splits", () => {
  const url = "https://split-1-2.trycloudflare.com";
  const half = Math.floor(url.length / 2);
  // First half alone has no complete match; the full stream does.
  assert.equal(parseQuickUrl(url.slice(0, half)), null);
  assert.equal(parseQuickUrl(url.slice(0, half) + url.slice(half)), url);
});

test("parseQuickUrl: returns null for garbage", () => {
  assert.equal(parseQuickUrl("no url here"), null);
  assert.equal(parseQuickUrl("http://lan-ip.example:4096"), null);
  assert.equal(parseQuickUrl(""), null);
});

test("configPath: absolute under the home .config dir", () => {
  const p = configPath();
  assert.ok(p.endsWith(join(".config", "opencode-remote.json")), p);
  assert.ok(p.includes("opencode-remote.json"), p);
});

test("state: save/load round-trip via temp dir", async () => {
  const dir = await mkdtemp(join(tmpdir(), "opencode-remote-test-"));
  try {
    const path = join(dir, "state.json");
    assert.deepEqual(await loadState(path), {});
    const state = { mode: "named", tunnelId: "t-1", domain: "chat.example.com", port: 4096 };
    await saveState(state, path);
    assert.deepEqual(await loadState(path), state);
    await saveState({ mode: "quick", lastUrl: "https://q.trycloudflare.com" }, path);
    assert.deepEqual(await loadState(path), { mode: "quick", lastUrl: "https://q.trycloudflare.com" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("state: missing or corrupt file yields empty state", async () => {
  const dir = await mkdtemp(join(tmpdir(), "opencode-remote-test-"));
  try {
    const path = join(dir, "missing.json");
    assert.deepEqual(await loadState(path), {});
    await saveState("{ not json", path);
    assert.deepEqual(await loadState(path), {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("checkHealth: any HTTP response counts as reachable (auth may 401)", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/unauth") {
      res.statusCode = 401;
      res.end("unauthorized");
      return;
    }
    res.statusCode = 200;
    res.end("ok");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    const healthy = await checkHealth(port);
    assert.equal(healthy.ok, true);
    assert.equal(healthy.status, 200);
  } finally {
    server.close();
  }
});

test("checkHealth: 401 still counts as reachable", async () => {
  const server = createServer((_req, res) => {
    res.statusCode = 401;
    res.end("unauthorized");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    const health = await checkHealth(port);
    assert.equal(health.ok, true);
    assert.equal(health.status, 401);
  } finally {
    server.close();
  }
});

test("checkHealth: unreachable port", async () => {
  const server = createServer(() => {});
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  const health = await checkHealth(port, 500);
  assert.equal(health.ok, false);
  assert.equal(health.status, 0);
});
