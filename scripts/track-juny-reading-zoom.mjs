#!/usr/bin/env node
// The graded Reading clip is the same take as the ungraded one, with a
// digital zoom and drift added in the edit. Everything in the scene (page
// drawings, text) was placed on the ungraded frames, so this finds, for each
// frame, how the graded frame is scaled and shifted from the ungraded one:
//
//   graded = scale × ungraded + (x, y)      (in 1920×1080 pixels)
//
// and writes it to the scene, which moves its overlays the same way.
//
// It compares edge images (so the colour grade doesn't matter): a coarse
// search on a few keyframes, then a fine search on every frame.
//
//   node scripts/track-juny-reading-zoom.mjs <ungraded.mp4> <graded.mp4>
//
// Writes src/scenes/JunyStudios/Introduction/scenes/Reading/zoom.ts

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [ungraded, graded] = process.argv.slice(2);
if (!ungraded || !graded) {
  console.error("Usage: node scripts/track-juny-reading-zoom.mjs <ungraded.mp4> <graded.mp4>");
  process.exit(1);
}
const OUT = "src/scenes/JunyStudios/Introduction/scenes/Reading/zoom.ts";
const FULL_W = 1920;

const decode = (file, w, h) => {
  const buf = execFileSync(
    "npx",
    ["remotion", "ffmpeg", "-v", "error", "-i", file, "-vf", `scale=${w}:${h},format=gray`, "-c:v", "rawvideo", "-f", "image2pipe", "-"],
    { maxBuffer: 1 << 30 },
  );
  const frames = [];
  for (let o = 0; o + w * h <= buf.length; o += w * h) frames.push(buf.subarray(o, o + w * h));
  return frames;
};

