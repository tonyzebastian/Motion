#!/usr/bin/env node
// Synthesizes the camera-themed sound effects for the Juny Studios Opening
// scene. Everything is built from noise and decaying tones with a fixed seed,
// so running this again gives identical files.
//
//   node scripts/generate-juny-opening-sfx.mjs
//
// Output: public/juny-studios/introduction/opening/sfx/*.wav (48kHz, 16-bit stereo)

import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";

const SR = 48_000;
const OUT = resolve("public/juny-studios/introduction/opening/sfx");
mkdirSync(OUT, { recursive: true });

// Deterministic noise.
let seed = 0x6a756e79;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};
const noise = () => rand() * 2 - 1;

const buffer = (seconds) => ({
  L: new Float32Array(Math.ceil(seconds * SR)),
  R: new Float32Array(Math.ceil(seconds * SR)),
});

// Equal-power pan: -1 = left, 1 = right.
const panGains = (p) => {
  const a = ((p + 1) / 2) * (Math.PI / 2);
  return [Math.cos(a), Math.sin(a)];
};

// Adds a mono signal generator into the buffer at `start` seconds.
const add = (buf, start, seconds, fn, pan = 0, gain = 1) => {
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(seconds * SR);
  for (let i = 0; i < n && s0 + i < buf.L.length; i++) {
    const v = fn(i / SR) * gain;
    buf.L[s0 + i] += v * gl;
    buf.R[s0 + i] += v * gr;
  }
};

// Building blocks ------------------------------------------------------------

// Damped sine, optionally starting higher and gliding down to `freq`.
const ping = (freq, tau, glideFrom = freq, glideTau = 0.004) => {
  let phase = 0;
  return (t) => {
    const f = freq + (glideFrom - freq) * Math.exp(-t / glideTau);
    phase += (2 * Math.PI * f) / SR;
    return Math.sin(phase) * Math.exp(-t / tau);
  };
};

// Short noise burst, brightened with a one-pole highpass.
const burst = (tau, hp = 0.85) => {
  let prevIn = 0;
  let prevOut = 0;
  return (t) => {
    const x = noise() * Math.exp(-t / tau);
    const y = hp * (prevOut + x - prevIn);
    prevIn = x;
    prevOut = y;
    return y;
  };
};

// Noise through a sweeping resonant bandpass (state-variable filter).
const sweptNoise = (fromHz, toHz, seconds, q = 0.35) => {
  let low = 0;
  let band = 0;
  return (t) => {
    const k = Math.min(1, t / seconds);
    const fc = fromHz * Math.pow(toHz / fromHz, k);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const high = noise() - low - q * band;
    band += f * high;
    low += f * band;
    return band;
  };
};

// Gentle fade at both ends so nothing clicks.
const declick = (buf, ms = 2) => {
  const n = Math.floor((ms / 1000) * SR);
  for (const ch of [buf.L, buf.R]) {
    for (let i = 0; i < n; i++) {
      ch[i] *= i / n;
      ch[ch.length - 1 - i] *= i / n;
    }
  }
};

