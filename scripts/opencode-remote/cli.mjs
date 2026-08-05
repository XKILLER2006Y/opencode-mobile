#!/usr/bin/env node
// opencode-remote — tunnel wizard for exposing a local opencode server over
// the internet via Cloudflare Tunnel. Single-file, zero runtime deps, Node >= 18.
//
// Usage:
//   node cli.mjs [start|status|stop|restart|setup-domain|doctor] [--port 4096]
//
// Design: docs/superpowers/specs/2026-08-05-remote-connectivity.md
// The tunnel always targets 127.0.0.1:<port> — never a LAN IP. opencode's own
// username/password auth remains the app-level gate. The printed payload/QR is
// connection metadata only and never contains credentials.

import { execFile, spawn } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir, hostname } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 4096;
const HEALTH_TIMEOUT_MS = 2000;
const QUICK_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

// ---------------------------------------------------------------------------
// Pure helpers (unit-testable)
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const args = [...argv];
  let command = "start";
  let port = DEFAULT_PORT;
  let commandSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--port") {
      const value = args[i + 1];
      const parsed = Number(value);
      if (!value || !Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new UsageError(`invalid --port value: ${value ?? "(missing)"}`);
      }
      port = parsed;
      i += 1;
    } else if (arg === "-h" || arg === "--help") {
      command = "help";
      commandSeen = true;
    } else if (arg.startsWith("--")) {
      throw new UsageError(`unknown flag: ${arg}`);
    } else if (!commandSeen) {
      command = arg;
      commandSeen = true;
    } else {
      throw new UsageError(`unknown command: ${arg}`);
    }
  }

  return { command, port };
}

export function pickMode(state) {
  return state?.mode === "named" && state?.tunnelId ? "named" : "quick";
}

export function sanitizeName(name) {
  const trimmed = String(name ?? "").trim().replace(/\s+/g, " ");
  return trimmed.length > 64 ? trimmed.slice(0, 64) : trimmed;
}

export function buildPayload({ url, mode, name }) {
  return JSON.stringify({
    v: 1,
    type: "opencode-connection",
    name: sanitizeName(name),
    url: String(url).replace(/\/+$/, ""),
    auth: true,
    mode: mode === "named" ? "named" : "quick",
  });
}

export function parseQuickUrl(output) {
  const match = String(output ?? "").match(QUICK_URL_RE);
  return match ? match[0] : null;
}

export function configPath() {
  return join(homedir(), ".config", "opencode-remote.json");
}

// ---------------------------------------------------------------------------
// State file
// ---------------------------------------------------------------------------

export async function loadState(path = configPath()) {
  try {
    const raw = await readFile(path, "utf8");
    const state = JSON.parse(raw);
    return state && typeof state === "object" ? state : {};
  } catch {
    return {};
  }
}

export async function saveState(state, path = configPath()) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await rename(tmp, path);
}

// ---------------------------------------------------------------------------
// Process plumbing
// ---------------------------------------------------------------------------

function isWindows() {
  return process.platform === "win32";
}

export function runCapture(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout: String(stdout ?? ""),
        stderr: String(stderr ?? ""),
      });
    });
  });
}

export async function findCloudflared() {
  try {
    const probe = await runCapture("cloudflared", ["--version"]);
    return probe.ok ? "cloudflared" : null;
  } catch {
    return null;
  }
}

export async function cloudflaredInstalledMessage() {
  const hint = isWindows()
    ? "Install: winget install --id Cloudflare.cloudflared  (or https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)"
    : process.platform === "darwin"
      ? "Install: brew install cloudflared"
      : "Install: sudo apt install cloudflared  (or the official pkg.cloudflare.com repo — see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)";
  return `cloudflared not found on PATH. ${hint}`;
}

export function tunnelPids(port) {
  if (isWindows()) {
    return runCapture("tasklist", ["/FI", "IMAGENAME eq cloudflared.exe", "/FO", "CSV", "/NH"]).then((r) => {
      const count = r.stdout.split("\n").filter((line) => /cloudflared\.exe/i.test(line)).length;
      return { running: count > 0, count };
    });
  }
  const needle = `cloudflared tunnel --url http://127.0.0.1:${port}`;
  return runCapture("pgrep", ["-f", needle]).then((r) => {
    const count = r.ok ? r.stdout.trim().split("\n").filter(Boolean).length : 0;
    return { running: count > 0, count };
  });
}

