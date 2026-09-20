/* eslint-disable */
// @ts-nocheck
//
// Riso engine lineage:
// - Riso printing primitives adapted from Ishaan Kalra's creative-skills,
//   MIT License, Copyright (c) 2026 Ishaan Kalra.
// - Inspired by Kevin Ngo's "a small light, room by room".
// - Room scene loop architecture and Remotion host integration are local work.
// See THIRD_PARTY_NOTICES.md for the full MIT notice.

"use strict";
const MKCANVAS = (w, h) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  return canvas;
};
/* ============================================================
   riso.js — a procedural risograph renderer for Canvas 2D.

   Nothing here draws a picture. It gives you inks, halftone screens,
   plate misregistration, a hand-drawn line, paper grain, and (at the
   bottom) the machinery for animating a drawing without re-rendering it.

   HOST HOOK: define MKCANVAS(w, h) before loading this.
     browser: (w,h) => { const c=document.createElement('canvas');
                         c.width=Math.ceil(w); c.height=Math.ceil(h); return c; }
     node:    (w,h) => createCanvas(Math.ceil(w), Math.ceil(h))   // @napi-rs/canvas
   ============================================================ */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- seeded randomness ----------------------------------------
   Never call Math.random(). Everything is a pure function of its key, so
   the same drawing comes back identically on every frame and every reload
   — which is what makes caching and diff-testing possible at all. */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stream(...keys) {
  let h = 0x9e3779b9;
  for (const k of keys) {
    h = Math.imul(h ^ hashStr(String(k)), 0x85ebca6b);
    h ^= h >>> 13;
  }
  const r = mulberry(h >>> 0);
  r();
  r();
  return r;
}
const rand = (R, a, b) => a + R() * (b - a);
const randi = (R, a, b) => Math.floor(rand(R, a, b + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function hash2(x, y, s) {
  let h =
    Math.imul(x | 0, 374761393) +
    Math.imul(y | 0, 668265263) +
    Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s = 0) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    u = x - xi,
    v = y - yi,
    a = u * u * (3 - 2 * u),
    b = v * v * (3 - 2 * v);
  return (
    lerp(
      lerp(hash2(xi, yi, s), hash2(xi + 1, yi, s), a),
      lerp(hash2(xi, yi + 1, s), hash2(xi + 1, yi + 1, s), a),
      b,
    ) *
      2 -
    1
  );
}

/* ---------- polyline helpers ---------- */
function resample(P, step) {
  const out = [P[0].slice()];
  let need = step;
  for (let n = 1; n < P.length; n++) {
    let x0 = P[n - 1][0],
      y0 = P[n - 1][1];
    const x1 = P[n][0],
      y1 = P[n][1];
    let d = Math.hypot(x1 - x0, y1 - y0);
    while (d >= need && d > 0) {
      const t = need / d;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      d -= need;
      need = step;
    }
    need -= d;
  }
  const L = P[P.length - 1],
    E = out[out.length - 1];
  if (Math.hypot(L[0] - E[0], L[1] - E[1]) > step * 0.25) out.push(L.slice());
  return out;
}
function smooth(P, closed = false, it = 2) {
  // Chaikin
  let p = P;
  for (let k = 0; k < it; k++) {
    const q = [],
      n = p.length;
    if (!closed) q.push(p[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i],
        b = p[(i + 1) % n];
      q.push(
        [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
        [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
      );
    }
    if (!closed) q.push(p[n - 1]);
    p = q;
  }
  return p;
}

/* ---------- isometric projection (only if you want one) ----------
   i runs toward the lower right, j toward the lower left, z up. */
const TW = 64,
  TH = 32,
  TZ = 32;
const iso = (i, j, z = 0) => [((i - j) * TW) / 2, ((i + j) * TH) / 2 - z * TZ];

/* ---------- the inks ------------------------------------------------
   Real Riso drum colours. There are four, and no others: every colour in
   the piece is one of these screened at a tone, or two of them overprinted.
   Swap these and the whole drawing re-palettes. */
const PAPER = [242, 234, 218];
const INKS = {
  blue: [45, 72, 132], // Federal Blue — linework, shadow, night
  coral: [242, 82, 100], // Fluoro Pink  — warm things, skin
  yellow: [255, 226, 0], // Yellow       — light, glow, straw
  teal: [0, 138, 138], // Teal         — plants, glass, water
};
const ANGLE = { blue: 15, coral: 75, yellow: 0, teal: 45 }; // screen angles; the moiré is the point
const MISREG = 1.15; // how far the plates slip, world px
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const PAPER_CSS = css(PAPER);

/* ---------- halftone screens ----------------------------------------
   One tile per ink per tone level, baked once and reused as a repeating
   pattern. This is the performance secret: fills become pattern fills
   rather than per-pixel work. */
const SS = 4,
  CELL = 2.5,
  TILE_N = 8,
  LEVELS = 16;
const tiles = new Map();
function halftoneTile(ink, level) {
  const key = ink + "|" + level;
  let cv = tiles.get(key);
  if (cv) return cv;
  const cell = CELL * SS,
    size = cell * TILE_N,
    tone = level / LEVELS,
    salt = hashStr(ink) % 9973;
  cv = MKCANVAS(size, size);
  const c = cv.getContext("2d");
  c.fillStyle = css(INKS[ink]);
  if (level >= LEVELS) c.fillRect(0, 0, size, size);
  else if (tone <= 0.5) {
    // dots grow: area proportional to tone
    for (let y = 0; y < TILE_N; y++)
      for (let x = 0; x < TILE_N; x++) {
        const r =
          cell *
          Math.sqrt(tone / Math.PI) *
          (0.9 + hash2(x, y, salt + level) * 0.2);
        const jx = (hash2(x, y, salt) - 0.5) * 0.08 * cell,
          jy = (hash2(y, x, salt) - 0.5) * 0.08 * cell;
        c.beginPath();
        c.arc((x + 0.5) * cell + jx, (y + 0.5) * cell + jy, r, 0, TAU);
        c.fill();
      }
  } else {
    // past 50% it flips: solid with shrinking holes
    c.fillRect(0, 0, size, size);
    c.globalCompositeOperation = "destination-out";
    for (let y = 0; y <= TILE_N; y++)
      for (let x = 0; x <= TILE_N; x++) {
        const r =
          cell *
          Math.sqrt((1 - tone) / Math.PI) *
          (0.9 + hash2(x % TILE_N, y % TILE_N, salt + level) * 0.2);
        c.beginPath();
        c.arc(x * cell, y * cell, r, 0, TAU);
        c.fill();
      }
  }
  c.globalCompositeOperation = "destination-out"; // worn drum: specks of missing ink
  const R = stream("speck", ink, level),
    n = (size * size) / 280;
  for (let k = 0; k < n; k++) {
    const s = rand(R, 1, 3.2);
    c.globalAlpha = rand(R, 0.25, 0.9);
    c.fillRect(R() * size, R() * size, s, s);
  }
  tiles.set(key, cv);
  return cv;
}
const screens = new Map();
var grainPattern = null;
/* Patterns belong to the context that created them. Call this whenever you
   start drawing on a different canvas, or you will get silent corruption. */
function resetInkCaches() {
  screens.clear();
  grainPattern = null;
}
function screen(ctx, ink, tone, dx, dy) {
  const level = clamp(Math.round(tone * LEVELS), 1, LEVELS);
  const key = `${ink}|${level}|${dx.toFixed(2)}|${dy.toFixed(2)}`;
  let pat = screens.get(key);
  if (pat) return pat;
  pat = ctx.createPattern(halftoneTile(ink, level), "repeat");
  pat.setTransform(
    new DOMMatrix()
      .translateSelf(dx, dy)
      .rotateSelf(ANGLE[ink] || 0)
      .scaleSelf(1 / SS),
  );
  screens.set(key, pat);
  return pat;
}

/* ---------- paper stock ---------- */
function grain(ctx) {
  if (grainPattern) return grainPattern;
  const cv = MKCANVAS(384, 384),
    c = cv.getContext("2d"),
    R = stream("grain");
  for (let k = 0; k < 2600; k++) {
    c.fillStyle = css(INKS.blue, rand(R, 0.03, 0.1));
    const s = rand(R, 0.6, 1.8);
    c.fillRect(R() * 384, R() * 384, s, s);
  }
  for (let k = 0; k < 110; k++) {
    c.strokeStyle = css(pick(R, [INKS.coral, INKS.blue]), rand(R, 0.04, 0.09));
    c.lineWidth = 0.6;
    const x = R() * 384,
      y = R() * 384,
      a = R() * TAU,
      l = rand(R, 4, 12);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(a + 0.6) * l * 0.5,
      y + Math.sin(a + 0.6) * l * 0.5,
      x + Math.cos(a) * l,
      y + Math.sin(a) * l,
    );
    c.stroke();
  }
  return (grainPattern = ctx.createPattern(cv, "repeat"));
}

/* ============================================================
   THE PEN — every mark in the drawing goes through here.
   ============================================================ */
function makePen(ctx, opt = {}) {
  const ox = opt.ox || 0,
    oy = opt.oy || 0,
    boil = opt.boil || 0,
    variant = boil % 3;
  const plate = {}; // plates don't line up, and slip again on each boil
  for (const k in INKS) {
    const J = stream("plate", k, variant);
    plate[k] = [rand(J, -1, 1) * MISREG, rand(J, -1, 1) * MISREG];
  }
  const pen = { ctx, boil, ox, oy };
  const p = (pen.p = (i, j, z = 0) => {
    const q = iso(i, j, z);
    return [q[0] + ox, q[1] + oy];
  });
  const trace = (P, dx = 0, dy = 0) => {
    ctx.beginPath();
    for (let n = 0; n < P.length; n++) {
      const x = P[n][0] + dx,
        y = P[n][1] + dy;
      n ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
  };
  const withInk = (ink, tone, fn) => {
    if (!INKS[ink]) ink = "blue";
    const [dx, dy] = plate[ink];
    ctx.globalCompositeOperation = "multiply"; // ink on paper only ever darkens
    fn(screen(ctx, ink, tone, dx, dy), dx, dy);
    ctx.globalCompositeOperation = "source-over";
  };

  /* Two ways to lay ink down, and choosing between them is most of the look.
       knock + tint  = an opaque object. Use for anything solid.
       tint alone    = a wash. Overlaps multiply, so petals laid over petals
                       build density the way real overprinting does.        */
  pen.knock = (P, a = 1) => {
    if (P.length < 3) return;
    trace(P);
    ctx.closePath();
    ctx.fillStyle = a === 1 ? PAPER_CSS : css(PAPER, a);
    ctx.fill();
  };
  pen.tint = (P, ink, tone = 1) => {
    if (tone <= 0 || P.length < 3) return;
    withInk(ink, tone, (st, dx, dy) => {
      trace(P, dx, dy);
      ctx.closePath();
      ctx.fillStyle = st;
      ctx.fill();
    });
  };
  pen.fill = (P, ink, tone = 1) => {
    pen.knock(P);
    if (ink && ink !== "paper") pen.tint(P, ink, tone);
  };

  /* the hand-drawn line: resample, then push each point with noise indexed
     by arc length so the wobble travels ALONG the stroke instead of
     flickering per vertex */
  pen.line = (P, ink = "blue", w = 1.3, o = {}) => {
    if (!P || P.length < 2) return;
    const src = o.closed ? [...P, P[0]] : P;
    let Q = resample(src, Math.max(2.5, w * 1.5));
    if (Q.length < 2) return;
    const amp = o.amp ?? 0.35 + w * 0.15;
    if (amp > 0) {
      const seed =
        (hash2(
          Math.round(src[0][0] * 3),
          Math.round(src[0][1] * 3),
          boil * 7 + 1,
        ) *
          1e6) |
        0;
      let s = 0;
      Q = Q.map((q, n) => {
        if (n) s += Math.hypot(q[0] - Q[n - 1][0], q[1] - Q[n - 1][1]);
        return [
          q[0] +
            noise(s * 0.045, 0.5, seed) * amp +
            (hash2(n, seed, 1) - 0.5) * amp * 0.3,
          q[1] +
            noise(s * 0.045, 7.5, seed) * amp +
            (hash2(seed, n, 2) - 0.5) * amp * 0.3,
        ];
      });
      if (o.closed) Q[Q.length - 1] = Q[0].slice();
    }
    withInk(ink, o.tone ?? 1, (st, dx, dy) => {
      ctx.strokeStyle = st;
      ctx.lineWidth = w;
      ctx.lineCap = o.cap || "round";
      ctx.lineJoin = "round";
      if (o.dash) ctx.setLineDash(o.dash);
      trace(Q, dx, dy);
      ctx.stroke();
      if (o.dash) ctx.setLineDash([]);
    });
  };
  pen.shape = (P, fill, o = {}) => {
    if (fill) pen.fill(P, fill[0], fill[1]);
    if (o.line !== false)
      pen.line(P, o.line || "blue", o.w ?? 1.2, {
        closed: true,
        amp: o.amp,
        tone: o.lineTone,
      });
  };
  pen.dot = (x, y, r, ink = "blue", tone = 1) =>
    pen.tint(pen.circle(x, y, r, 10), ink, tone);

  /* light cannot come out of multiply: lift the paper first, then print yellow */
  pen.light = (P, strength = 0.5, ink = "yellow") => {
    pen.knock(P, 0.35 * strength + 0.1);
    pen.tint(P, ink, 0.22 + 0.35 * strength);
  };
  pen.glow = (i, j, z, r, ink = "yellow", strength = 0.6) => {
    for (let k = 0; k < 4; k++) {
      const E = pen.ellipse(i, j, z, r * (1 - k * 0.22));
      pen.knock(E, 0.18 * strength);
      pen.tint(E, ink, (strength * (k + 1)) / 4);
    }
  };
  pen.glowAt = (x, y, r, ink = "yellow", strength = 0.6) => {
    for (let k = 0; k < 4; k++) {
      const E = pen.circle(x, y, r * (1 - k * 0.22), 20);
      pen.knock(E, 0.18 * strength);
      pen.tint(E, ink, (strength * (k + 1)) / 4);
    }
  };

  /* geometry — everything returns a point array */
  pen.circle = (x, y, r, n = 18) =>
    Array.from({ length: n }, (_, k) => [
      x + Math.cos((k / n) * TAU) * r,
      y + Math.sin((k / n) * TAU) * r,
    ]);
  pen.floorQuad = (i, j, w, d, z = 0) => [
    p(i, j, z),
    p(i + w, j, z),
    p(i + w, j + d, z),
    p(i, j + d, z),
  ];
  pen.ellipse = (ci, cj, z, ri, rj = ri, n = 28) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * TAU;
      return p(ci + Math.cos(a) * ri, cj + Math.sin(a) * rj, z);
    });
  pen.blob = (x, y, rx, ry, key = "blob", lump = 0.22, n = 9) => {
    const R = stream("blob", key),
      P = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rand(R, -0.2, 0.2),
        m = 1 + rand(R, -lump, lump);
      P.push([x + Math.cos(a) * rx * m, y + Math.sin(a) * ry * m]);
    }
    return smooth(P, true, 3);
  };
  pen.petal = (cx, cy, a, len, wid, curve = 0) => {
    const tx = cx + Math.cos(a) * len,
      ty = cy + Math.sin(a) * len;
    const mx = cx + Math.cos(a) * len * 0.5 - Math.sin(a) * curve,
      my = cy + Math.sin(a) * len * 0.5 + Math.cos(a) * curve;
    const nx = -Math.sin(a) * wid,
      ny = Math.cos(a) * wid;
    return smooth(
      [
        [cx, cy],
        [mx + nx, my + ny],
        [tx, ty],
        [mx - nx, my - ny],
      ],
      true,
      3,
    );
  };
  pen.wallQuad = (wall, u, z, w, h, off = 0.02) => {
    const W = (a, zz) => (wall === "i" ? p(u + a, off, zz) : p(off, u + a, zz));
    return [W(0, z), W(w, z), W(w, z + h), W(0, z + h)];
  };
  pen.leaf = (a, b, wid) => {
    const mx = (a[0] + b[0]) / 2,
      my = (a[1] + b[1]) / 2,
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      L = Math.hypot(dx, dy) || 1,
      nx = (-dy / L) * wid,
      ny = (dx / L) * wid;
    return smooth([a, [mx + nx, my + ny], b, [mx - nx, my - ny]], true, 2);
  };
  /* an isometric box: shadow, the two faces pointing at the camera, then the top.
     Side faces are tinted darker than the top — that one tonal step is what
     makes a box read as a solid rather than a flat shape. */
  pen.box = (i, j, z, w, d, h, o = {}) => {
    const ink = o.ink || "coral",
      tone = o.tone ?? 0.5;
    if (o.shadow !== false)
      pen.tint(pen.floorQuad(i + 0.12, j + 0.18, w, d, z), "blue", 0.3);
    const top = pen.floorQuad(i, j, w, d, z + h);
    const faceJ = [
      p(i, j + d, z),
      p(i + w, j + d, z),
      p(i + w, j + d, z + h),
      p(i, j + d, z + h),
    ];
    const faceI = [
      p(i + w, j, z),
      p(i + w, j + d, z),
      p(i + w, j + d, z + h),
      p(i + w, j, z + h),
    ];
    pen.fill(faceJ, o.leftInk || ink, o.left ?? clamp(tone + 0.3, 0, 1));
    pen.fill(faceI, o.rightInk || ink, o.right ?? clamp(tone + 0.15, 0, 1));
    pen.fill(top, o.topInk || ink, o.top ?? tone);
    if (o.line !== false) {
      const lw = o.w ?? 1.1;
      for (const F of [faceJ, faceI, top])
        pen.line(F, "blue", lw, { closed: true });
    }
    return { top, faceI, faceJ };
  };
  /* a cutaway room: floor slab, plank lines, the two back walls */
  pen.shell = (r) => {
    const { w, d, h } = r,
      st = r.style || {},
      T = 0.25;
    const [fi, ft] = st.floor || ["blue", 0.65],
      [wi, wt] = st.wall || ["coral", 0.3],
      [wi2, wt2] = st.wall2 || [wi, Math.min(1, wt + 0.12)];
    pen.shape(
      [p(-T, d, 0), p(w, d, 0), p(w, d, -0.5), p(-T, d, -0.5)],
      [fi, Math.min(1, ft + 0.25)],
    );
    pen.shape(
      [p(w, -T, 0), p(w, d, 0), p(w, d, -0.5), p(w, -T, -0.5)],
      [fi, Math.min(1, ft + 0.12)],
    );
    pen.shape(pen.floorQuad(-T, -T, w + T, d + T, 0), [fi, ft], { w: 1.4 });
    if (st.planks !== false)
      for (let a = st.plank || 0.8; a < d; a += st.plank || 0.8)
        pen.line([p(0, a, 0), p(w, a, 0)], "blue", 0.6, {
          tone: 0.9,
          amp: 0.25,
        });
    if (h > 0) {
      pen.shape(pen.wallQuad("j", 0, 0, d, h, 0), [wi2, wt2]);
      pen.shape(pen.wallQuad("i", 0, 0, w, h, 0), [wi, wt]);
      pen.shape(
        [p(w, -T, 0), p(w, 0, 0), p(w, 0, h), p(w, -T, h)],
        [wi, Math.min(1, wt + 0.3)],
      );
      pen.shape(
        [p(-T, d, 0), p(0, d, 0), p(0, d, h), p(-T, d, h)],
        [wi2, Math.min(1, wt2 + 0.3)],
      );
      pen.shape(
        [
          p(-T, -T, h),
          p(w, -T, h),
          p(w, 0, h),
          p(0, 0, h),
          p(0, d, h),
          p(-T, d, h),
        ],
        ["paper", 0],
      );
      pen.line([p(0, d, 0.12), p(0, 0, 0.12), p(w, 0, 0.12)], "blue", 0.8, {
        tone: 0.8,
      });
    }
  };
  pen.capsule = (a, b, r) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * r,
      ny = (dx / L) * r,
      ux = (dx / L) * r,
      uy = (dy / L) * r;
    return smooth(
      [
        [a[0] + nx - ux, a[1] + ny - uy],
        [b[0] + nx + ux, b[1] + ny + uy],
        [b[0] - nx + ux, b[1] - ny + uy],
        [a[0] - nx - ux, a[1] - ny - uy],
      ],
      true,
      3,
    );
  };
  /* a limb is not a tube of one width — taper it or the elbow reads as a crease */
  pen.taper = (a, b, r0, r1) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      L = Math.hypot(dx, dy) || 1,
      ux = dx / L,
      uy = dy / L,
      nx = -uy,
      ny = ux,
      N = 8,
      P = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N,
        r = lerp(r0, r1, t);
      P.push([a[0] + dx * t + nx * r, a[1] + dy * t + ny * r]);
    }
    P.push([b[0] + ux * r1, b[1] + uy * r1]);
    for (let k = N; k >= 0; k--) {
      const t = k / N,
        r = lerp(r0, r1, t);
      P.push([a[0] + dx * t - nx * r, a[1] + dy * t - ny * r]);
    }
    P.push([a[0] - ux * r0, a[1] - uy * r0]);
    return smooth(P, true, 2);
  };
  /* a stem / cable / vine: one closed ribbon along a polyline, tapering,
     with its width modulated so it does not read as an extrusion */
  pen.ribbon = (P, r0, r1, wob = 0) => {
    const Q = smooth(P, false, 3),
      A = [],
      B = [];
    for (let i = 0; i < Q.length; i++) {
      const a = Q[Math.max(0, i - 1)],
        b = Q[Math.min(Q.length - 1, i + 1)];
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d,
        ny = dx / d,
        u = i / (Q.length - 1);
      const r = lerp(r0, r1, u) * (1 + 0.16 * Math.sin(u * 11 + wob));
      A.push([Q[i][0] + nx * r, Q[i][1] + ny * r]);
      B.push([Q[i][0] - nx * r, Q[i][1] - ny * r]);
    }
    return A.concat(B.reverse());
  };

  return pen;
}

