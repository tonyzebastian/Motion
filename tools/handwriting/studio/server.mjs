#!/usr/bin/env node
// Handwriting Studio: a local window for writing handwriting clips with a
// live preview, opened from DaVinci Resolve (Workspace → Scripts →
// Handwriting → Open Studio) or directly. Part of the internal Mac tool;
// see ../README.md.
//
//   npm run handwriting:studio
//
// Serves the studio page on http://127.0.0.1:4517 and does the things a web
// page can't: lists and saves looks (../looks/), opens a native folder
// picker, renders clips with ../render.mjs, and
// shows them in Finder. Only listens on this Mac.

import { spawn, execFile } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

export const PORT = 4517;
const HERE = dirname(fileURLToPath(import.meta.url));
const MOTION = resolve(HERE, "../../..");
const LOOKS = resolve(HERE, "../looks");
const STATE_DIR = join(homedir(), "Library/Application Support/Handwriting");
const STATE_FILE = join(STATE_DIR, "settings.txt");
const DEFAULT_OUT = "~/Movies/Handwriting";

// ─── State shared with the Resolve script (key=value lines) ─────────────
const readState = () => {
  const state = {};
  if (existsSync(STATE_FILE)) {
    for (const line of readFileSync(STATE_FILE, "utf8").split("\n")) {
      const m = line.match(/^([\w]+)=(.*)$/);
      if (m) state[m[1]] = m[2];
    }
  }
  return state;
};
const writeState = (patch) => {
  const state = { ...readState(), ...patch };
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, Object.entries(state).map(([k, v]) => `${k}=${String(v).replace(/\n/g, " ")}`).join("\n") + "\n");
};
const expand = (p) => p.replace(/^~(?=\/|$)/, homedir());

// ─── Page ───────────────────────────────────────────────────────────────
let bundle = "";
const buildPage = async () => {
  const result = await build({
    entryPoints: [join(HERE, "app.tsx")],
    bundle: true,
    write: false,
    format: "esm",
    jsx: "automatic",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  });
  bundle = result.outputFiles[0].text;
};

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Handwriting Studio</title></head>
<body><div id="root"></div><script type="module" src="/app.js"></script></body></html>`;

// ─── Helpers ────────────────────────────────────────────────────────────
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const readBody = (req) =>
  new Promise((ok, fail) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        ok(data ? JSON.parse(data) : {});
      } catch (e) {
        fail(e);
      }
    });
  });
const osa = (script) =>
  new Promise((ok) => execFile("/usr/bin/osascript", ["-e", script], (err, out) => ok(err ? null : out.trim())));

const looks = () =>
  existsSync(LOOKS)
    ? readdirSync(LOOKS)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => ({ name: f.replace(/\.json$/, ""), settings: JSON.parse(readFileSync(join(LOOKS, f), "utf8")) }))
    : [];

// Renders one clip; resolves with its path.
const render = (settings, outDir) =>
  new Promise((ok, fail) => {
    const file = join(tmpdir(), `handwriting-studio-${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(settings));
    const child = spawn(process.execPath, [resolve(HERE, "../render.mjs"), file, "--out-dir", outDir], {
      cwd: MOTION,
      env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}` },
    });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    child.on("close", (code) => {
      rmSync(file, { force: true });
      const path = log.match(/OUTPUT: (.+)/)?.[1]?.trim();
      if (code === 0 && path) ok(path);
      else fail(new Error(log.trim().split("\n").slice(-8).join("\n") || `Render failed (${code})`));
    });
  });

// ─── Server ─────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(PAGE);
    }
    if (req.method === "GET" && url.pathname === "/app.js") {
      res.writeHead(200, { "content-type": "text/javascript" });
      return res.end(bundle);
    }
    if (url.pathname === "/api/ping") return json(res, 200, { ok: true });
    if (url.pathname === "/api/state") {
      const state = readState();
      return json(res, 200, { outputDir: state.outputDir || DEFAULT_OUT, studio: state.studio ? JSON.parse(state.studio) : null });
    }
    if (url.pathname === "/api/looks" && req.method === "GET") return json(res, 200, looks());
    if (url.pathname === "/api/looks" && req.method === "POST") {
      const { name, settings } = await readBody(req);
      const clean = String(name || "").replace(/[/\\:]/g, "-").trim();
      if (!clean) return json(res, 400, { error: "Give the look a name." });
      const look = { ...settings, text: "your text here" };
      delete look.instructions;
      writeFileSync(join(LOOKS, `${clean}.json`), JSON.stringify(look, null, 2));
      return json(res, 200, looks());
    }
    if (url.pathname === "/api/choose-folder") {
      const current = expand(readState().outputDir || DEFAULT_OUT);
      const picked = await osa(
        `POSIX path of (choose folder with prompt "Save handwriting clips to"${existsSync(current) ? ` default location POSIX file "${current.replace(/"/g, '\\"')}"` : ""})`,
      );
      if (!picked) return json(res, 200, { cancelled: true });
      const dir = picked.replace(/\/$/, "").replace(homedir(), "~");
      writeState({ outputDir: dir });
      return json(res, 200, { outputDir: dir });
    }
    if (url.pathname === "/api/remember" && req.method === "POST") {
      const { settings } = await readBody(req);
      writeState({ studio: JSON.stringify(settings) });
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/api/render" && req.method === "POST") {
      const { settings } = await readBody(req);
      const outDir = readState().outputDir || DEFAULT_OUT;
      const path = await render(settings, expand(outDir));
      writeState({ studio: JSON.stringify(settings) });
      return json(res, 200, { path, display: path.replace(homedir(), "~") });
    }
    if (url.pathname === "/api/reveal" && req.method === "POST") {
      const { path } = await readBody(req);
      if (path && existsSync(path)) execFile("/usr/bin/open", ["-R", path]);
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: String(error.message || error) });
  }
});

await buildPage();
server.listen(PORT, "127.0.0.1", () => console.log(`Handwriting Studio on http://127.0.0.1:${PORT}`));