export async function stopTunnel(port) {
  const state = await tunnelPids(port);
  if (!state.running) {
    return { stopped: false, message: "no cloudflared tunnel is running" };
  }
  if (isWindows()) {
    const r = await runCapture("taskkill", ["/IM", "cloudflared.exe", "/F"]);
    return { stopped: r.ok, message: r.ok ? `killed ${state.count} cloudflared process(es)` : r.stderr.trim() };
  }
  const r = await runCapture("pkill", ["-f", `cloudflared tunnel --url http://127.0.0.1:${port}`]);
  return { stopped: r.ok, message: r.ok ? `killed ${state.count} cloudflared process(es)` : r.stderr.trim() };
}

// ---------------------------------------------------------------------------
// Health — any HTTP response means the port is serving (auth may 401).
// ---------------------------------------------------------------------------

export async function checkHealth(port, timeoutMs = HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/global/health`, { signal: controller.signal });
    return { ok: true, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Payload / QR output
// ---------------------------------------------------------------------------

export async function printPayload(url, mode) {
  const payload = buildPayload({ url, mode, name: hostname() });
  try {
    const { default: qrcode } = await import("qrcode");
    const qr = await qrcode.toString(payload, { type: "terminal", small: true });
    console.log(qr);
  } catch {
    // qrcode module not installed — the payload line below is still machine-readable.
  }
  console.log(payload);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function ensurePrereqs({ port }) {
  const cf = await findCloudflared();
  if (!cf) {
    console.error(await cloudflaredInstalledMessage());
    process.exitCode = 1;
    return null;
  }
  const health = await checkHealth(port);
  if (!health.ok) {
    console.error(
      `no opencode server detected at http://127.0.0.1:${port}/global/health — start it first with:\n  opencode serve --hostname 127.0.0.1 --port ${port}`,
    );
    process.exitCode = 1;
    return null;
  }
  return { cf, health };
}

function runTunnel(args, onUrl) {
  const child = spawn("cloudflared", args, { stdio: ["ignore", "pipe", "pipe"] });
  const buffers = { stdout: "", stderr: "" };

  const scan = (stream, chunk) => {
    buffers[stream] += chunk.toString();
    if (onUrl) {
      const url = parseQuickUrl(buffers[stream]);
      if (url) {
        onUrl(url);
        onUrl = null;
      }
    }
  };

  child.stdout.on("data", (chunk) => {
    scan("stdout", chunk);
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    scan("stderr", chunk);
    process.stderr.write(chunk);
  });

  const shutdown = () => child.kill("SIGTERM");
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}

async function startQuickTunnel(port) {
  let printed = false;
  runTunnel(["tunnel", "--url", `http://127.0.0.1:${port}`], (url) => {
    if (printed) return;
    printed = true;
    console.log(`\nRemote connection ready: ${url}`);
    console.log("Scan this QR with the app (Connections → Scan to connect), or add the URL manually.");
    printPayload(url, "quick");
  });
}

async function startNamedTunnel(state) {
  console.log(`\nRemote connection ready: https://${state.domain}`);
  console.log("Scan this QR with the app (Connections → Scan to connect), or add the URL manually.");
  await printPayload(`https://${state.domain}`, "named");
  runTunnel(["tunnel", "run", state.tunnelId], null);
}

async function cmdStart(port) {
  const prereqs = await ensurePrereqs({ port });
  if (!prereqs) return;
  const state = await loadState();
  const mode = pickMode(state);
  if (mode === "named") {
    await startNamedTunnel(state);
  } else {
    await startQuickTunnel(port);
  }
}

async function cmdStop(port) {
  const result = await stopTunnel(port);
  console.log(result.message);
  if (!result.stopped) process.exitCode = 1;
}

async function cmdStatus(port) {
  const state = await loadState();
  const mode = pickMode(state);
  const health = await checkHealth(port);
  const procs = await tunnelPids(port);

  console.log(`mode:       ${mode}`);
  console.log(`tunnel:     ${procs.running ? `running (${procs.count} process)` : "not running"}`);
  console.log(`opencode:   ${health.ok ? `reachable on :${port} (HTTP ${health.status})` : `unreachable on :${port}`}`);
  if (state.lastUrl) console.log(`last URL:   ${state.lastUrl}`);
  if (state.domain) console.log(`domain:     ${state.domain}`);
  if (mode === "named" && state.domain) {
    console.log(`public URL: https://${state.domain}`);
  }
}

