#!/usr/bin/env node
// Part of the internal Mac tool (see README.md next to this file).
// Renders a handwriting clip exported from the playground Handwriting tool
// as a ProRes 4444 .mov with a transparent background, ready to drop on a
// track above other footage in DaVinci Resolve (or Premiere / Final Cut).
//
//   npm run handwriting -- ~/Downloads/handwriting-for-a-while-now.json
//   npm run handwriting -- settings.json out/my-clip.mov
//
// Options:
//   --png                     a transparent PNG sequence instead of a .mov
//   --text "line one|line 2"  use this text instead of the file's (| = new line)
//   --width 3840 --height 2160 --fps 24
//                             override the output size and frame rate
//   --out-dir <folder>        save into this folder, named after the text,
//                             without replacing an existing clip (adds -2, -3…)
//   --set key=value           change any other setting (repeatable), e.g.
//                             --set size=220 --set position=lower-third
//
// The last line printed is "OUTPUT: <path>" (used by the Resolve script).
// See README.md next to this file.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const VALUE_FLAGS = ["text", "width", "height", "fps", "out-dir", "set"];
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.includes(args[i - 1]?.replace(/^--/, "")));
const png = args.includes("--png");
const [input, outArg] = positional;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!input) fail("Usage: npm run handwriting -- <settings.json> [output.mov] [--png] [--text …] [--width …] [--height …] [--fps …] [--out-dir …]");
const settingsPath = resolve(input);
if (!existsSync(settingsPath)) fail(`Can't find ${settingsPath}`);

// Check it's a tool export before spending time rendering.
let settings;
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf8"));
} catch {
  fail(`${input} isn't valid JSON.`);
}
if (typeof settings.text !== "string" || typeof settings.size !== "number") {
  fail(`${input} doesn't look like an export from the Handwriting tool.`);
}

// Overrides (e.g. from the Resolve script: the text typed there, and the
// timeline's size and frame rate).
if (flag("text") !== undefined) settings.text = flag("text").replace(/\|/g, "\n");
for (const key of ["width", "height", "fps"]) {
  if (flag(key) !== undefined) {
    const n = Number(flag(key));
    if (!Number.isFinite(n) || n <= 0) fail(`--${key} must be a positive number`);
    settings[key] = key === "fps" ? n : Math.round(n);
  }
}
// --set key=value, any number of times. Numbers and true/false are parsed.
args.forEach((a, i) => {
  if (a !== "--set") return;
  const pair = args[i + 1] ?? "";
  const eq = pair.indexOf("=");
  if (eq < 1) fail(`--set needs key=value, got "${pair}"`);
  const key = pair.slice(0, eq);
  const raw = pair.slice(eq + 1);
  settings[key] = raw === "true" ? true : raw === "false" ? false : raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : raw;
});
if (!settings.text.trim()) fail("There's no text to write.");

const slug =
  settings.text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "handwriting";

let out;
if (flag("out-dir")) {
  // Named after the text; never replace an existing clip.
  const dir = resolve(flag("out-dir").replace(/^~(?=\/|$)/, process.env.HOME ?? "~"));
  const ext = png ? "" : ".mov";
  let n = 1;
  do {
    out = join(dir, `${slug}${n > 1 ? `-${n}` : ""}${ext}`);
    n++;
  } while (existsSync(out));
} else {
  const name = basename(settingsPath, extname(settingsPath));
  out = resolve(outArg ?? (png ? `out/handwriting/${name}` : `out/handwriting/${name}.mov`));
}
mkdirSync(png ? out : dirname(out), { recursive: true });

// Render from a copy with the overrides applied.
const propsPath = join(tmpdir(), `handwriting-props-${process.pid}.json`);
writeFileSync(propsPath, JSON.stringify(settings));

const flags = png
  ? ["--sequence", "--image-format=png"]
  : ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"];

console.log(`Rendering "${settings.text.replace(/\n/g, " / ")}"`);
console.log(`  ${settings.width}×${settings.height} at ${settings.fps} fps → ${out}`);
const result = spawnSync(
  "npx",
  ["remotion", "render", "HandwritingClip", out, `--props=${propsPath}`, "--log=error", ...flags],
  { stdio: "inherit", cwd: resolve(dirname(new URL(import.meta.url).pathname), "../..") },
);
// The settings copy was only needed for this render.
rmSync(propsPath, { force: true });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`OUTPUT: ${out}`);
