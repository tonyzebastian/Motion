#!/usr/bin/env node
// Cuts the hand out of the Juny "reading book" clip so it can sit above the
// painted worlds. Writes one RGBA PNG per frame: the hand in its original
// colors, everything else transparent.
//
// The page is cool grey and bright; the hand is warm and darker.
// Tuned on the ungraded clip; a new grade may need the thresholds nudged. Each pixel
// gets a score from those two cues, then the matte is cleaned up (speckles
// removed, edge grown a little and feathered).
//
// Re-run after swapping in a new take or the graded clip:
//   node scripts/generate-juny-hand-matte.mjs
//   node scripts/generate-juny-hand-matte.mjs path/to/clip.mp4 --frames 76

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--")) ?? "public/juny-studios/introduction/reading/reading-book.mp4";
const framesArg = args.indexOf("--frames");
// Only frames where the book is open; after that the worlds are gone.
const FRAMES = framesArg >= 0 ? Number(args[framesArg + 1]) : 78;
const OUT = "public/juny-studios/introduction/reading/hand";

const W = 1920;
const H = 1080;
// Only look for the hand over the open book (with a margin).
const REGION = { x0: 455, x1: 1360, y0: 245, y1: 975 };
// The spine crease is dark and warm too; only count clearly-skin pixels there.
const SPINE = { x: 895, half: 28 };

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Separable box blur on a Float32Array, `r` px radius.
const boxBlur = (src, r) => {
  const tmp = new Float32Array(src.length);
  const dst = new Float32Array(src.length);
  const k = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    let acc = 0;
    const row = y * W;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[row + x] = acc / k;
      acc += src[row + Math.min(W - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      dst[y * W + x] = acc / k;
      acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
    }
  }
  return dst;
};

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const encodePng = (rgba) => {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

console.log(`Decoding ${FRAMES} frames from ${input}…`);
const all = execFileSync(
  "npx",
  ["remotion", "ffmpeg", "-v", "error", "-i", input, "-vframes", String(FRAMES),
    "-c:v", "rawvideo", "-pix_fmt", "rgb24", "-f", "image2pipe", "-"],
  { maxBuffer: W * H * 3 * (FRAMES + 2) },
);
const frameBytes = W * H * 3;
const count = Math.floor(all.length / frameBytes);

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".png")) rmSync(join(OUT, f));

for (let n = 0; n < count; n++) {
  const px = all.subarray(n * frameBytes, (n + 1) * frameBytes);
  const score = new Float32Array(W * H);
  for (let y = REGION.y0; y < REGION.y1; y++) {
    for (let x = REGION.x0; x < REGION.x1; x++) {
      const i = y * W + x;
      const r = px[i * 3];
      const g = px[i * 3 + 1];
      const b = px[i * 3 + 2];
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      // Warmth relative to brightness. Skin sits around 0.12–0.22; page in
      // shade tops out near 0.06.
      const warm = (r - b) / Math.max(lum, 1);
      const nearSpine = Math.abs(x - SPINE.x) < SPINE.half;
      const skin = nearSpine
        ? smooth(0.15, 0.19, warm) * smooth(110, 95, lum)
        : smooth(0.085, 0.125, warm) * smooth(128, 112, lum);
      // Very dark and not teal: hand in deep shadow.
      const dark = g - r < 8 && !nearSpine ? smooth(72, 58, lum) : 0;
      score[i] = Math.max(skin, dark);
    }
  }
  // Remove speckles, grow the edge a touch, then feather.
  const soft = boxBlur(score, 5);
  const solid = soft.map((v) => smooth(0.3, 0.55, v));
  const alpha = boxBlur(boxBlur(solid, 3), 2);

  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = Math.round(clamp01(alpha[i] * 1.15) * 255);
    if (a === 0) continue;
    rgba[i * 4] = px[i * 3];
    rgba[i * 4 + 1] = px[i * 3 + 1];
    rgba[i * 4 + 2] = px[i * 3 + 2];
    rgba[i * 4 + 3] = a;
  }
  writeFileSync(join(OUT, `hand-${String(n).padStart(3, "0")}.png`), encodePng(rgba));
  if (n % 10 === 0) console.log(`  frame ${n}`);
}
console.log(`Wrote ${count} frames to ${OUT}`);
