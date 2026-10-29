#!/usr/bin/env node
// Renders a handwriting clip exported from the playground Handwriting tool
// as a ProRes 4444 .mov with a transparent background, ready to drop on a
// track above other footage in DaVinci Resolve (or Premiere / Final Cut).
//
//   npm run handwriting -- ~/Downloads/handwriting-for-a-while-now.json
//   npm run handwriting -- settings.json out/my-clip.mov
//
// Add --png to get a transparent PNG sequence instead.
// See docs/handwriting.md.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

const args = process.argv.slice(2);
const png = args.includes("--png");
const [input, outArg] = args.filter((a) => !a.startsWith("--"));
if (!input) {
  console.error("Usage: npm run handwriting -- <settings.json> [output.mov] [--png]");
  process.exit(1);
}
const settingsPath = resolve(input);
if (!existsSync(settingsPath)) {
  console.error(`Can't find ${settingsPath}`);
  process.exit(1);
}

// Check it's a tool export before spending time rendering.
let settings;
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf8"));
} catch {
  console.error(`${input} isn't valid JSON.`);
  process.exit(1);
}
if (typeof settings.text !== "string" || typeof settings.size !== "number") {
  console.error(`${input} doesn't look like an export from the Handwriting tool.`);
  process.exit(1);
}

const name = basename(settingsPath, extname(settingsPath));
const out = resolve(outArg ?? (png ? `out/handwriting/${name}` : `out/handwriting/${name}.mov`));
mkdirSync(png ? out : dirname(out), { recursive: true });

const flags = png
  ? ["--sequence", "--image-format=png"]
  : ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"];

console.log(`Rendering "${settings.text.replace(/\n/g, " / ")}"`);
console.log(`  ${settings.width}×${settings.height} at ${settings.fps} fps → ${out}`);
const result = spawnSync(
  "npx",
  ["remotion", "render", "HandwritingClip", out, `--props=${settingsPath}`, ...flags],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