/* ============================================================
   ANIMATION SUPPORT
   A full redraw of a dense riso scene costs 100–250ms, so nothing complex
   can animate by redrawing. Cache instead. See references/animation.md
   for the three approaches that FAILED before this one.

   Mark elements in your scene with element(x, y) / endElement(); they are
   no-ops until a capture runs.
   ============================================================ */
let REC = null;
function element(x, y) {
  if (REC) REC.begin(x, y);
}
function endElement() {
  if (REC) REC.end();
}

/* Run drawFn twice — once for geometry only (cheap, gives bounding boxes),
   once for real with each element translated into its slot on one atlas —
   and return every element as a sprite plus the blend mode it was painted
   with. Compositing those sprites back at zero offset reproduces the
   drawing exactly; giving each its own offset animates it. */
function captureSprites(drawFn, S, W, H) {
  const boxes = [],
    anchors = [],
    knocks = [];
  {
    // pass 1: geometry only
    const cv = MKCANVAS(8, 8),
      c = cv.getContext("2d");
    c.setTransform(S, 0, 0, S, 0, 0);
    const pen = makePen(c, { boil: 0 });
    let bb = null,
      knocked = false,
      anchor = [0, 0];
    const note = (P, pad) => {
      const m = c.getTransform();
      for (const q of P) {
        const x = m.a * q[0] + m.c * q[1] + m.e,
          y = m.b * q[0] + m.d * q[1] + m.f;
        if (!bb) bb = [x - pad, y - pad, x + pad, y + pad];
        else {
          if (x - pad < bb[0]) bb[0] = x - pad;
          if (y - pad < bb[1]) bb[1] = y - pad;
          if (x + pad > bb[2]) bb[2] = x + pad;
          if (y + pad > bb[3]) bb[3] = y + pad;
        }
      }
    };
    pen.knock = (P) => {
      knocked = true;
      note(P, 3 * S);
    };
    pen.tint = (P) => note(P, 3 * S);
    pen.line = (P, i, w) => note(P, (4 + (w || 1) * 1.5) * S);
    REC = {
      begin(x, y) {
        const m = c.getTransform();
        anchor = [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
        bb = null;
        knocked = false;
      },
      end() {
        boxes.push(
          bb && [
            Math.max(0, Math.floor(bb[0])),
            Math.max(0, Math.floor(bb[1])),
            Math.ceil(bb[2]),
            Math.ceil(bb[3]),
          ],
        );
        anchors.push(anchor);
        knocks.push(knocked);
        bb = null;
      },
    };
    drawFn(pen);
    REC = null;
  }

  const pad = 1,
    AW = Math.round(clamp(2048 * S, 1024, 4096));
  let x = pad,
    y = pad,
    rowH = 0,
    AH = pad;
  const slots = boxes.map((b) => {
    if (!b) return null;
    const w = b[2] - b[0],
      h = b[3] - b[1];
    if (w <= 0 || h <= 0) return null;
    if (x + w + pad > AW) {
      x = pad;
      y += rowH + pad;
      rowH = 0;
    }
    const s = { sx: x, sy: y, w, h, bx: b[0], by: b[1] };
    x += w + pad;
    rowH = Math.max(rowH, h);
    AH = Math.max(AH, y + rowH + pad);
    return s;
  });

  const atlas = MKCANVAS(AW, AH),
    ac = atlas.getContext("2d");
  resetInkCaches();
  ac.setTransform(S, 0, 0, S, 0, 0);
  const pen = makePen(ac, { boil: 0 });
  let n = 0,
    open = false;
  REC = {
    begin() {
      const sl = slots[n];
      if (!sl) {
        open = false;
        return;
      }
      const m = ac.getTransform();
      ac.save();
      ac.setTransform(1, 0, 0, 1, sl.sx - sl.bx, sl.sy - sl.by); // device-space offset into the slot
      ac.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      open = true;
    },
    end() {
      if (open) {
        ac.restore();
        open = false;
      }
      n++;
    },
  };
  drawFn(pen);
  REC = null;
  resetInkCaches();

  const sprites = [];
  slots.forEach((sl, i) => {
    if (sl)
      sprites.push({
        sx: sl.sx,
        sy: sl.sy,
        w: sl.w,
        h: sl.h,
        x: sl.bx,
        y: sl.by,
        blend: knocks[i] ? "source-over" : "multiply",
        ax: anchors[i][0],
        ay: anchors[i][1],
      });
  });
  return { atlas, sprites, scale: S };
}

/* offsetFn(ax, ay) -> [dx, dy] in DEVICE pixels. Round them: a whole-pixel
   blit is a straight copy, and anything else resamples the halftone and
   makes it crawl. */
function blitSprites(ctx, cache, ox, oy, offsetFn) {
  for (const sp of cache.sprites) {
    const d = offsetFn ? offsetFn(sp.ax, sp.ay) : [0, 0];
    ctx.globalCompositeOperation = sp.blend;
    ctx.drawImage(
      cache.atlas,
      sp.sx,
      sp.sy,
      sp.w,
      sp.h,
      ox + sp.x + Math.round(d[0]),
      oy + sp.y + Math.round(d[1]),
      sp.w,
      sp.h,
    );
  }
  ctx.globalCompositeOperation = "source-over";
}

/* bake a whole static layer (no per-element motion) */
function bakeLayer(drawFn, S, W, H) {
  const cv = MKCANVAS(Math.ceil(W * S), Math.ceil(H * S)),
    c = cv.getContext("2d");
  c.setTransform(S, 0, 0, S, 0, 0);
  resetInkCaches();
  drawFn(makePen(c, { boil: 0 }));
  return cv;
}
("use strict");
/* ============================================================
   SCENE — "ship it, then sleep"  ·  a developer's room
   Strictly back to front: walls -> floor -> standing things
   sorted by (i+j) -> things on top of things -> air.
   ============================================================ */
/* Every motion in the room has to be a harmonic of LOOP or the scene will not
   return to its starting state — fine on a page, but a video of it jumps at the
   wrap. HZ snaps a frequency to the nearest harmonic; nseLoop samples value
   noise around a circle, which is the only way to get a periodic wobble out of
   it. Both keep the original speed to within a few percent. */
const HZ = (f) => (Math.max(1, Math.round((f * LOOP) / TAU)) * TAU) / LOOP;
const nseLoop = (t, turns, seed) => {
  const a = (TAU * t) / LOOP;
  return noise(Math.cos(a) * turns, Math.sin(a) * turns, seed);
};

const ROOM = {
  w: 6.6,
  d: 6.2,
  h: 3.0,
  style: {
    floor: ["coral", 0.5],
    wall: ["blue", 0.3],
    wall2: ["blue", 0.4],
    plank: 0.8,
  },
};

function drawScene(pen, t) {
  const p = pen.p;
  const onI = (u, z) => p(u, 0.02, z); // a point on the back-RIGHT wall
  const onJ = (u, z) => p(0.02, u, z); // a point on the back-LEFT wall
  const wq = (wall, u, z, w, h) => pen.wallQuad(wall, u, z, w, h);
  // a light pool with soft, irregular edges — hard rectangles of light look wrong
  const softLight = (pts, s) => pen.light(smooth(pts, true, 3), s);

  /* ---------------------------------------------------------
     1. BACK-LEFT WALL — window on the night, shelves
     --------------------------------------------------------- */
  {
    const u0 = 3.7,
      z0 = 1.2,
      ww = 2.0,
      wh = 1.4;
    pen.fill(wq("j", u0, z0, ww, wh), "blue", 0.82); // night outside
    for (let k = 0; k < 26; k++) {
      // city lights on the far side
      const Rs = stream("city", k),
        u = rand(Rs, u0 + 0.1, u0 + ww - 0.1),
        z = rand(Rs, z0 + 0.1, z0 + wh - 0.5);
      const tw = 0.45 + 0.55 * Math.sin(t * HZ(1.6) + k * 2.3);
      pen.dot(...onJ(u, z), rand(Rs, 0.7, 1.6), "yellow", 0.55 + tw * 0.45);
    }
    const moon = Array.from({ length: 20 }, (_, k) => {
      const a = (k / 20) * Math.PI * 2;
      return onJ(
        u0 + 1.58 + Math.cos(a) * 0.16,
        z0 + 1.08 + Math.sin(a) * 0.18,
      );
    });
    pen.fill(moon, "yellow", 0.9);
    pen.line(wq("j", u0, z0, ww, wh), "blue", 1.9, { closed: true }); // frame
    pen.line([onJ(u0 + ww / 2, z0), onJ(u0 + ww / 2, z0 + wh)], "blue", 1.2);
    pen.line(
      [onJ(u0, z0 + wh * 0.52), onJ(u0 + ww, z0 + wh * 0.52)],
      "blue",
      1.2,
    );
    pen.line(
      [onJ(u0 - 0.14, z0 - 0.04), onJ(u0 + ww + 0.14, z0 - 0.04)],
      "blue",
      2.4,
    ); // sill
    // a small plant on the sill, leaning into the light
    for (let k = 0; k < 5; k++) {
      const a = -1.9 + k * 0.38,
        L = 11 + (k % 3) * 4,
        [x, y] = onJ(u0 + 0.35, z0 - 0.02);
      pen.shape(
        pen.leaf(
          [x, y],
          [
            x + Math.cos(a) * L + Math.sin(t * HZ(1.1) + k) * 1.2,
            y + Math.sin(a) * L,
          ],
          3.4,
        ),
        ["teal", 0.7 + k * 0.04],
        { w: 0.7 },
      );
    }
  }

  // shelves: three planks of books and junk
  for (let r = 0; r < 3; r++) {
    const z = 0.95 + r * 0.6,
      u0 = 0.45,
      wid = 2.7,
      dep = 0.4;
    pen.box(0, u0, z, dep, wid, 0.07, {
      ink: "coral",
      tone: 0.7,
      shadow: false,
      w: 0.9,
    });
    const Rb = stream("shelf", r);
    let a = 0.08;
    while (a < wid - 0.25) {
      const bw = rand(Rb, 0.09, 0.17),
        bh = rand(Rb, 0.3, 0.48),
        lean = Rb() < 0.12;
      if (Rb() < 0.08) {
        a += rand(Rb, 0.12, 0.3);
        continue;
      } // a gap
      const q = lean
        ? [
            onJ(u0 + a, z + 0.07),
            onJ(u0 + a + bw + 0.1, z + 0.07),
            onJ(u0 + a + bw + 0.16, z + 0.07 + bh),
            onJ(u0 + a + 0.06, z + 0.07 + bh),
          ]
        : [
            onJ(u0 + a, z + 0.07),
            onJ(u0 + a + bw, z + 0.07),
            onJ(u0 + a + bw, z + 0.07 + bh),
            onJ(u0 + a, z + 0.07 + bh),
          ];
      pen.fill(
        q,
        pick(Rb, ["coral", "yellow", "teal", "paper", "teal", "coral"]),
        rand(Rb, 0.45, 0.95),
      );
      pen.line(q, "blue", 0.55, { closed: true, amp: 0.12 });
      a += bw + 0.015;
    }
  }
  // a small trophy-ish mug and a rubber duck on the top shelf
  {
    const [x, y] = onJ(2.85, 2.22);
    pen.shape(
      smooth(
        [
          [x - 4, y],
          [x + 4, y],
          [x + 4, y - 9],
          [x - 4, y - 9],
        ],
        true,
        1,
      ),
      ["yellow", 0.8],
      { w: 0.9 },
    );
    pen.line(
      [
        [x + 4, y - 3],
        [x + 8, y - 4.5],
        [x + 4, y - 6],
      ],
      "blue",
      1.1,
    );
  }

  /* ---------------------------------------------------------
     2. BACK-RIGHT WALL — whiteboard, stickies, clock, LED strip
     --------------------------------------------------------- */
  {
    const u0 = 0.6,
      z0 = 1.5,
      bw = 2.5,
      bh = 1.15;
    pen.fill(wq("i", u0, z0, bw, bh), "paper", 0);
    pen.line(wq("i", u0, z0, bw, bh), "blue", 2, { closed: true });
    pen.line(
      [onI(u0 + 0.08, z0 - 0.05), onI(u0 + bw - 0.08, z0 - 0.05)],
      "blue",
      2.6,
    ); // marker tray
    pen.line(
      [onI(u0 + 0.45, z0 - 0.06), onI(u0 + 0.85, z0 - 0.06)],
      "coral",
      2.2,
      { amp: 0.1 },
    );
    pen.line(
      [onI(u0 + 0.95, z0 - 0.06), onI(u0 + 1.3, z0 - 0.06)],
      "teal",
      2.2,
      { amp: 0.1 },
    );
    // boxes-and-arrows: the architecture nobody has updated in six months
    const nodes = [
      [0.28, 0.76, 0.56, 0.24],
      [1.2, 0.78, 0.6, 0.24],
      [0.45, 0.32, 0.56, 0.22],
      [1.5, 0.3, 0.7, 0.24],
      [1.95, 0.74, 0.45, 0.2],
    ];
    nodes.forEach(([a, b, w, h], k) => {
      const q = [
        onI(u0 + a, z0 + b),
        onI(u0 + a + w, z0 + b),
        onI(u0 + a + w, z0 + b + h),
        onI(u0 + a, z0 + b + h),
      ];
      pen.line(q, k === 4 ? "coral" : "blue", 1.15, {
        closed: true,
        amp: 0.35,
      });
      for (let l = 0; l < 2; l++)
        pen.line(
          [
            onI(u0 + a + 0.07, z0 + b + h - 0.07 - l * 0.08),
            onI(u0 + a + w * (l ? 0.5 : 0.78), z0 + b + h - 0.07 - l * 0.08),
          ],
          "blue",
          0.7,
          { tone: 0.7, amp: 0.25 },
        );
    });
    const arrow = (a0, b0, a1, b1, ink) => {
      pen.line(
        [
          onI(u0 + a0, z0 + b0),
          onI(u0 + (a0 + a1) / 2, z0 + (b0 + b1) / 2 + 0.06),
          onI(u0 + a1, z0 + b1),
        ],
        ink,
        1,
        { amp: 0.3 },
      );
      const [hx, hy] = onI(u0 + a1, z0 + b1),
        dir = a1 > a0 ? -1 : 1;
      pen.line(
        [
          [hx + dir * 5, hy - 4],
          [hx, hy],
          [hx + dir * 5, hy + 3],
        ],
        ink,
        1,
        { amp: 0.2 },
      );
    };
    arrow(0.84, 0.88, 1.2, 0.9, "blue");
    arrow(0.56, 0.76, 0.7, 0.54, "blue");
    arrow(1.32, 0.78, 1.65, 0.54, "blue");
    arrow(1.78, 0.44, 2.0, 0.72, "coral");
    // a question mark someone added in pink
    {
      const [x, y] = onI(u0 + 2.26, z0 + 0.46);
      pen.line(
        [
          [x - 3, y - 7],
          [x + 2, y - 9],
          [x + 3, y - 4],
          [x, y - 1],
        ],
        "coral",
        1.6,
        { amp: 0.4 },
      );
      pen.dot(x, y + 3, 1.4, "coral");
    }
  }
  // sticky notes, slightly crooked
  for (let k = 0; k < 7; k++) {
    const Rs = stream("sticky", k),
      u = 3.35 + (k % 3) * 0.48,
      z = 2.3 - Math.floor(k / 3) * 0.46 + rand(Rs, -0.03, 0.03),
      s = 0.2,
      sk = rand(Rs, -0.05, 0.05);
    const q = [
      onI(u, z),
      onI(u + s, z + sk),
      onI(u + s, z + s + sk),
      onI(u, z + s),
    ];
    pen.fill(
      q,
      pick(Rs, ["yellow", "yellow", "coral", "teal"]),
      rand(Rs, 0.55, 0.9),
    );
    pen.line(q, "blue", 0.6, { closed: true, amp: 0.2 });
    for (let l = 0; l < 2; l++)
      pen.line(
        [
          onI(u + 0.04, z + 0.13 - l * 0.05),
          onI(u + s - 0.05, z + 0.13 - l * 0.05 + sk),
        ],
        "blue",
        0.5,
        { tone: 0.6, amp: 0.2 },
      );
  }
  {
    // a poster: one big shape, printed in two inks
    const u = 4.62,
      z = 1.52,
      w = 0.62,
      h = 0.82,
      q = pen.wallQuad("i", u, z, w, h);
    pen.fill(q, "paper", 0);
    const arc = [];
    for (let k = 0; k <= 16; k++) {
      const a = Math.PI + (k / 16) * Math.PI;
      arc.push(
        onI(u + w / 2 + Math.cos(a) * 0.22, z + 0.3 + Math.sin(a) * 0.26),
      );
    }
    pen.fill(arc, "coral", 0.85);
    for (let k = 0; k < 3; k++)
      pen.line(
        [
          onI(u + 0.1, z + 0.68 - k * 0.07),
          onI(u + w - 0.1, z + 0.68 - k * 0.07),
        ],
        "blue",
        0.8,
        { tone: 0.7, amp: 0.2 },
      );
    pen.line(q, "blue", 1.4, { closed: true });
  }
  // wall clock, 01:47
  {
    const cu = 5.4,
      cz = 2.25,
      disc = Array.from({ length: 22 }, (_, k) => {
        const a = (k / 22) * Math.PI * 2;
        return onI(cu + Math.cos(a) * 0.26, cz + Math.sin(a) * 0.28);
      });
    pen.shape(disc, ["paper", 0], { w: 1.4 });
    const [cx, cy] = onI(cu, cz);
    pen.line(
      [
        [cx, cy],
        [cx + 7, cy - 6],
      ],
      "blue",
      1.4,
      { amp: 0.15 },
    );
    const a = (TAU * 2 * t) / LOOP; // two whole turns per loop
    pen.line(
      [
        [cx, cy],
        [cx + Math.cos(a) * 11, cy + Math.sin(a) * 11],
      ],
      "coral",
      1,
      { amp: 0.15 },
    );
    pen.dot(cx, cy, 1.4, "blue");
  }

  /* ---------------------------------------------------------
     3. FLAT FLOOR THINGS
     --------------------------------------------------------- */
  {
    // rug
    const i = 0.4,
      j = 1.6,
      w = 4.7,
      d = 3.0;
    pen.shape(pen.floorQuad(i, j, w, d, 0.01), ["teal", 0.4], { w: 1 });
    pen.line(
      pen.floorQuad(i + 0.28, j + 0.28, w - 0.56, d - 0.56, 0.01),
      "coral",
      1.1,
      { closed: true, tone: 0.8 },
    );
    for (let k = 0; k < 4; k++)
      pen.line(
        pen.floorQuad(
          i + 0.5 + k * 0.1,
          j + 0.5 + k * 0.1,
          w - 1 - k * 0.2,
          d - 1 - k * 0.2,
          0.012,
        ),
        k % 2 ? "blue" : "coral",
        0.7,
        { closed: true, tone: 0.55, amp: 0.3 },
      );
    for (let a = 0.2; a < d; a += 0.34) {
      pen.line([p(i, j + a, 0), p(i - 0.18, j + a, 0)], "teal", 0.6, {
        amp: 0.1,
      });
      pen.line([p(i + w, j + a, 0), p(i + w + 0.18, j + a, 0)], "teal", 0.6, {
        amp: 0.1,
      });
    }
  }
  // cable run from the tower, along the skirting and under the rug
  pen.line(
    [
      p(4.9, 0.9, 0.02),
      p(4.8, 1.7, 0.02),
      p(4.2, 2.1, 0.02),
      p(4.5, 2.7, 0.02),
    ],
    "blue",
    1.5,
    { tone: 0.85, amp: 0.5 },
  );
  pen.line(
    [p(4.9, 0.9, 0.02), p(5.5, 1.3, 0.02), p(5.6, 2.2, 0.02)],
    "blue",
    1.3,
    { tone: 0.8, amp: 0.5 },
  );

  /* ---------------------------------------------------------
     4. THE DESK  (i 1.0 -> 5.6, against the back-right wall)
     --------------------------------------------------------- */
  const DI = 0.75,
    DJ = 0.35,
    DW = 4.0,
    DD = 1.1,
    DH = 0.76;
  const deskTop = DH;
  {
    // an LED strip behind the monitors washes the wall — soft edges, never a rectangle
    const band = [];
    for (let k = 0; k <= 14; k++) {
      const u = 0.7 + (k / 14) * 3.9;
      band.push(onI(u, 1.42 + Math.sin(k) * 0.03));
    }
    for (let k = 14; k >= 0; k--) {
      const u = 0.7 + (k / 14) * 3.9;
      band.push(onI(u, 0.82 - Math.sin(k * 0.7) * 0.04));
    }
    softLight(band, 0.2);
  }
  pen.tint(pen.floorQuad(DI + 0.15, DJ + 0.2, DW, DD, 0), "blue", 0.32); // desk shadow
  for (const a of [DI + 0.05, DI + DW - 0.17])
    for (const b of [DJ + 0.05, DJ + DD - 0.17])
      pen.box(a, b, 0, 0.12, 0.12, DH - 0.07, {
        ink: "coral",
        tone: 0.8,
        shadow: false,
        w: 0.8,
      });
  pen.box(DI - 0.05, DJ - 0.05, DH - 0.07, DW + 0.1, DD + 0.1, 0.07, {
    ink: "coral",
    tone: 0.55,
    left: 0.5,
    right: 0.6,
    shadow: false,
  });

  // ---- PC tower under the desk, with LEDs that breathe
  {
    const i = 4.55,
      j = 0.5;
    pen.box(i, j, 0, 0.48, 0.78, 1.0, { ink: "blue", tone: 0.9 });
    for (let k = 0; k < 5; k++) {
      const [x, y] = p(i + 0.02, j + 0.78, 0.78 - k * 0.13),
        on = 0.35 + 0.65 * Math.max(0, Math.sin(t * HZ(2.4) - k * 0.8));
      pen.knock(
        [
          [x + 4, y - 2],
          [x + 12, y - 2],
          [x + 12, y + 2],
          [x + 4, y + 2],
        ],
        0.5 * on,
      );
      pen.dot(x + 8, y, 1.8, k === 2 ? "coral" : "teal", 0.35 + on * 0.65);
    }
    pen.line([p(i, j + 0.78, 0.95), p(i + 0.48, j + 0.78, 0.95)], "teal", 0.8, {
      tone: 0.7,
    });
  }

  // ---- monitors
  const screenGlow = (i, w) =>
    softLight(
      pen.floorQuad(i - 0.12, DJ + 0.34, w + 0.24, 0.6, deskTop + 0.005),
      0.18,
    );
  function monitor(i, w, h, content) {
    const j = DJ + 0.12,
      d = 0.11,
      z = deskTop;
    pen.box(i + w / 2 - 0.13, j + 0.1, z, 0.26, 0.3, 0.06, {
      ink: "blue",
      tone: 0.85,
      shadow: false,
      w: 0.7,
    }); // foot
    pen.box(i + w / 2 - 0.05, j + 0.16, z + 0.06, 0.1, 0.1, 0.22, {
      ink: "blue",
      tone: 0.9,
      shadow: false,
      w: 0.7,
    }); // neck
    pen.box(i, j, z + 0.28, w, d, h, {
      ink: "blue",
      tone: 0.95,
      shadow: false,
      w: 1.1,
    }); // bezel
    const jF = j + d,
      z0 = z + 0.33,
      i0 = i + 0.05,
      sw = w - 0.1,
      sh = h - 0.1;
    const sp = (a, b) => p(i0 + a, jF, z0 + b);
    const face = [sp(0, 0), sp(sw, 0), sp(sw, sh), sp(0, sh)];
    pen.fill(face, "blue", 1);
    content(sp, sw, sh);
    pen.line(face, "blue", 0.9, { closed: true, amp: 0.2 });
  }

  // monitor 1: an editor, scrolling
  screenGlow(1.0, 1.7);
  monitor(1.0, 1.7, 0.95, (sp, sw, sh) => {
    const rows = 18,
      step = sh / 9,
      Rc = stream("code"); // 18 so the scroll wraps on the loop
    const CRATE = rows / (9 * LOOP);
    const lines = Array.from({ length: rows }, () => ({
      ind: pick(Rc, [0, 0, 0.08, 0.16, 0.16, 0.24]),
      toks: Array.from({ length: randi(Rc, 2, 5) }, () => [
        rand(Rc, 0.09, 0.3),
        pick(Rc, ["teal", "coral", "yellow", "paper"]),
      ]),
    }));
    const scroll = (t * CRATE) % 1;
    for (let k = 0; k < 9; k++) {
      const L = lines[(k + Math.floor(t * CRATE * 9)) % rows],
        b = sh - 0.07 - (k - scroll) * step;
      if (b < 0.05 || b > sh - 0.05) continue;
      let a = 0.08 + L.ind;
      for (const [w, ink] of L.toks) {
        if (a + w > sw - 0.06) break;
        const q = [
          sp(a, b),
          sp(a + w, b),
          sp(a + w, b + 0.045),
          sp(a, b + 0.045),
        ];
        pen.knock(q, 0.85);
        pen.tint(q, ink, 0.85);
        a += w + 0.035;
      }
    }
    // gutter + a blinking caret
    for (let k = 0; k < 9; k++)
      pen.dot(...sp(0.045, sh - 0.05 - k * step), 0.8, "teal", 0.5);
    if (Math.sin(t * HZ(5)) > 0) {
      const q = [
        sp(0.5, sh - 0.38),
        sp(0.53, sh - 0.38),
        sp(0.53, sh - 0.33),
        sp(0.5, sh - 0.33),
      ];
      pen.knock(q, 0.9);
      pen.tint(q, "yellow", 0.9);
    }
  });

  // monitor 2: a dashboard that is not going in the right direction
  screenGlow(2.95, 1.4);
  monitor(2.95, 1.4, 0.82, (sp, sw, sh) => {
    const bars = 11,
      bw = (sw - 0.22) / bars;
    for (let k = 0; k < bars; k++) {
      const hgt =
        (0.12 +
          0.5 *
            (0.5 + 0.5 * Math.sin(k * 1.3 + t * HZ(0.9))) *
            ((k / bars) * 0.7 + 0.4)) *
        sh;
      const a = 0.11 + k * bw,
        q = [
          sp(a, 0.12),
          sp(a + bw * 0.68, 0.12),
          sp(a + bw * 0.68, 0.12 + hgt),
          sp(a, 0.12 + hgt),
        ];
      pen.knock(q, 0.8);
      pen.tint(q, k > bars - 3 ? "coral" : "teal", 0.85);
    }
    pen.line([sp(0.09, 0.1), sp(sw - 0.09, 0.1)], "paper", 0.8, {
      tone: 0.7,
      amp: 0.1,
    });
    const pts = Array.from({ length: 12 }, (_, k) =>
      sp(
        0.11 + (k * (sw - 0.22)) / 11,
        sh - 0.22 + Math.sin(k * 0.9 + t * HZ(0.6)) * 0.05,
      ),
    );
    pen.line(pts, "yellow", 1.2, { amp: 0.3 });
  });

  // ---- desk surface: keyboard, mouse, mug, notebook, phone, lamp
  {
    // keyboard
    const i = 1.55,
      j = 1.08,
      w = 1.2,
      d = 0.36;
    pen.box(i, j, deskTop, w, d, 0.05, {
      ink: "paper",
      tone: 0,
      shadow: false,
      w: 0.9,
    });
    const Rk = stream("keys");
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 12; c++) {
        const a = i + 0.05 + (c * (w - 0.1)) / 12,
          b = j + 0.05 + (r * (d - 0.1)) / 4;
        pen.tint(
          pen.floorQuad(a, b, 0.07, 0.05, deskTop + 0.051),
          "blue",
          rand(Rk, 0.5, 0.85),
        );
      }
    // two fingers tapping
    const tap = Math.sin(t * HZ(9)) > 0 ? 1 : 0;
    pen.dot(
      ...p(i + 0.45, j + 0.16, deskTop + 0.07 + tap * 0.02),
      2.2,
      "coral",
      0.35,
    );
    pen.dot(
      ...p(i + 0.72, j + 0.2, deskTop + 0.07 + (1 - tap) * 0.02),
      2.2,
      "coral",
      0.35,
    );
  }
  pen.box(2.95, 1.1, deskTop, 0.18, 0.28, 0.05, {
    ink: "paper",
    tone: 0,
    shadow: false,
    w: 0.8,
  }); // mouse
  {
    // mug + steam
    const i = 3.75,
      j = 0.98,
      [x, y] = p(i, j, deskTop);
    pen.tint(pen.ellipse(i, j, deskTop + 0.002, 0.17, 0.17, 14), "blue", 0.3);
    pen.shape(
      [
        [x - 6, y - 1],
        [x + 6, y - 1],
        [x + 5, y - 15],
        [x - 5, y - 15],
      ],
      ["coral", 0.8],
      { w: 1 },
    );
    pen.line(
      [
        [x + 5.5, y - 5],
        [x + 10, y - 7],
        [x + 5.5, y - 11],
      ],
      "coral",
      1.4,
    );
    pen.shape(pen.circle(x, y - 15, 5.3, 12), ["blue", 0.9], {
      w: 0.8,
      amp: 0.15,
    });
    for (let k = 0; k < 2; k++) {
      const P = [],
        ph = t * HZ(1.5) + k * 1.8;
      for (let s = 0; s <= 9; s++) {
        const u = s / 9;
        P.push([
          x + (k - 0.5) * 4 + Math.sin(ph * 3 + u * 5) * 2.4 * u,
          y - 18 - u * 17,
        ]);
      }
      pen.line(P, "blue", 0.8, { tone: 0.5, amp: 0.2 });
    }
  }
  {
    // notebook and pen
    const i = 4.25,
      j = 0.6;
    pen.box(i, j, deskTop, 0.4, 0.5, 0.04, {
      ink: "yellow",
      tone: 0.75,
      shadow: false,
      w: 0.8,
    });
    for (let k = 0; k < 4; k++)
      pen.line(
        [
          p(i + 0.06, j + 0.09 + k * 0.09, deskTop + 0.041),
          p(i + 0.34, j + 0.09 + k * 0.09, deskTop + 0.041),
        ],
        "blue",
        0.5,
        { tone: 0.6 },
      );
    pen.line(
      [
        p(i - 0.1, j + 0.56, deskTop + 0.01),
        p(i + 0.32, j + 0.46, deskTop + 0.01),
      ],
      "coral",
      2.2,
      { amp: 0.15 },
    );
  }
  {
    // clamp lamp over the desk, flickering very slightly
    const i = 0.92,
      j = 0.5,
      h = 1.45,
      fl = 0.94 + 0.06 * nseLoop(t, 8, 77);
    pen.line([p(i, j, deskTop), p(i, j, deskTop + h)], "blue", 1.6, {
      amp: 0.2,
    });
    pen.line(
      [p(i, j, deskTop + h), p(i + 0.75, j + 0.25, deskTop + h - 0.18)],
      "blue",
      1.6,
      { amp: 0.2 },
    );
    const [sx, sy] = p(i + 0.75, j + 0.25, deskTop + h - 0.18);
    softLight(
      [
        [sx - 7, sy + 4],
        [sx + 7, sy + 4],
        [sx + 22, sy + 24],
        [sx + 26, sy + 42],
        [sx - 24, sy + 44],
        [sx - 27, sy + 25],
      ],
      0.16 * fl,
    );
    pen.shape(
      [
        [sx - 9, sy + 5],
        [sx + 9, sy + 5],
        [sx + 5, sy - 7],
        [sx - 5, sy - 7],
      ],
      ["yellow", 0.85 * fl],
      { w: 1 },
    );
    pen.dot(sx, sy + 4, 2.6, "yellow", fl);
  }
  // a small plant at the end of the desk
  {
    const i = 4.6,
      j = 1.08,
      [x, y] = p(i, j, deskTop + 0.18);
    pen.box(i - 0.13, j - 0.13, deskTop, 0.26, 0.26, 0.2, {
      ink: "coral",
      tone: 0.6,
      shadow: false,
      w: 0.8,
    });
    const Rp = stream("deskplant");
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + rand(Rp, -1.1, 1.1),
        L = rand(Rp, 9, 17),
        sway = Math.sin(t * HZ(1.3) + k) * 1.1;
      pen.shape(
        pen.leaf(
          [x, y],
          [x + Math.cos(a) * L + sway, y + Math.sin(a) * L],
          rand(Rp, 2.6, 4.2),
        ),
        ["teal", rand(Rp, 0.6, 0.95)],
        { w: 0.7 },
      );
    }
  }

  /* ---------------------------------------------------------
     5. THE DEVELOPER — a 22-second loop, typed out as a timeline
     --------------------------------------------------------- */
  developer(pen, t, 2.1, 2.05, p(2.1, 1.3, deskTop + 0.1));

  /* ---------------------------------------------------------
     6. THE REST OF THE ROOM, back to front by (i+j)
     --------------------------------------------------------- */
  {
    // floor lamp, right corner
    const i = 5.85,
      j = 0.95,
      h = 1.85,
      fl = 0.92 + 0.08 * nseLoop(t, 9, 11);
    pen.glow(i, j, 0, 1.1, "yellow", 0.3 * fl);
    pen.fill(pen.ellipse(i, j, 0, 0.24), "blue", 0.75);
    pen.line([p(i, j, 0), p(i, j, h)], "blue", 1.5, { amp: 0.2 });
    const [sx, sy] = p(i, j, h);
    softLight(
      [
        [sx - 7, sy + 5],
        [sx + 7, sy + 5],
        [sx + 19, sy + 24],
        [sx + 22, sy + 42],
        [sx - 21, sy + 44],
        [sx - 24, sy + 25],
      ],
      0.16 * fl,
    );
    pen.shape(
      [
        [sx - 9, sy + 6],
        [sx + 9, sy + 6],
        [sx + 5, sy - 7],
        [sx - 5, sy - 7],
      ],
      ["coral", 0.8],
      { w: 1 },
    );
  }
  // laundry-on-the-chair energy: a hoodie thrown over a stool
  {
    const i = 5.5,
      j = 2.4,
      [x, y] = p(i, j, 0.45);
    pen.box(i - 0.22, j - 0.22, 0, 0.44, 0.44, 0.45, {
      ink: "coral",
      tone: 0.75,
      w: 0.9,
    });
    pen.shape(pen.blob(x, y - 6, 17, 11, "hoodie", 0.18), ["teal", 0.7], {
      w: 1.1,
    });
    pen.line(
      [
        [x - 10, y - 2],
        [x - 16, y + 9],
        [x - 12, y + 12],
      ],
      "teal",
      2.4,
      { amp: 0.3, tone: 0.85 },
    );
  }
  {
    // big plant, left corner
    const i = 0.5,
      j = 5.3,
      [x, y] = p(i, j, 0.48),
      Rp = stream("bigplant");
    pen.box(i - 0.32, j - 0.32, 0, 0.64, 0.64, 0.5, {
      ink: "yellow",
      tone: 0.6,
    });
    for (let k = 0; k < 13; k++) {
      const a = -Math.PI / 2 + rand(Rp, -1.35, 1.35),
        L = rand(Rp, 20, 44),
        sway = Math.sin(t * HZ(1.1) + k * 0.7) * 2;
      pen.shape(
        pen.leaf(
          [x, y],
          [x + Math.cos(a) * L + sway, y + Math.sin(a) * L],
          rand(Rp, 4.5, 8),
        ),
        ["teal", rand(Rp, 0.55, 0.95)],
        { w: 0.8 },
      );
    }
  }
  {
    // cat asleep on a floor cushion, tail flicking
    const i = 4.85,
      j = 4.1,
      [x, y] = p(i, j, 0);
    pen.box(i - 0.38, j - 0.38, 0, 0.76, 0.76, 0.16, {
      ink: "yellow",
      tone: 0.65,
      w: 0.9,
    });
    const cy = y - 10;
    pen.shape(pen.blob(x, cy, 17, 9, "cat", 0.1), ["blue", 0.85], { w: 1 });
    pen.shape(
      [
        [x + 9, cy - 5],
        [x + 12, cy - 13],
        [x + 15, cy - 5],
      ],
      ["blue", 0.85],
      { w: 0.9 },
    );
    pen.shape(
      [
        [x + 15, cy - 5],
        [x + 18, cy - 12],
        [x + 20, cy - 3],
      ],
      ["blue", 0.85],
      { w: 0.9 },
    );
    const fl = Math.sin(t * HZ(1.7)) * 3;
    pen.line(
      [
        [x - 15, cy + 3],
        [x - 22, cy + 1 + fl],
        [x - 19, cy - 6 + fl],
      ],
      "blue",
      2.4,
      { amp: 0.2, tone: 0.9 },
    );
    pen.dot(x + 16, cy - 4, 1, "yellow");
  }
  {
    // a milk-crate side table with the old laptop still open on it
    const i = 2.05,
      j = 4.55;
    pen.box(i, j, 0, 0.8, 0.7, 0.45, { ink: "coral", tone: 0.62 });
    for (let k = 1; k < 3; k++)
      pen.line(
        [p(i, j + 0.7, 0.1 * k + 0.08), p(i + 0.8, j + 0.7, 0.1 * k + 0.08)],
        "blue",
        0.6,
        { tone: 0.6 },
      );
    pen.box(i + 0.12, j + 0.12, 0.45, 0.5, 0.38, 0.03, {
      ink: "blue",
      tone: 0.8,
      shadow: false,
      w: 0.8,
    });
    {
      const q = [
        p(i + 0.14, j + 0.16, 0.48),
        p(i + 0.6, j + 0.16, 0.48),
        p(i + 0.6, j + 0.16, 0.78),
        p(i + 0.14, j + 0.16, 0.78),
      ];
      pen.fill(q, "blue", 1);
      for (let k = 0; k < 4; k++) {
        const b = 0.72 - k * 0.06,
          r = [
            p(i + 0.18, j + 0.155, b),
            p(i + 0.18 + 0.1 + (k % 3) * 0.08, j + 0.155, b),
            p(i + 0.18 + 0.1 + (k % 3) * 0.08, j + 0.155, b + 0.03),
            p(i + 0.18, j + 0.155, b + 0.03),
          ];
        pen.knock(r, 0.8);
        pen.tint(r, k === 1 ? "coral" : "teal", 0.8);
      }
      pen.line(q, "blue", 0.9, { closed: true });
    }
  }
  // floor clutter — the truth of the room
  {
    const mug = (i, j, ink) => {
      const [x, y] = p(i, j, 0);
      pen.tint(pen.ellipse(i, j, 0.002, 0.15, 0.15, 12), "blue", 0.3);
      pen.shape(
        [
          [x - 5, y],
          [x + 5, y],
          [x + 4, y - 12],
          [x - 4, y - 12],
        ],
        [ink, 0.8],
        { w: 0.9 },
      );
      pen.shape(pen.circle(x, y - 12, 4.4, 12), ["blue", 0.85], { w: 0.7 });
    };
    mug(2.9, 3.9, "yellow");
    mug(2.15, 4.5, "teal");
    const Rs = stream("paper");
    for (let k = 0; k < 6; k++) {
      const i = rand(Rs, 1.1, 4.3),
        j = rand(Rs, 3.2, 5.1),
        s = rand(Rs, 0.28, 0.4);
      pen.shape(pen.floorQuad(i, j, s, s * 1.3, 0.012), ["paper", 0], {
        w: 0.8,
      });
      for (let l = 0; l < 3; l++)
        pen.line(
          [
            p(i + 0.05, j + 0.1 + l * 0.12, 0.013),
            p(i + s - 0.06, j + 0.1 + l * 0.12, 0.013),
          ],
          "blue",
          0.5,
          { tone: 0.55 },
        );
    }
    // sneakers by the door edge
    for (const [i, j, k] of [
      [5.9, 4.8, 0],
      [5.6, 5.4, 1],
    ]) {
      const [x, y] = p(i, j, 0);
      pen.shape(
        smooth(
          [
            [x - 12, y],
            [x + 10, y - 2],
            [x + 12, y - 8],
            [x - 6, y - 9],
            [x - 12, y - 5],
          ],
          true,
          2,
        ),
        [k ? "coral" : "teal", 0.8],
        { w: 1 },
      );
      pen.line(
        [
          [x - 10, y - 1],
          [x + 11, y - 3],
        ],
        "paper",
        1.6,
        { amp: 0.2 },
      );
    }
    // a cardboard box that has never been unpacked, and a skateboard
    pen.box(3.85, 5.35, 0, 0.62, 0.56, 0.44, {
      ink: "yellow",
      tone: 0.42,
      top: 0.28,
    });
    pen.line([p(3.94, 5.43, 0.45), p(4.38, 5.43, 0.45)], "blue", 1, {
      tone: 0.8,
    });
    pen.line([p(3.85, 5.65, 0.24), p(4.47, 5.65, 0.24)], "blue", 0.8, {
      tone: 0.6,
      amp: 0.3,
    });
    {
      const [x, y] = p(1.95, 5.75, 0);
      pen.tint(pen.ellipse(1.95, 5.75, 0.004, 0.55, 0.2, 16), "blue", 0.3);
      pen.shape(
        smooth(
          [
            [x - 26, y - 4],
            [x - 14, y - 8],
            [x + 14, y - 8],
            [x + 26, y - 4],
            [x + 14, y],
            [x - 14, y],
          ],
          true,
          2,
        ),
        ["teal", 0.8],
        { w: 1 },
      );
      pen.dot(x - 17, y + 2, 2.4, "blue", 0.9);
      pen.dot(x + 17, y + 2, 2.4, "blue", 0.9);
    }
    // a power strip with too much plugged into it
    {
      const [x, y] = p(4.55, 3.15, 0);
      pen.shape(
        [
          [x - 14, y],
          [x + 8, y - 7],
          [x + 14, y - 3],
          [x - 8, y + 4],
        ],
        ["paper", 0],
        { w: 0.9 },
      );
      for (let k = 0; k < 3; k++)
        pen.dot(x - 8 + k * 7, y - 1.5 - k * 2.2, 1.5, "coral", 0.9);
    }
    // a stack of books someone means to read
    let z = 0;
    const Rb2 = stream("stack");
    for (let k = 0; k < 4; k++) {
      const th = rand(Rb2, 0.09, 0.14);
      pen.box(
        0.95 + rand(Rb2, -0.05, 0.05),
        4.9 + rand(Rb2, -0.05, 0.05),
        z,
        0.55,
        0.4,
        th,
        {
          ink: pick(Rb2, ["coral", "teal", "yellow"]),
          tone: rand(Rb2, 0.5, 0.85),
          shadow: k === 0,
          w: 0.8,
        },
      );
      z += th;
    }
    {
      const [x, y] = p(1.2, 5.1, z);
      pen.shape(
        [
          [x - 4, y],
          [x + 4, y],
          [x + 3, y - 10],
          [x - 3, y - 10],
        ],
        ["paper", 0],
        { w: 0.8 },
      );
    }
  }

  /* ---------------------------------------------------------
     7. AIR — dust in the lamp light
     --------------------------------------------------------- */
  for (let k = 0; k < 16; k++) {
    const Rd = stream("dust", k),
      i = rand(Rd, 0.6, 5.4),
      j = rand(Rd, 0.4, 3.4),
      base = rand(Rd, 0.5, 2.3);
    const u = ((t * randi(Rd, 1, 2)) / LOOP + Rd()) % 1; // one or two whole cycles
    const [x, y] = p(i, j, base + u * 0.9);
    pen.dot(
      x + Math.sin(t * HZ(0.6) + k) * 4,
      y,
      rand(Rd, 0.8, 1.5),
      "yellow",
      0.35 + 0.3 * Math.sin(t * HZ(2) + k),
    );
  }
}