async function cmdDoctor(port) {
  const checks = [];
  const health = await checkHealth(port);
  const state = await loadState();
  const cf = await findCloudflared();

  checks.push([cf ? "ok" : "fail", "cloudflared installed", cf ? null : await cloudflaredInstalledMessage()]);
  checks.push([
    health.ok ? "ok" : "fail",
    `opencode reachable on :${port}`,
    health.ok ? null : `run: opencode serve --hostname 127.0.0.1 --port ${port}`,
  ]);
  checks.push([
    state.mode ? "ok" : "warn",
    state.mode ? `tunnel mode: ${state.mode}` : "no tunnel configured yet",
    state.mode ? null : "run: node cli.mjs start  (quick tunnel)  or  node cli.mjs setup-domain  (stable URL)",
  ]);
  if (state.mode === "named") {
    checks.push([
      state.domain ? "ok" : "fail",
      "named tunnel configured",
      state.domain ? `public URL: https://${state.domain}` : "run: node cli.mjs setup-domain",
    ]);
  }

  for (const [status, label, hint] of checks) {
    const mark = status === "ok" ? "✓" : status === "warn" ? "•" : "✗";
    console.log(`${mark} ${label}`);
    if (hint) console.log(`    ${hint}`);
  }

  if (checks.some(([status]) => status === "fail")) process.exitCode = 1;
}

async function ask(prompt) {
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(prompt);
  rl.close();
  return answer;
}

async function cmdSetupDomain(port) {
  const state = await loadState();
  if (state.mode === "named" && state.tunnelId && state.domain) {
    console.log(`Named tunnel already configured: https://${state.domain} (tunnel ${state.tunnelId})`);
    console.log("Run `node cli.mjs start` to bring it up.");
    return;
  }

  const cf = await findCloudflared();
  if (!cf) {
    console.error(await cloudflaredInstalledMessage());
    process.exitCode = 1;
    return;
  }

  console.log("Step 1/3 — authenticate with Cloudflare (opens a browser approval page).");
  const login = await runCapture("cloudflared", ["tunnel", "login"]);
  if (!login.ok) {
    console.error(`cloudflared tunnel login failed: ${login.stderr.trim() || "see output above"}`);
    process.exitCode = 1;
    return;
  }

  const tunnelName = `opencode-${hostname().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "server"}`;
  const create = await runCapture("cloudflared", ["tunnel", "create", tunnelName]);
  let tunnelId = null;
  if (create.ok) {
    try {
      tunnelId = JSON.parse(create.stdout).id ?? null;
    } catch {
      tunnelId = null;
    }
  }
  if (!tunnelId) {
    console.error(
      `cloudflared tunnel create failed. ${create.stderr.trim() || "tunnel may already exist — run: cloudflared tunnel list"}`,
    );
    process.exitCode = 1;
    return;
  }

  const domain = (await ask("\nStep 2/3 — public hostname (e.g. chat.example.com, must point at Cloudflare): ")).trim().toLowerCase();
  if (!domain || domain.startsWith("http") || domain.includes("/")) {
    console.error("invalid hostname — use bare domain form like chat.example.com (no scheme, no path)");
    process.exitCode = 1;
    return;
  }

  console.log(`Step 3/3 — routing ${domain} to tunnel ${tunnelId}.`);
  const route = await runCapture("cloudflared", ["tunnel", "route", "dns", tunnelId, domain]);
  if (!route.ok) {
    console.error(`cloudflared tunnel route dns failed: ${route.stderr.trim() || "is the domain on your Cloudflare account?"}`);
    process.exitCode = 1;
    return;
  }

  await saveState({ mode: "named", tunnelName, tunnelId, domain, port, lastUrl: `https://${domain}`, createdAt: new Date().toISOString() });
  console.log(`\nNamed tunnel configured: https://${domain}`);
  console.log("Run `node cli.mjs start` to bring it up, then scan the QR from the app.");
}

function printHelp() {
  console.log(`opencode-remote — expose a local opencode server over the internet

Usage:
  node cli.mjs <command> [--port 4096]

Commands:
  start          Start a tunnel (quick by default; named if configured) and print the connect QR
  status         Show tunnel + server health
  stop           Stop the running tunnel
  restart        Stop then start
  setup-domain   One-time setup for a stable (named) tunnel: cloudflared login → tunnel create → DNS
  doctor         Check prerequisites and print exactly what to fix
  help           Show this help`);
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export async function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`error: ${error.message}`);
      console.error("run `node cli.mjs help` for usage");
      process.exitCode = 2;
      return;
    }
    throw error;
  }

  switch (args.command) {
    case "help":
      printHelp();
      break;
    case "start":
      await cmdStart(args.port);
      break;
    case "status":
      await cmdStatus(args.port);
      break;
    case "stop":
      await cmdStop(args.port);
      break;
    case "restart": {
      const result = await stopTunnel(args.port);
      console.log(result.message);
      await cmdStart(args.port);
      break;
    }
    case "setup-domain":
      await cmdSetupDomain(args.port);
      break;
    case "doctor":
      await cmdDoctor(args.port);
      break;
    default:
      console.error(`error: unknown command: ${args.command}`);
      process.exitCode = 2;
  }
}

class UsageError extends Error {}

export function isMain(moduleUrl) {
  return Boolean(process.argv[1]) && moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2));
}