const normalize = (buf, peakDb = -3) => {
  let peak = 0;
  for (const ch of [buf.L, buf.R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const target = Math.pow(10, peakDb / 20);
  const g = peak > 0 ? target / peak : 1;
  for (const ch of [buf.L, buf.R]) for (let i = 0; i < ch.length; i++) ch[i] *= g;
};

const write = (name, buf, peakDb) => {
  declick(buf);
  normalize(buf, peakDb);
  const frames = buf.L.length;
  const out = Buffer.alloc(44 + frames * 4);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + frames * 4, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    const l = Math.max(-1, Math.min(1, buf.L[i]));
    const r = Math.max(-1, Math.min(1, buf.R[i]));
    out.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  writeFileSync(resolve(OUT, `${name}.wav`), out);
  process.stdout.write(`${name}.wav  ${(frames / SR).toFixed(2)}s\n`);
};

// Sounds ---------------------------------------------------------------------

// 1. Shutter "click-clack" per photo, panned to where the photo lands.
//    Photo x positions (center) on the 1920px page, in landing order.
const PHOTO_X = [330, 1600, 1500, 560, 1830, 120, 1170, 880];
PHOTO_X.forEach((x, i) => {
  const pan = (x / 1920) * 2 - 1;
  const p = Math.max(-0.75, Math.min(0.75, pan * 0.75));
  const detune = 1 + (rand() - 0.5) * 0.12;
  const gap = 0.045 + rand() * 0.025; // mirror → curtain
  const buf = buffer(0.22);
  // Mirror slap: body + click.
  add(buf, 0, 0.06, burst(0.0035), p, 0.9);
  add(buf, 0, 0.08, ping(2100 * detune, 0.006), p, 0.45);
  add(buf, 0, 0.12, ping(170 * detune, 0.018, 260 * detune), p, 0.6);
  // Curtain: a touch brighter and quieter.
  add(buf, gap, 0.05, burst(0.0025, 0.92), p, 0.65);
  add(buf, gap, 0.06, ping(2900 * detune, 0.004), p, 0.3);
  add(buf, gap, 0.1, ping(210 * detune, 0.012, 300 * detune), p, 0.35);
  write(`shutter-${i + 1}`, buf, -3);
});

// 2. Soft "tok" per word, rising a little each word. Words 3–6 also carry the
//    tiny tick for the square that pops in with them.
const WORD_FREQS = [520, 551, 584, 619, 656, 695];
WORD_FREQS.forEach((f, i) => {
  const buf = buffer(0.25);
  add(buf, 0, 0.2, ping(f, 0.028, f * 1.6, 0.003), 0, 1);
  add(buf, 0, 0.2, ping(f * 2.01, 0.012), 0, 0.18);
  add(buf, 0, 0.02, burst(0.0015, 0.6), 0, 0.25);
  if (i >= 2) {
    add(buf, 0.02, 0.04, ping(3800, 0.004), 0.2, 0.22);
  }
  write(`tap-${i + 1}`, buf, -3);
});

// 3. Film advance lever: an accelerating ratchet ending in a soft stop.
{
  const buf = buffer(0.4);
  let t = 0;
  for (let k = 0; k < 7; k++) {
    const amp = k % 2 === 0 ? 1 : 0.7;
    add(buf, t, 0.03, burst(0.0018, 0.93), 0, 0.8 * amp);
    add(buf, t, 0.03, ping(3200 + k * 60, 0.003), 0, 0.35 * amp);
    t += 0.038 - k * 0.003;
  }
  add(buf, t + 0.01, 0.15, ping(220, 0.03, 340), 0, 0.7);
  add(buf, t + 0.01, 0.05, burst(0.004, 0.7), 0, 0.4);
  write("film-advance", buf, -3);
}

// 4. Whoosh that rises with the expand, landing in a low thump. `riseFrames`
//    matches expandEnd - expandStart in the scene's timing set (30fps).
const whoosh = (name, riseFrames) => {
  const RISE = riseFrames / 30;
  const buf = buffer(RISE + 0.7);
  const env = (t) =>
    t < RISE ? Math.pow(t / RISE, 2.2) : Math.exp(-(t - RISE) / 0.12);
  const l = sweptNoise(260, 2600, RISE);
  const r = sweptNoise(240, 2800, RISE);
  add(buf, 0, RISE + 0.6, (t) => l(t) * env(t), -0.6, 0.9);
  add(buf, 0, RISE + 0.6, (t) => r(t) * env(t), 0.6, 0.9);
  add(buf, RISE - 0.01, 0.6, ping(55, 0.14, 120, 0.03), 0, 1.3);
  add(buf, RISE - 0.01, 0.05, burst(0.006, 0.5), 0, 0.25);
  write(name, buf, -2);
};
whoosh("whoosh-expand", 35); // standard 6.5s Opening

// 5. Four quick ticks as the squares snap to the corners, panned L/R.
{
  const buf = buffer(0.32);
  [-0.7, 0.7, -0.5, 0.5].forEach((p, k) => {
    const t = k * 0.042;
    add(buf, t, 0.04, ping(2700 + k * 180, 0.005), p, 0.8);
    add(buf, t, 0.02, burst(0.0012, 0.9), p, 0.35);
  });
  write("corner-zip", buf, -4);
}

// 6. Shorter whoosh for the 3s Opening (18-frame expand). Generated last so
//    the files above stay byte-identical when re-run.
whoosh("whoosh-expand-short", 18);