export { grain, iso, makePen, PAPER_CSS, resetInkCaches, ROOM, drawScene };

/* ============================================================
   THE DEVELOPER
   type (8s) -> shove back off the desk -> a slow two-turn think
   -> roll in -> type again. Everything below is a function of
   one number, u, so the loop is seamless by construction.
   ============================================================ */
const LOOP = 22;
const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
// A body has depth as well as width. Build it from two elliptical cross-sections
// and take the hull, or it collapses to a sliver when he faces along the narrow
// isometric axis. (Monotone chain — the whole fix is these nine lines.)
function hull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [],
    up = [];
  for (const q of P) {
    while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0)
      lo.pop();
    lo.push(q);
  }
  for (let i = P.length - 1; i >= 0; i--) {
    const q = P[i];
    while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0)
      up.pop();
    up.push(q);
  }
  lo.pop();
  up.pop();
  return lo.concat(up);
}

function developer(pen, t, i0, j0, kb) {
  const p = pen.p,
    u = t % LOOP;

  // ---- the timeline ----
  const roll = ss((u - 8) / 1.7) - ss((u - 17.2) / 1.7); // 0 at the desk, 1 shoved back
  const spin = TAU * 2 * ss((u - 9.9) / 6.9); // two slow turns, landing back on 0
  const th = spin + Math.sin(u * HZ(0.7)) * 0.05 * roll; // a little drift while thinking
  const typing = (1 - roll) * (1 - ss((u - 7.4) / 0.6) + ss((u - 18.4) / 0.6));

  // ---- facing: th=0 means facing the desk (away from us, up-right) ----
  const fi = Math.sin(th),
    fj = -Math.cos(th); // forward, in world tiles
  const ri = -fj,
    rj = fi; // his right
  const P2 = (di, dj) => [(di - dj) * 32, (di + dj) * 16]; // a world offset, in screen px
  const F = (m) => P2(fi * m, fj * m),
    R = (m) => P2(ri * m, rj * m);
  const at = (base, ...offs) =>
    offs.reduce((q, o) => [q[0] + o[0], q[1] + o[1]], base.slice());
  const fs = F(1),
    facingUs = fs[1] > 0; // is his face toward the camera?

  const ci = i0 + roll * 0.14,
    cj = j0 + roll * 0.95;
  const [bx, by] = p(ci, cj, 0);
  const seatZ = 0.47,
    breathe = Math.sin(t * HZ(1.5)) * 0.5;
  const seat = [bx, by - seatZ * 32];
  const hip = [bx, by - seatZ * 32 - 2];
  const shY = hip[1] - 30 + breathe + roll * 2.5; // he sinks back a little when thinking
  const sh = [bx + F(0.09 * roll)[0], shY];

  // ---- coral over yellow makes an amber that isn't on any of the four drums,
  //      and it is the only warm-light thing in a room of coral, teal and navy ----
  const amber = (P, o = {}) => {
    pen.knock(P);
    pen.tint(P, "yellow", o.a ?? 1);
    pen.tint(P, "coral", o.b ?? 0.3);
  };
  const amberLine = (P, w, o = {}) => {
    pen.line(P, "blue", w + 0.9, { ...o, tone: 0.7 });
    pen.line(P, "yellow", w, { ...o, tone: 1 });
    pen.line(P, "coral", w, { ...o, tone: 0.45 });
  };

  pen.tint(pen.ellipse(ci, cj, 0.005, 0.48, 0.42, 16), "blue", 0.3);

  // ---- chair: base and casters turn with him, which is what sells the spin ----
  for (let k = 0; k < 5; k++) {
    const a = th + (k * TAU) / 5,
      e = at([bx, by - 2], P2(Math.sin(a) * 0.46, -Math.cos(a) * 0.46));
    pen.line([[bx, by - 3], e], "blue", 2.2, { amp: 0.2 });
    pen.dot(e[0], e[1] + 1, 2.1, "blue", 0.9);
  }
  pen.line(
    [
      [bx, by - 3],
      [bx, seat[1] + 2],
    ],
    "blue",
    2.8,
    { amp: 0.15 },
  );

  const seatQ = [
    at(seat, R(0.3), F(0.27)),
    at(seat, R(-0.3), F(0.27)),
    at(seat, R(-0.3), F(-0.27)),
    at(seat, R(0.3), F(-0.27)),
  ];
  pen.shape(smooth(seatQ, true, 2), ["blue", 0.55], { w: 1 });

  // ---- legs: tucked under the desk while typing, stuck out while he drifts ----
  const reach = 0.24 + roll * 0.3;
  for (const side of [-1, 1]) {
    const knee = at(hip, R(0.17 * side), F(reach), [0, 4]),
      foot = at(knee, F(reach * 0.85), [0, 10 - roll * 3]);
    pen.line([at(hip, R(0.17 * side)), knee, foot], "blue", 3.4, {
      amp: 0.2,
      tone: 0.95,
    });
    pen.shape(
      smooth(
        [
          at(foot, [-6, -3]),
          at(foot, [7, -4]),
          at(foot, [8, 2]),
          at(foot, [-6, 2]),
        ],
        true,
        2,
      ),
      ["blue", 0.85],
      { w: 0.9 },
    );
    pen.line([at(foot, [-5, 1.6]), at(foot, [7, 0.4])], "paper", 1.8, {
      amp: 0.15,
    });
  }

  // ---- hood bunched at the back of his neck ----
  amber(
    smooth(
      [
        at(sh, F(-0.3), R(0.2), [0, 2]),
        at(sh, F(-0.4), [0, -2]),
        at(sh, F(-0.3), R(-0.2), [0, 2]),
        at(sh, F(-0.06), [0, 5]),
      ],
      true,
      3,
    ),
    { a: 1, b: 0.55 },
  );

  // ---- torso ----
  const ring = (c, rx, ry, dy) =>
    Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * TAU;
      return at(c, R(rx * Math.cos(a)), F(ry * Math.sin(a)), [0, dy]);
    });
  const torso = smooth(
    hull([...ring(hip, 0.4, 0.24, 4), ...ring(sh, 0.42, 0.25, 1)]),
    true,
    2,
  );
  amber(torso);
  pen.line(torso, "blue", 1.3, { closed: true, tone: 0.9 });
  pen.line(
    [at(sh, R(0.36), [0, 13]), at(sh, R(-0.36), [0, 13])],
    "coral",
    3.4,
    { amp: 0.25, tone: 0.95 },
  ); // chest stripe
  if (facingUs) {
    // kangaroo pocket + drawstrings, only when we can see them
    const pk = [
      at(hip, R(0.26), [0, -4]),
      at(hip, R(-0.26), [0, -4]),
      at(hip, R(-0.2), [0, 3]),
      at(hip, R(0.2), [0, 3]),
    ];
    pen.line(pk, "blue", 0.9, { closed: true, tone: 0.75, amp: 0.3 });
    for (const sdx of [-0.1, 0.1])
      pen.line(
        [at(sh, R(sdx), [0, 2]), at(sh, R(sdx * 1.4), [0, 13])],
        "blue",
        1.2,
        { amp: 0.3, tone: 0.8 },
      );
  }

  // ---- arms: keyboard -> chin, cross-faded by `roll` ----
  const head = at(sh, F(0.02), [0, -10]);
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const tap = Math.sin(t * HZ(9)) * 1.3 * typing;
  const kbR = [kb[0] + 7, kb[1] - tap],
    kbL = [kb[0] - 6, kb[1] + tap];
  const chin = at(head, F(0.2), [0, 4]),
    lap = at(hip, F(0.34), R(-0.22), [0, -2]);
  const handR = mix(kbR, chin, roll),
    handL = mix(kbL, lap, roll);
  const arm = (side, hand) => {
    const s0 = at(sh, R(0.44 * side), [0, 4]);
    const elbow = mix(s0, hand, 0.5),
      bend = at(elbow, R(0.14 * side), [0, 5]);
    amberLine([s0, bend, hand], 3.6, { amp: 0.2 });
    pen.line([mix(bend, hand, 0.72), mix(bend, hand, 0.94)], "coral", 3.8, {
      amp: 0.1,
      tone: 0.95,
    }); // cuff
    pen.dot(hand[0], hand[1], 3, "coral", 0.3);
  };
  const order = R(1)[1] > 0 ? [-1, 1] : [1, -1]; // far arm first
  arm(order[0], order[0] < 0 ? handL : handR);

  // ---- head ----
  const hr = 9.2;
  pen.fill(pen.circle(head[0], head[1], hr, 18), "blue", 0.95); // all hair to begin with
  pen.line(
    [
      [head[0] - 2, head[1] - hr - 1],
      [head[0] + 1, head[1] - hr - 5],
      [head[0] + 4, head[1] - hr],
    ],
    "blue",
    1.2,
    { amp: 0.4 },
  );
  const faceAmt = clamp(fs[1] / 22, 0, 1); // 0 facing away, 1 facing us
  if (faceAmt > 0.12) {
    // the face swings round with him
    const fc = at(head, [fs[0] * 0.2, fs[1] * 0.14 + 1.6]);
    const disc = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      return [
        fc[0] + Math.cos(a) * hr * 0.66 * (0.55 + 0.45 * faceAmt),
        fc[1] + Math.sin(a) * hr * 0.72,
      ];
    });
    pen.fill(disc, "coral", 0.26);
    pen.line(disc, "blue", 0.7, { closed: true, tone: 0.5, amp: 0.2 });
    if (faceAmt > 0.3) {
      const blink = t % (LOOP / 5) > LOOP / 5 - 0.15 ? 0.3 : 1;
      for (const m of [-0.095, 0.095]) {
        const e = at(fc, R(m), [0, -1.5]);
        pen.line(
          [
            [e[0] - 1.9, e[1]],
            [e[0] + 1.9, e[1]],
          ],
          "blue",
          2.1 * blink,
          { amp: 0 },
        );
      }
      const mo = at(fc, [0, 3.8]);
      pen.line(
        [
          [mo[0] - 2.2, mo[1]],
          [mo[0] + 2.2, mo[1] - 0.6],
        ],
        "blue",
        1,
        { amp: 0.2 },
      );
    }
  }
  pen.line(pen.circle(head[0], head[1], hr, 18), "blue", 1.2, {
    closed: true,
    amp: 0.2,
  });
  {
    const n = at(sh, [0, -2]);
    pen.line(
      [
        [n[0] - 3, n[1]],
        [n[0] + 3, n[1]],
      ],
      "coral",
      2.6,
      { amp: 0.1, tone: 0.35 },
    );
  } // neck
  {
    // headphones — the cups slide round his head as he turns
    const band = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI + (k / 12) * Math.PI,
        e = at(head, R(Math.cos(a) * 0.3), [0, Math.sin(a) * hr * 1.15]);
      band.push(e);
    }
    pen.line(band, "coral", 2.2, { amp: 0.15 });
    for (const m of [-0.3, 0.3]) {
      const c = at(head, R(m), [0, 1.5]);
      pen.shape(pen.circle(c[0], c[1], 3.2, 10), ["coral", 0.95], { w: 0.8 });
    }
  }

  arm(order[1], order[1] < 0 ? handL : handR); // near arm over the torso

  // ---- backrest: only in front of him when his back is toward us ----
  const bo = F(-0.36),
    backNear = bo[1] > 0;
  const drawBack = () => {
    // a mesh back: you can see him through it
    const c = at(seat, bo, [0, -4]),
      h = 26;
    const q = [
      at(c, R(0.3), F(0.05)),
      at(c, R(-0.3), F(0.05)),
      at(c, R(-0.26), F(-0.05), [0, -h]),
      at(c, R(0.26), F(-0.05), [0, -h]),
    ];
    pen.tint(q, "blue", 0.1);
    for (let k = 1; k < 5; k++) {
      const y = (-h * k) / 5,
        m = 0.3 - (0.04 * k) / 5;
      pen.line([at(c, R(m), [0, y]), at(c, R(-m), [0, y])], "blue", 0.6, {
        tone: 0.55,
      });
    }
    for (const m of [-0.15, 0, 0.15])
      pen.line([at(c, R(m)), at(c, R(m * 0.88), [0, -h])], "blue", 0.6, {
        tone: 0.42,
      });
    pen.line(q, "blue", 1.4, { closed: true });
    pen.line([at(c, R(0.3), [0, -h]), at(c, R(-0.3), [0, -h])], "blue", 2.2, {
      amp: 0.2,
    }); // head rest bar
  };
  if (backNear) drawBack();

  // ---- armrests ----
  for (const side of [-1, 1]) {
    const a0 = at(seat, R(0.36 * side), F(-0.18), [0, -6]),
      a1 = at(a0, F(0.42));
    pen.line([a0, a1], "blue", 2.6, { amp: 0.15, tone: 0.9 });
  }
  if (!backNear) drawBack();

  // ---- a thought bubble while he spins ----
  const think = ss((u - 10.6) / 1.2) - ss((u - 16.2) / 1.2);
  if (think > 0.02) {
    const o = at(head, [14, -16]);
    for (let k = 0; k < 3; k++) {
      const c = [o[0] + k * 6 + Math.sin(t * HZ(1.2) + k) * 1.5, o[1] - k * 7],
        rr = (1.4 + k * 1.6) * think;
      pen.shape(pen.circle(c[0], c[1], rr, 12), ["paper", 0], { w: 0.9 });
    }
    if (think > 0.6) {
      const c = [o[0] + 22, o[1] - 20];
      pen.dot(c[0], c[1] - 3, 1.5, "coral", 0.9);
      pen.line(
        [
          [c[0], c[1] + 3],
          [c[0], c[1] + 6],
        ],
        "coral",
        1.2,
        { amp: 0.2 },
      );
    }
  }
}