// Gradient magnitude, normalised to zero mean / unit variance.
const edges = (g, w, h) => {
  const e = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = g[i + 1] - g[i - 1];
      const gy = g[i + w] - g[i - w];
      e[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  let m = 0;
  for (const v of e) m += v;
  m /= e.length;
  let s = 0;
  for (const v of e) s += (v - m) * (v - m);
  s = Math.sqrt(s / e.length) || 1;
  for (let i = 0; i < e.length; i++) e[i] = (e[i] - m) / s;
  return e;
};

// Correlation between graded edges and ungraded edges moved by (s, tx, ty).
const score = (gEdge, uEdge, w, h, s, tx, ty, step = 1) => {
  let sum = 0;
  let n = 0;
  const m = 2;
  for (let y = m; y < h - m; y += step) {
    const uy = (y - ty) / s;
    if (uy < 1 || uy >= h - 2) continue;
    const y0 = uy | 0;
    const fy = uy - y0;
    for (let x = m; x < w - m; x += step) {
      const ux = (x - tx) / s;
      if (ux < 1 || ux >= w - 2) continue;
      const x0 = ux | 0;
      const fx = ux - x0;
      const i = y0 * w + x0;
      const v =
        uEdge[i] * (1 - fx) * (1 - fy) + uEdge[i + 1] * fx * (1 - fy) + uEdge[i + w] * (1 - fx) * fy + uEdge[i + w + 1] * fx * fy;
      sum += v * gEdge[y * w + x];
      n++;
    }
  }
  return n > (w * h) / (step * step) / 3 ? sum / n : -1;
};

const search = (gE, uE, w, h, sRange, sStep, tRange, tStep, centre, step) => {
  let best = { c: -2, s: 1, tx: 0, ty: 0 };
  for (let s = sRange[0]; s <= sRange[1] + 1e-9; s += sStep) {
    for (let tx = centre.tx - tRange[0]; tx <= centre.tx + tRange[0] + 1e-9; tx += tStep) {
      for (let ty = centre.ty - tRange[1]; ty <= centre.ty + tRange[1] + 1e-9; ty += tStep) {
        const c = score(gE, uE, w, h, s, tx, ty, step);
        if (c > best.c) best = { c, s, tx, ty };
      }
    }
  }
  return best;
};

console.log("Decoding…");
const CW = 96;
const CH = 54;
const FW = 240;
const FH = 135;
const uC = decode(ungraded, CW, CH).map((f) => edges(f, CW, CH));
const gC = decode(graded, CW, CH).map((f) => edges(f, CW, CH));
const uF = decode(ungraded, FW, FH).map((f) => edges(f, FW, FH));
const gF = decode(graded, FW, FH).map((f) => edges(f, FW, FH));
const count = Math.min(gF.length, uF.length);

// Does the graded clip start on the same frame? Check a few offsets.
let offset = 0;
{
  let best = -2;
  for (const o of [-3, -2, -1, 0, 1, 2, 3]) {
    let total = 0;
    for (const k of [10, 40, 70]) {
      if (!uC[k + o] || !gC[k]) continue;
      total += search(gC[k], uC[k + o], CW, CH, [0.95, 1.35], 0.025, [24, 16], 2, { tx: -8, ty: -5 }, 2).c;
    }
    if (total > best) {
      best = total;
      offset = o;
    }
  }
  console.log(`Frame offset: graded frame i = ungraded frame i${offset >= 0 ? "+" : ""}${offset}`);
}

const result = [];
let prev = null;
for (let i = 0; i < count; i++) {
  const u = i + offset;
  if (u < 0 || u >= uF.length) {
    result.push(prev ?? { scale: 1, x: 0, y: 0 });
    continue;
  }
  // Coarse: wide search on the first frame, then follow the last answer.
  const centre = prev ? { tx: (prev.x / FULL_W) * CW, ty: (prev.y / FULL_W) * CW } : { tx: -8, ty: -5 };
  const sR = prev ? [prev.scale - 0.03, prev.scale + 0.03] : [0.95, 1.4];
  const coarse = search(gC[i], uC[u], CW, CH, sR, prev ? 0.005 : 0.01, prev ? [4, 4] : [24, 16], prev ? 0.5 : 1, centre, 1);
  // Fine, at 2.5× the resolution.
  const k = FW / CW;
  const fine = search(gF[i], uF[u], FW, FH, [coarse.s - 0.006, coarse.s + 0.006], 0.002, [1.5, 1.5], 0.25, { tx: coarse.tx * k, ty: coarse.ty * k }, 1);
  const r = { scale: fine.s, x: (fine.tx / FW) * FULL_W, y: (fine.ty / FW) * FULL_W, c: fine.c };
  result.push(r);
  prev = r;
  if (i % 10 === 0) console.log(`  ${i}: scale ${r.scale.toFixed(3)}, x ${r.x.toFixed(1)}, y ${r.y.toFixed(1)} (match ${r.c.toFixed(2)})`);
}

// Light smoothing, so the overlays don't jitter by a pixel frame to frame.
const smooth = result.map((_, i) => {
  const win = result.slice(Math.max(0, i - 2), i + 3);
  const avg = (key) => win.reduce((t, r) => t + r[key], 0) / win.length;
  return { scale: +avg("scale").toFixed(4), x: +avg("x").toFixed(1), y: +avg("y").toFixed(1) };
});

writeFileSync(
  OUT,
  `// Generated by scripts/track-juny-reading-zoom.mjs. Do not edit by hand.\n` +
    `// Per source frame of the graded clip: graded = scale × ungraded + (x, y).\n` +
    `// The scene's overlays were placed on the ungraded footage; this keeps them\n` +
    `// locked to the book through the edit's zoom. Graded frame i matches\n` +
    `// ungraded frame i${offset >= 0 ? "+" : ""}${offset}.\n\n` +
    `export const FOOTAGE_ZOOM: { scale: number; x: number; y: number }[] = ${JSON.stringify(smooth)};\n`,
);
console.log(`Wrote ${smooth.length} frames to ${OUT}`);
