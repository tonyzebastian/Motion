/* eslint-disable */
// @ts-nocheck
//
// Riso engine lineage:
// - Riso printing primitives adapted from Ishaan Kalra's creative-skills,
//   MIT License, Copyright (c) 2026 Ishaan Kalra.
// - Inspired by Kevin Ngo's "a small light, room by room".
// - Bouquet scene, sprite cache, and Remotion host integration are local work.
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
   A STROKE ALPHABET
   Each glyph is a list of polylines on a unit box: x 0..1 across,
   y 0..1 from cap height down to baseline. Drawn with pen.line, so
   the wobble does the handwriting for us.
   ============================================================ */
const GLYPHS = {
  A: {
    w: 0.95,
    s: [
      [
        [0, 1],
        [0.5, 0],
        [1, 1],
      ],
      [
        [0.18, 0.64],
        [0.82, 0.64],
      ],
    ],
  },
  B: {
    w: 0.82,
    s: [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [0.6, 0],
        [0.8, 0.24],
        [0.6, 0.48],
        [0, 0.48],
      ],
      [
        [0, 0.48],
        [0.66, 0.5],
        [0.86, 0.75],
        [0.64, 1],
        [0, 1],
      ],
    ],
  },
  C: {
    w: 0.88,
    s: [
      [
        [0.94, 0.18],
        [0.7, 0.02],
        [0.3, 0.04],
        [0.06, 0.35],
        [0.07, 0.72],
        [0.34, 0.98],
        [0.72, 0.98],
        [0.95, 0.82],
      ],
    ],
  },
  D: {
    w: 0.86,
    s: [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [0.52, 0.02],
        [0.86, 0.3],
        [0.86, 0.7],
        [0.52, 0.99],
        [0, 1],
      ],
    ],
  },
  E: {
    w: 0.75,
    s: [
      [
        [0.88, 0.02],
        [0, 0],
        [0, 1],
        [0.9, 0.98],
      ],
      [
        [0, 0.5],
        [0.66, 0.49],
      ],
    ],
  },
  F: {
    w: 0.72,
    s: [
      [
        [0.88, 0.02],
        [0, 0],
        [0, 1],
      ],
      [
        [0, 0.5],
        [0.64, 0.49],
      ],
    ],
  },
  G: {
    w: 0.92,
    s: [
      [
        [0.94, 0.18],
        [0.7, 0.02],
        [0.3, 0.04],
        [0.06, 0.35],
        [0.07, 0.72],
        [0.34, 0.98],
        [0.74, 0.97],
        [0.94, 0.78],
        [0.94, 0.56],
        [0.58, 0.56],
      ],
    ],
  },
  H: {
    w: 0.88,
    s: [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [0.96, 0.01],
        [0.96, 1],
      ],
      [
        [0, 0.5],
        [0.96, 0.48],
      ],
    ],
  },
  I: {
    w: 0.3,
    s: [
      [
        [0.5, 0],
        [0.5, 1],
      ],
    ],
  },
  J: {
    w: 0.7,
    s: [
      [
        [0.72, 0],
        [0.7, 0.78],
        [0.48, 0.99],
        [0.18, 0.94],
        [0.06, 0.74],
      ],
    ],
  },
  K: {
    w: 0.84,
    s: [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [0.9, 0.02],
        [0, 0.56],
      ],
      [
        [0.28, 0.4],
        [0.94, 1],
      ],
    ],
  },
  L: {
    w: 0.68,
    s: [
      [
        [0, 0],
        [0, 1],
        [0.82, 0.97],
      ],
    ],
  },
  M: {
    w: 1.05,
    s: [
      [
        [0, 1],
        [0.04, 0],
        [0.5, 0.62],
        [0.96, 0],
        [1, 1],
      ],
    ],
  },
  N: {
    w: 0.92,
    s: [
      [
        [0, 1],
        [0.02, 0],
        [0.94, 1],
        [0.96, 0.02],
      ],
    ],
  },
  O: {
    w: 0.95,
    s: [
      [
        [0.5, 0],
        [0.82, 0.1],
        [0.97, 0.42],
        [0.9, 0.8],
        [0.56, 1],
        [0.2, 0.93],
        [0.03, 0.6],
        [0.1, 0.22],
        [0.5, 0],
      ],
    ],
  },
  P: {
    w: 0.78,
    s: [
      [
        [0, 1],
        [0, 0],
        [0.6, 0.02],
        [0.82, 0.26],
        [0.6, 0.52],
        [0, 0.5],
      ],
    ],
  },
  Q: {
    w: 0.95,
    s: [
      [
        [0.5, 0],
        [0.82, 0.1],
        [0.97, 0.42],
        [0.9, 0.8],
        [0.56, 1],
        [0.2, 0.93],
        [0.03, 0.6],
        [0.1, 0.22],
        [0.5, 0],
      ],
      [
        [0.62, 0.74],
        [1, 1.12],
      ],
    ],
  },
  R: {
    w: 0.86,
    s: [
      [
        [0, 1],
        [0, 0],
        [0.62, 0.02],
        [0.84, 0.26],
        [0.6, 0.52],
        [0, 0.5],
      ],
      [
        [0.38, 0.5],
        [0.92, 1],
      ],
    ],
  },
  S: {
    w: 0.8,
    s: [
      [
        [0.9, 0.14],
        [0.58, 0],
        [0.22, 0.06],
        [0.08, 0.28],
        [0.32, 0.46],
        [0.66, 0.56],
        [0.88, 0.74],
        [0.76, 0.94],
        [0.38, 1],
        [0.06, 0.84],
      ],
    ],
  },
  T: {
    w: 0.86,
    s: [
      [
        [0, 0.02],
        [0.98, 0],
      ],
      [
        [0.5, 0],
        [0.5, 1],
      ],
    ],
  },
  U: {
    w: 0.9,
    s: [
      [
        [0, 0],
        [0.02, 0.7],
        [0.22, 0.96],
        [0.52, 1],
        [0.82, 0.94],
        [0.96, 0.68],
        [0.96, 0.01],
      ],
    ],
  },
  V: {
    w: 0.92,
    s: [
      [
        [0, 0],
        [0.48, 1],
        [0.96, 0],
      ],
    ],
  },
  W: {
    w: 1.15,
    s: [
      [
        [0, 0],
        [0.22, 1],
        [0.55, 0.34],
        [0.84, 1],
        [1.08, 0.02],
      ],
    ],
  },
  X: {
    w: 0.86,
    s: [
      [
        [0, 0],
        [0.92, 1],
      ],
      [
        [0.92, 0],
        [0, 1],
      ],
    ],
  },
  Y: {
    w: 0.88,
    s: [
      [
        [0, 0],
        [0.46, 0.52],
        [0.92, 0.01],
      ],
      [
        [0.46, 0.52],
        [0.48, 1],
      ],
    ],
  },
  Z: {
    w: 0.82,
    s: [
      [
        [0, 0.02],
        [0.9, 0],
        [0.04, 0.98],
        [0.9, 1],
      ],
    ],
  },
  "'": {
    w: 0.24,
    s: [
      [
        [0.5, -0.02],
        [0.36, 0.3],
      ],
    ],
  },
  ",": {
    w: 0.24,
    s: [
      [
        [0.5, 0.9],
        [0.34, 1.2],
      ],
    ],
  },
  ".": {
    w: 0.24,
    s: [
      [
        [0.48, 0.98],
        [0.52, 1],
      ],
    ],
  },
  "!": {
    w: 0.3,
    s: [
      [
        [0.5, 0],
        [0.46, 0.7],
      ],
      [
        [0.48, 0.94],
        [0.5, 0.98],
      ],
    ],
  },
  "?": {
    w: 0.7,
    s: [
      [
        [0.08, 0.2],
        [0.34, 0],
        [0.62, 0.08],
        [0.66, 0.34],
        [0.38, 0.5],
        [0.36, 0.68],
      ],
      [
        [0.36, 0.94],
        [0.38, 0.98],
      ],
    ],
  },
  "-": {
    w: 0.6,
    s: [
      [
        [0.06, 0.5],
        [0.54, 0.49],
      ],
    ],
  },
  " ": { w: 0.5, s: [] },
};

/* width of a string at a given cap height, including tracking */
function textWidth(str, cap, track, cond = 1) {
  let w = 0;
  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[" "];
    w += g.w * cap * cond + track * (0.45 + 0.55 * g.w);
  }
  return w - track;
}

/* draw a line of hand-lettering centred on cx, baseline at by */
function letter(pen, str, cx, by, cap, o = {}) {
  const track = o.track ?? cap * 0.28,
    ink = o.ink || "blue",
    wid = o.w ?? 2.4,
    cond = o.cond ?? 1;
  let x = cx - textWidth(str, cap, track, cond) / 2;
  let k = 0;
  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[" "];
    const R = stream("ltr", str, k);
    const dy = rand(R, -0.035, 0.035) * cap; // letters never sit quite on the line
    const sc = 1 + rand(R, -0.04, 0.04),
      sl = rand(R, -0.05, 0.05);
    for (const poly of g.s) {
      const P = poly.map(([a, b]) => [
        x + (a + b * sl) * cap * sc * cond,
        by - cap + b * cap * sc + dy,
      ]);
      pen.line(P, ink, wid, { amp: cap * 0.035, tone: o.tone ?? 1 });
    }
    x += g.w * cap * cond + track * (0.45 + 0.55 * g.w);
    k++;
  }
}
("use strict");
/* ============================================================
   A man carrying more flowers than he can see over.

   Flat, front-on. The riso pen applies as always: every fill is paper
   knocked out and an ink screened over it, and overlaps multiply.
     solid()  knock first -> an opaque object (the figure)
     wash()   tint only   -> overlaps darken, like petals over petals

   ANIMATION. Redrawing the whole illustration costs about 200ms, which is
   hopeless per frame, so the piece is split into three layers that are
   rendered once into offscreen canvases:
       BASE   the figure, everything behind the bunch
       BUNCH  whole stems + all the flowers
       FRONT  fingers, head, hat
   Per frame only the cheap things are drawn live — butterflies and falling
   leaves — and the wind is a rotation of the BUNCH layer about the fist.
   ============================================================ */
const CW = 1200,
  CH = 1500; // 4:5 — the tallest ratio X shows uncropped in the timeline
const ART = { k: 1.22, dx: 6, dy: -137 }; // the artwork is authored in a 1000x1280 space
const BQ = { dx: -50, dy: 24 }; // the bouquet around its own origin
const HOLD_TOP = [500, 716],
  HOLD_BOT = [546, 930];
const FIST = [HOLD_BOT[0], HOLD_BOT[1] + 2];

const FX = 640,
  FEET = 1148;
const ELB_N = [FX - 80, 876],
  WRI_N = [FX - 88, 916];
const ELB_F = [FX + 62, 876],
  WRI_F = [FX + 60, 924];
const FX0 = HOLD_BOT[0] - 2,
  FY0 = HOLD_BOT[1] + 8;
const HX = FX - 4;
const MC = [458, 594],
  MRX = 162,
  MRY = 232; // the mass, in the bouquet's own space
const NECK = [500, 700];

/* Every motion below is a harmonic of this, so the whole piece returns to
   exactly where it began. */
const LOOP = 16;

function tools(pen) {
  const wash = (P, ink, tone) => pen.tint(P, ink, tone);
  const solid = (P, ink, tone) => pen.fill(P, ink, tone);
  const petal = (cx, cy, a, len, wid, curve = 0) => {
    const tipX = cx + Math.cos(a) * len,
      tipY = cy + Math.sin(a) * len;
    const mx = cx + Math.cos(a) * len * 0.5 - Math.sin(a) * curve,
      my = cy + Math.sin(a) * len * 0.5 + Math.cos(a) * curve;
    const nx = -Math.sin(a) * wid,
      ny = Math.cos(a) * wid;
    return smooth(
      [
        [cx, cy],
        [mx + nx, my + ny],
        [tipX, tipY],
        [mx - nx, my - ny],
      ],
      true,
      3,
    );
  };
  const skin = (P, a = 0.3, b = 0.34) => {
    pen.knock(P);
    wash(P, "coral", a);
    wash(P, "yellow", b);
  };
  const knit = (P, c = 0.52) => {
    pen.knock(P);
    wash(P, "yellow", 1);
    wash(P, "coral", c);
    wash(P, "blue", 0.08);
  };
  const capsule = (a, b, r) => {
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
  const taper = (a, b, r0, r1) => {
    // a limb narrows along its length
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
  const ribbon = (P, r0, r1, wob) => {
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
      const r = lerp(r0, r1, u) * (1 + 0.16 * Math.sin(u * 11 + wob)); // stems are not extruded tubes
      A.push([Q[i][0] + nx * r, Q[i][1] + ny * r]);
      B.push([Q[i][0] - nx * r, Q[i][1] - ny * r]);
    }
    return A.concat(B.reverse());
  };
  const art = () => {
    pen.ctx.save();
    pen.ctx.translate(ART.dx, ART.dy);
    pen.ctx.scale(ART.k, ART.k);
  };
  const done = () => pen.ctx.restore();
  return { wash, solid, petal, skin, knit, capsule, taper, ribbon, art, done };
}

/* heads: points inside the mass, biased toward the middle. Computed once. */
let HEADS = null;
function headPoints() {
  if (HEADS) return HEADS;
  const RH = stream("heads"),
    h = [];
  for (let k = 0; k < 74; k++) {
    const a = RH() * TAU,
      rr = Math.sqrt(rand(RH, 0.03, 1));
    let x = MC[0] + Math.cos(a) * MRX * rr,
      y = MC[1] + Math.sin(a) * MRY * rr;
    y = Math.min(y, MC[1] + 160);
    if (y > MC[1]) {
      x -= (y - MC[1]) * 0.08;
      x += (((MC[0] - x) * (y - MC[1])) / MRY) * 0.8;
    }
    h.push([x, y]);
  }
  h.sort((p, q) => q[1] - p[1]);
  return (HEADS = h);
}

/* THE WIND.
   The bunch is not one object. It is split into BANDS shells by distance
   from the fist, each baked into its own layer and each drifting on its own
   phase, so the top of the bouquet leads and the flowers near his hand
   barely move. Rotating a single baked layer was the old approach and it
   shimmered: rotating a halftone bitmap resamples the dots every frame.
   These offsets are whole device pixels, so a blit is a straight copy and
   nothing resamples at all. */
/* THE BUNCH MOVES ELEMENT BY ELEMENT.

   Three approaches were tried before this one:
     1. rotate the whole baked layer — it shimmered, because rotating a
        halftone bitmap resamples the dots every frame;
     2. bake the flowers into separate layers by distance — this changed the
        order they were painted in, so washes that belonged under a knockout
        landed over it and the bunch went dark;
     3. blit one correct bake in horizontal slices, each sheared — no
        resampling, but it reads as rows of pixels sliding, which it is.

   What works: cache EVERY flower, leaf and stem as its own little sprite,
   and composite each with the blend mode it was originally painted with —
   'multiply' for a pure wash, 'source-over' for anything that knocked out to
   paper first. Blitted in the original order with no offsets this
   reconstructs the painting exactly; with an offset per sprite each element
   drifts on its own. Offsets are whole pixels, so nothing resamples. */

/* the wind field, sampled at a point: a coherent gust that grows with
   distance from his fist, plus a small flutter unique to each element */
function windAt(ax, ay, t) {
  const th = (TAU * t) / LOOP;
  const d = Math.hypot(ax - FIST[0], ay - FIST[1]);
  const v = clamp((d - 130) / 440, 0, 1),
    a = Math.pow(v, 1.4);
  const ph = hash2(Math.round(ax), Math.round(ay), 7) * TAU;
  return [
    a *
      (7.5 * Math.sin(th - v * 0.55) +
        3.2 * Math.sin(2 * th + 1.1 - v * 0.35) +
        2.4 * Math.sin(2 * th + ph)),
    a * (2.0 * Math.sin(2 * th + 0.7) + 1.6 * Math.sin(th + ph)),
  ];
}

/* Element boundaries come from riso.js: element(x, y) / endElement() are
   no-ops until captureSprites() runs a capture over drawBunch. */

/* the offset callback captureSprites/blitSprites want: device px in, device px
   out, with the wind field evaluated in the artwork's own units */
function bunchOffset(S, t) {
  return (ax, ay) => {
    const [dx, dy] = windAt(
      (ax / S - ART.dx) / ART.k,
      (ay / S - ART.dy) / ART.k,
      t,
    );
    return [dx * ART.k * S, dy * ART.k * S];
  };
}

/* ============================================================
   LAYER 1 — the figure, everything behind the bunch
   ============================================================ */
function drawBase(pen) {
  const T = tools(pen),
    { wash, solid, petal, skin, knit, capsule, taper } = T;
  T.art();
  wash(pen.blob(FX - 30, FEET + 6, 86, 12, "shadow", 0.25, 12), "blue", 0.2);
  wash(pen.blob(FX - 20, FEET + 4, 52, 7, "shadow2", 0.3, 10), "blue", 0.18);

  // trousers
  const legs = smooth(
    [
      [FX - 42, 920],
      [FX + 36, 918],
      [FX + 40, 1030],
      [FX + 30, 1136],
      [FX - 2, 1140],
      [FX - 4, 1040],
      [FX - 18, 1042],
      [FX - 30, 1138],
      [FX - 62, 1134],
      [FX - 54, 1010],
    ],
    true,
    3,
  );
  solid(legs, "blue", 0.82);
  pen.line(legs, "blue", 1.6, { closed: true, tone: 1, amp: 1 });
  pen.line(
    [
      [FX - 12, 960],
      [FX - 8, 1036],
    ],
    "blue",
    1,
    { tone: 1, amp: 1.2 },
  );
  wash(pen.blob(FX + 14, 1000, 11, 9, "patch", 0.2, 8), "coral", 0.7); // a patch
  wash(pen.blob(FX - 40, 1072, 8, 7, "patch2", 0.2, 8), "coral", 0.6);

  // boots
  for (const B of [
    smooth(
      [
        [FX - 66, 1124],
        [FX - 24, 1126],
        [FX - 18, 1146],
        [FX - 80, 1148],
        [FX - 88, 1134],
      ],
      true,
      2,
    ),
    smooth(
      [
        [FX - 2, 1126],
        [FX + 34, 1124],
        [FX + 42, 1138],
        [FX + 38, 1150],
        [FX - 4, 1148],
      ],
      true,
      2,
    ),
  ]) {
    pen.knock(B);
    wash(B, "coral", 0.9);
    wash(B, "blue", 0.62); // coral under blue is a boot brown
    pen.line(B, "blue", 1.4, { closed: true, tone: 0.95, amp: 0.8 });
  }
  for (const b of [
    [-52, 1148],
    [16, 1150],
  ])
    pen.line(
      [
        [FX + b[0] - 26, b[1]],
        [FX + b[0] + 22, b[1] - 1],
      ],
      "blue",
      2,
      { tone: 0.9, amp: 0.6 },
    );

  /* arms before the body, so the sweater covers each shoulder end and the joint disappears */
  const armPiece = (a, b, r0, r1, tone) => {
    const P = taper(a, b, r0, r1);
    knit(P, tone);
    pen.line(P, "blue", 1.5, { closed: true, tone: 0.95, amp: 1 });
  };

  armPiece([FX - 32, 818], ELB_N, 16, 11.5, 0.56);
  armPiece(ELB_N, WRI_N, 11.5, 9.5, 0.66);
  armPiece([FX + 20, 814], ELB_F, 16, 11.5, 0.58);
  armPiece(ELB_F, WRI_F, 11, 7.5, 0.66);

  /* ---- neck, then the sweater over the shoulders ---- */
  {
    const neck = smooth(
      [
        [FX - 16, 782],
        [FX + 8, 780],
        [FX + 10, 812],
        [FX - 18, 814],
      ],
      true,
      2,
    );
    skin(neck, 0.24, 0.36);
    wash(neck, "blue", 0.16);
    pen.line(neck, "blue", 1.1, { closed: true, tone: 0.7, amp: 0.8 });
  }

  const body = smooth(
    [
      [FX - 46, 808],
      [FX - 32, 792],
      [FX + 12, 790],
      [FX + 30, 804],
      [FX + 48, 862],
      [FX + 46, 924],
      [FX + 4, 934],
      [FX - 24, 926],
      [FX - 52, 946],
      [FX - 62, 882],
    ],
    true,
    3,
  );
  knit(body);
  pen.line(body, "blue", 1.7, { closed: true, tone: 0.95, amp: 1 });
  for (let k = -3; k <= 3; k++)
    pen.line(
      [
        [FX + k * 13 + 2, 812],
        [FX + k * 13 - 2, 926],
      ],
      "blue",
      0.9,
      { tone: 0.3, amp: 1.2 },
    );
  {
    const neckline = [
      [FX - 24, 793],
      [FX - 17, 805],
      [FX - 2, 809],
      [FX + 13, 806],
      [FX + 20, 792],
    ];
    pen.line(neckline, "blue", 1.6, { tone: 0.95, amp: 0.8 });
    pen.line(
      neckline.map(([x, y]) => [x + (x - FX + 2) * 0.07, y + 6]),
      "blue",
      1,
      { tone: 0.6, amp: 0.9 },
    );
  }

  /* ---- the grip, built in three layers:
       palm behind  ->  stems  ->  thumb and two fingers in front.
     A real fist has stems passing across the palm and only the curled
     fingers on top; drawing the whole hand over the bundle is what made
     it look like a mitt stuck on the front. */
  for (const W of [WRI_N, WRI_F])
    pen.line(
      [
        [W[0] - 8, W[1] - 4],
        [W[0] + 8, W[1] - 2],
      ],
      "blue",
      1.1,
      { tone: 0.7, amp: 0.7 },
    );

  {
    const palm = smooth(
      [
        [FX0 - 18, FY0 - 14],
        [FX0 - 5, FY0 - 18],
        [FX0 + 12, FY0 - 15],
        [FX0 + 18, FY0 - 2],
        [FX0 + 14, FY0 + 11],
        [FX0 - 3, FY0 + 16],
        [FX0 - 16, FY0 + 10],
        [FX0 - 20, FY0 - 2],
      ],
      true,
      3,
    );
    skin(palm, 0.26, 0.38);
    pen.line(palm, "blue", 1.3, { closed: true, tone: 0.85, amp: 0.9 });
  }

  T.done();
}

/* ============================================================
   LAYER 2 — the bunch: whole stems, then the flowers over them.
   This is the layer the wind rotates.
   ============================================================ */
function drawBunch(pen) {
  const T = tools(pen),
    { wash, solid, petal, ribbon } = T;
  const heads = headPoints();
  T.art();

  /* whole stems: each starts at a flower head high inside the bunch, runs
     the length of the bouquet, closes into the fist and carries on to its
     cut end. One ribbon each — nothing bolted on at the bottom. */
  {
    const RB = stream("wholestems");
    for (let k = 0; k < 8; k++) {
      element(FIST[0], FIST[1]);
      const hx = MC[0] + BQ.dx + rand(RB, -MRX * 0.5, MRX * 0.5);
      const hy = MC[1] + BQ.dy + rand(RB, -MRY * 0.8, MRY * 0.1);
      const H = [hx, hy],
        F = [FIST[0] + rand(RB, -6, 6), FIST[1] + rand(RB, -4, 4)];
      const C = [F[0] + rand(RB, -13, 13), F[1] + rand(RB, 40, 74)];

      // the path: one long bow, a shorter counter-bow, and a little wander on
      // top of both. Ends are pinned, so every stem still meets the flowers
      // and the fist exactly.
      const dx = F[0] - H[0],
        dy = F[1] - H[1],
        d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d,
        ny = dx / d;
      const bow = rand(RB, -26, 26),
        counter = rand(RB, -13, 13),
        sd = Math.floor(RB() * 1e5);
      const P = [];
      for (let i = 0; i <= 9; i++) {
        const u = i / 9;
        const off =
          Math.sin(u * Math.PI) * bow +
          Math.sin(u * Math.PI * 2.4 + 1.1) * counter +
          noise(u * 5, sd * 0.01, sd) * 4;
        P.push([
          lerp(H[0], F[0], u) + nx * off,
          lerp(H[1], F[1], u) + ny * off,
        ]);
      }
      for (let i = 1; i <= 3; i++) {
        // on past the fist to the cut end
        const u = i / 3;
        P.push([lerp(F[0], C[0], u) + rand(RB, -3, 3), lerp(F[1], C[1], u)]);
      }

      const tn = rand(RB, 0.5, 0.85);
      const S = ribbon(
        P,
        rand(RB, 0.9, 1.4),
        rand(RB, 2, 2.9),
        rand(RB, 0, 6.2),
      );
      pen.knock(S);
      wash(S, "teal", tn);
      wash(S, "yellow", tn * 0.55);
      pen.line(S, "teal", 0.7, { closed: true, tone: 0.9, amp: 1.1 });

      // a leaf or two clasping the stem partway down
      if (RB() < 0.55) {
        const i0 = randi(RB, 2, 6),
          at = P[i0],
          nxt = P[i0 + 1];
        const ang =
          Math.atan2(nxt[1] - at[1], nxt[0] - at[0]) +
          (RB() < 0.5 ? -1 : 1) * rand(RB, 1.5, 2.3);
        const L = petal(
          at[0],
          at[1],
          ang,
          rand(RB, 26, 48),
          rand(RB, 5, 9),
          rand(RB, -7, 7),
        );
        pen.knock(L);
        wash(L, "teal", tn + 0.05);
        wash(L, "yellow", tn * 0.5);
        pen.line(L, "teal", 0.7, { closed: true, tone: 0.85, amp: 1 });
      }
      endElement();
    }
  }

  pen.ctx.save();
  pen.ctx.translate(BQ.dx, BQ.dy);

  // soft masses behind everything (hydrangea / delphinium clouds)
  const masses = [
    [394, 524, 64, 54, 0.3],
    [382, 640, 56, 58, 0.27],
    [472, 468, 52, 44, 0.25],
    [340, 574, 44, 40, 0.23],
    [468, 656, 48, 44, 0.21],
    [514, 546, 42, 40, 0.2],
    [422, 440, 40, 36, 0.2],
    [486, 730, 38, 32, 0.18],
  ];
  masses.forEach(([x, y, rx, ry, tn], k) => {
    const RM = stream("mass", k);
    element(x, y);
    for (let q = 0; q < 7; q++) {
      // a cluster of florets, not one smooth smudge
      const a = RM() * TAU,
        rr = Math.sqrt(RM());
      const fx = x + Math.cos(a) * rx * rr * 0.7,
        fy = y + Math.sin(a) * ry * rr * 0.7,
        fr = rand(RM, rx * 0.42, rx * 0.68);
      const P = pen.blob(
        fx,
        fy,
        fr,
        fr * rand(RM, 0.78, 1.1),
        "fl" + k + q,
        0.3,
        9,
      );
      wash(P, "blue", tn);
      wash(P, "coral", tn * 0.22);
    }
    wash(
      pen.blob(x, y, rx * 0.5, ry * 0.46, "core" + k, 0.36, 11),
      "blue",
      tn + 0.16,
    );
    endElement();
  });

  // greenery inside the mass and spilling from the neck
  const RL = stream("leaves");
  for (let k = 0; k < 44; k++) {
    const src =
      k < 34
        ? heads[Math.floor(RL() * heads.length)]
        : [NECK[0] + rand(RL, -40, 40), NECK[1] + rand(RL, -20, 60)];
    const px = src[0] + rand(RL, -22, 22),
      py = src[1] + rand(RL, -20, 20);
    const la = rand(RL, -Math.PI * 1.05, 0.1),
      len = rand(RL, 20, 50);
    const P = petal(px, py, la, len, rand(RL, 4, 9), rand(RL, -6, 6));
    element(px, py);
    wash(P, "teal", rand(RL, 0.4, 0.72));
    wash(P, "yellow", rand(RL, 0.25, 0.5));
    endElement();
  }

  // filler heads: the small stuff that makes it read as one mass
  const RF = stream("filler");
  heads.forEach(([hx, hy], k) => {
    const n = 2 + Math.floor(RF() * 2);
    for (let q = 0; q < n; q++) {
      const x = hx + rand(RF, -22, 22),
        y = hy + rand(RF, -20, 20),
        r = rand(RF, 6, 16);
      const P = pen.blob(
        x,
        y,
        r,
        r * rand(RF, 0.75, 1.25),
        "f" + k + "_" + q,
        0.32,
        9,
      );
      element(x, y);
      const roll = RF();
      if (roll < 0.3) {
        wash(P, "blue", rand(RF, 0.24, 0.5));
        wash(P, "coral", rand(RF, 0.06, 0.16));
      } else if (roll < 0.46) {
        pen.knock(P, 0.8);
        wash(P, "yellow", 0.12);
      } // pale blooms, holes in the colour
      else if (roll < 0.7) wash(P, "coral", rand(RF, 0.28, 0.58));
      else if (roll < 0.86) {
        wash(P, "teal", rand(RF, 0.3, 0.5));
        wash(P, "yellow", rand(RF, 0.2, 0.4));
      } else wash(P, "yellow", rand(RF, 0.45, 0.8));
      if (RF() < 0.3)
        pen.line(P, "blue", 0.6, { closed: true, tone: 0.32, amp: 0.7 });
      endElement();
    }
  });

  // a handful of hero blooms, larger than everything around them
  const heroes = [
    [362, 512, 38, "blue", 0.34],
    [446, 620, 34, "blue", 0.3],
    [506, 540, 28, "coral", 0.4],
    [392, 690, 30, "coral", 0.32],
    [488, 430, 26, "blue", 0.3],
  ];
  heroes.forEach(([x, y, r, ink, tn], k) => {
    const RHb = stream("hero", k),
      n = 5 + Math.floor(RHb() * 2);
    element(x, y);
    for (let q = 0; q < n; q++) {
      const a = (q / n) * TAU + rand(RHb, -0.15, 0.15);
      const P = petal(
        x,
        y,
        a,
        r * rand(RHb, 0.85, 1.15),
        r * 0.52,
        rand(RHb, -6, 6),
      );
      wash(P, ink, tn);
      wash(P, ink === "blue" ? "coral" : "blue", 0.1);
    }
    wash(pen.blob(x, y, r * 0.3, r * 0.3, "hc" + k, 0.2, 8), "yellow", 0.8);
    endElement();
  });

  // tulips and poppies reaching out of the top
  const tulips = [
    [406, 388, -1.62, 0.58],
    [458, 364, -1.44, 0.48],
    [508, 400, -1.2, 0.64],
    [364, 434, -1.85, 0.44],
    [542, 458, -1.05, 0.42],
  ];
  tulips.forEach(([x, y, a, tn], k) => {
    const RTu = stream("tp", k);
    element(x, y + 40);
    for (let q = -1; q <= 1; q++) {
      const P = petal(x, y + 50, a + q * 0.28, rand(RTu, 50, 70), 17, q * 9);
      wash(P, "coral", tn);
      wash(P, "blue", 0.13);
    }
    wash(pen.blob(x, y + 40, 15, 20, "tb" + k, 0.22, 10), "coral", tn + 0.12);
    endElement();
  });

  // cattails: the tall dark accents that break the silhouette
  const cats = [
    [336, 330, 74],
    [360, 360, 56],
    [482, 316, 66],
    [426, 308, 48],
  ];
  cats.forEach(([x, y, h], k) => {
    element(x, y + h * 0.45);
    pen.line(
      [
        [x + 8, y + h + 130],
        [x + 2, y + h],
      ],
      "teal",
      1.6,
      { tone: 0.7, amp: 0.9 },
    );
    const P = pen.blob(x, y + h * 0.45, 7.5, h * 0.45, "cat" + k, 0.12, 11);
    wash(P, "coral", 0.55);
    wash(P, "blue", 0.5);
    endElement();
  });

  // small yellow starbursts
  const RY = stream("yel");
  for (let k = 0; k < 18; k++) {
    const [hx, hy] = heads[Math.floor(RY() * heads.length)];
    const x = hx + rand(RY, -26, 26),
      y = hy + rand(RY, -24, 24),
      r = rand(RY, 9, 16);
    element(x, y);
    for (let q = 0; q < 8; q++) {
      const a = (q / 8) * TAU + RY();
      wash(petal(x, y, a, r, r * 0.32), "yellow", 0.9);
    }
    pen.dot(x, y, r * 0.3, "coral", 0.8);
    endElement();
  }

  // the daisies — white, so they read as holes punched in the colour
  const daisies = [
    [410, 506, 33],
    [478, 566, 27],
    [348, 552, 24],
    [512, 486, 21],
    [338, 468, 19],
    [458, 660, 22],
    [404, 668, 18],
    [508, 632, 17],
    [414, 598, 15],
    [478, 736, 15],
  ];
  daisies.forEach(([x, y, r], k) => {
    const RD = stream("daisy", k),
      n = 9 + Math.floor(RD() * 4);
    element(x, y);
    for (let q = 0; q < n; q++) {
      const a = (q / n) * TAU + rand(RD, -0.12, 0.12);
      const P = petal(
        x,
        y,
        a,
        r * rand(RD, 0.85, 1.15),
        r * 0.3,
        rand(RD, -3, 3),
      );
      pen.knock(P, 0.93);
      wash(P, "yellow", 0.09);
      pen.line(P, "blue", 0.7, { closed: true, tone: 0.42, amp: 0.6 });
    }
    solid(pen.circle(x, y, r * 0.3, 12), "yellow", 0.95);
    pen.line(pen.circle(x, y, r * 0.3, 12), "coral", 0.8, {
      closed: true,
      tone: 0.5,
    });
    endElement();
  });

  // pollen in the air
  const RP = stream("pollen");
  for (let k = 0; k < 18; k++) {
    const px = MC[0] + rand(RP, -200, 200),
      py = MC[1] + rand(RP, -230, 250),
      pr = rand(RP, 1.4, 2.8);
    element(px, py);
    pen.dot(px, py, pr, "yellow", 0.9);
    endElement();
  }

  pen.ctx.restore();
  T.done();
}

/* ============================================================
   LAYER 3 — what sits in front of the bunch: fingers, head, hat
   ============================================================ */
function drawFront(pen) {
  const T = tools(pen),
    { wash, solid, petal, skin, capsule } = T;
  T.art();
  {
    for (let k = 0; k < 2; k++) {
      const f = capsule(
        [FX0 - 17, FY0 - 7 + k * 9],
        [FX0 + 10, FY0 - 10 + k * 9],
        4.2,
      );
      skin(f, 0.28, 0.38);
      pen.line(f, "blue", 1, { closed: true, tone: 0.82, amp: 0.6 });
    }
    const th = capsule([FX0 + 14, FY0 - 13], [FX0 - 3, FY0 + 2], 4.4); // thumb folded across
    skin(th, 0.32, 0.38);
    pen.line(th, "blue", 1.05, { closed: true, tone: 0.82, amp: 0.6 });
  }

  {
    // the hanging hand: one relaxed shape, two creases, nothing more
    const hx = WRI_F[0] - 1,
      hy = WRI_F[1] + 12;
    const rest = smooth(
      [
        [hx - 9, hy - 8],
        [hx + 8, hy - 9],
        [hx + 10, hy + 6],
        [hx + 2, hy + 14],
        [hx - 8, hy + 10],
      ],
      true,
      3,
    );
    skin(rest, 0.26, 0.38);
    pen.line(rest, "blue", 1.1, { closed: true, tone: 0.8, amp: 0.8 });
    pen.line(
      [
        [hx - 4, hy + 3],
        [hx - 1, hy + 12],
      ],
      "blue",
      0.8,
      { tone: 0.5, amp: 0.7 },
    );
    pen.line(
      [
        [hx + 3, hy + 2],
        [hx + 5, hy + 10],
      ],
      "blue",
      0.8,
      { tone: 0.5, amp: 0.7 },
    );
  }

  /* ---- the head: skull, profile, beard, then the hat sitting ON it ---- */
  pen.ctx.save();
  pen.ctx.translate(HX, 800);
  pen.ctx.rotate(0.24);
  pen.ctx.translate(-HX, -800);
  const skull = smooth(
    [
      [HX - 26, 758],
      [HX - 21, 738],
      [HX - 2, 731],
      [HX + 16, 739],
      [HX + 21, 762],
      [HX + 13, 788],
      [HX - 7, 795],
      [HX - 24, 782],
    ],
    true,
    3,
  );
  skin(skull, 0.2, 0.36);
  pen.line(skull, "blue", 1.2, { closed: true, tone: 0.75, amp: 0.9 });
  // ear
  {
    const ear = pen.circle(HX + 16, 766, 5, 12);
    skin(ear, 0.26, 0.36);
    pen.line(ear, "blue", 0.9, { closed: true, tone: 0.7, amp: 0.6 });
    pen.line(
      [
        [HX + 14, 763],
        [HX + 17, 767],
        [HX + 14, 770],
      ],
      "blue",
      0.7,
      { tone: 0.6, amp: 0.5 },
    );
  }
  // the profile: a nose that breaks the silhouette on the left
  {
    const nose = smooth(
      [
        [HX - 25, 757],
        [HX - 34, 768],
        [HX - 24, 772],
      ],
      true,
      2,
    );
    skin(nose, 0.24, 0.36);
    pen.line(
      [
        [HX - 25, 757],
        [HX - 34, 768],
        [HX - 24, 772],
      ],
      "blue",
      1.1,
      { tone: 0.75, amp: 0.6 },
    );
  }
  pen.dot(HX - 16, 761, 2.4, "blue", 0.95); // eye
  pen.line(
    [
      [HX - 22, 754],
      [HX - 11, 753],
    ],
    "blue",
    1.1,
    { tone: 0.7, amp: 0.8 },
  ); // brow
  // beard and moustache, white
  {
    // one shape: moustache, cheeks and a chin that comes to a point
    const beard = smooth(
      [
        [HX - 28, 770],
        [HX - 18, 765],
        [HX - 8, 772],
        [HX + 4, 769],
        [HX + 14, 776],
        [HX + 16, 788],
        [HX + 6, 798],
        [HX - 8, 808],
        [HX - 20, 803],
        [HX - 28, 790],
      ],
      true,
      3,
    );
    solid(beard, "paper", 0);
    pen.line(beard, "blue", 1.2, { closed: true, tone: 0.65, amp: 1.1 });
    pen.line(
      [
        [HX - 24, 774],
        [HX - 16, 777],
        [HX - 6, 774],
      ],
      "blue",
      0.9,
      { tone: 0.5, amp: 0.8 },
    ); // under the moustache
    for (let k = 0; k < 3; k++)
      // hair following the jaw to the chin
      pen.line(
        [
          [HX - 20 + k * 11, 782 - k],
          [HX - 16 + k * 9, 793],
          [HX - 9 + k * 3, 802],
        ],
        "blue",
        0.6,
        { tone: 0.3, amp: 1.2 },
      );
  }
  // a wisp of white hair at the nape
  {
    const nape = smooth(
      [
        [HX + 12, 774],
        [HX + 21, 778],
        [HX + 20, 787],
        [HX + 11, 786],
      ],
      true,
      3,
    );
    solid(nape, "paper", 0);
    pen.line(nape, "blue", 0.8, { closed: true, tone: 0.55, amp: 0.9 });
  }

  // ---- the hat, crown first then brim, so it reads as sitting down on the skull
  const crown = smooth(
    [
      [HX - 27, 742],
      [HX - 23, 715],
      [HX - 3, 706],
      [HX + 17, 714],
      [HX + 22, 742],
    ],
    true,
    3,
  );
  solid(crown, "yellow", 0.7);
  T.wash(crown, "coral", 0.16);
  T.wash(crown, "blue", 0.06);
  pen.line(crown, "blue", 1.5, { closed: true, tone: 0.85, amp: 0.9 });
  const brim = pen
    .circle(HX - 2, 740, 1, 26)
    .map(([x, y]) => [HX - 2 + (x - (HX - 2)) * 55, 740 + (y - 740) * 11]);
  solid(brim, "yellow", 0.62);
  T.wash(brim, "coral", 0.12);
  T.wash(brim, "blue", 0.07);
  pen.line(brim, "blue", 1.5, { closed: true, tone: 0.85, amp: 0.9 });
  pen.line(
    [
      [HX - 26, 736],
      [HX + 20, 734],
    ],
    "coral",
    2.4,
    { tone: 0.75, amp: 0.8 },
  ); // band
  pen.line(
    [
      [HX - 40, 742],
      [HX + 38, 740],
    ],
    "blue",
    0.8,
    { tone: 0.45, amp: 1.1 },
  ); // straw weave
  pen.ctx.restore();

  T.done();
}

/* ============================================================
   LIVE — butterflies.
   Each flies a closed figure-eight built only from harmonics of the loop,
   so it arrives back exactly where it started. The wings flap by squashing
   each one toward the body, and the body tips into the turn.
   ============================================================ */
const FLYERS = [
  {
    x: 806,
    y: 452,
    s: 1.2,
    ink: "coral",
    tone: 0.72,
    tilt: 0.18,
    key: "a",
    ax: 46,
    ay: 30,
    ph: 0,
  },
  {
    x: 214,
    y: 352,
    s: 0.66,
    ink: "coral",
    tone: 0.62,
    tilt: -0.32,
    key: "b",
    ax: 36,
    ay: 26,
    ph: 2.3,
  },
  {
    x: 168,
    y: 706,
    s: 1.0,
    ink: "blue",
    tone: 0.46,
    tilt: 0.38,
    key: "c",
    ax: 54,
    ay: 34,
    ph: 4.1,
  },
];

function drawFlyers(pen, t) {
  const T = tools(pen),
    { wash, petal } = T;
  T.art();
  const th = (TAU * t) / LOOP;

  for (const B of FLYERS) {
    const u = th + B.ph;
    const x = B.x + B.ax * Math.sin(u) + B.ax * 0.42 * Math.sin(2 * u + 0.6);
    const y =
      B.y + B.ay * Math.sin(2 * u + 1.2) + B.ay * 0.38 * Math.sin(3 * u);
    const tilt = B.tilt + 0.26 * Math.cos(u) + 0.1 * Math.sin(2 * u);
    const flap =
      0.3 + 0.7 * (0.5 + 0.5 * Math.cos((TAU * 64 * t) / LOOP + B.ph * 3)); // 64 beats to the loop
    const lift = 0.9 + 0.1 * flap;
    const s = B.s,
      ink = B.ink,
      RB = stream("fly", B.key);

    const wing = (a, L, W, tn) => {
      const P = petal(x, y, a + tilt, L * s, W * s, 0).map(([px, py]) => [
        x + (px - x) * flap,
        y + (py - y) * lift,
      ]);
      wash(P, ink, tn);
      wash(P, "yellow", 0.18);
      pen.line(P, "blue", 0.9, { closed: true, tone: 0.45, amp: 0 });
      for (let q = 0; q < 3; q++) {
        const v = rand(RB, 0.35, 0.85);
        let sx = x + Math.cos(a + tilt) * L * s * v + rand(RB, -5, 5) * s;
        let sy = y + Math.sin(a + tilt) * L * s * v + rand(RB, -5, 5) * s;
        sx = x + (sx - x) * flap;
        sy = y + (sy - y) * lift;
        pen.dot(sx, sy, rand(RB, 1.6, 3) * s, "blue", 0.65);
      }
    };
    wing(-2.62, 40, 19, B.tone);
    wing(-0.52, 40, 19, B.tone); // upper wings
    wing(2.86, 28, 13, B.tone * 0.85);
    wing(0.28, 28, 13, B.tone * 0.85); // lower wings
    pen.line(
      [
        [x, y - 12 * s],
        [x + Math.sin(tilt) * 6 * s, y + 15 * s],
      ],
      "blue",
      2 * s,
      { tone: 0.85, amp: 0 },
    );
    pen.line(
      [
        [x, y - 10 * s],
        [x - 11 * s, y - 24 * s],
      ],
      "blue",
      0.9,
      { tone: 0.7, amp: 0 },
    );
    pen.line(
      [
        [x, y - 10 * s],
        [x + 9 * s, y - 25 * s],
      ],
      "blue",
      0.9,
      { tone: 0.7, amp: 0 },
    );
    pen.dot(x - 11 * s, y - 24 * s, 1.4 * s, "blue", 0.8);
    pen.dot(x + 9 * s, y - 25 * s, 1.4 * s, "blue", 0.8);
  }
  T.done();
}

/* ============================================================
   LIVE — leaves coming loose from the bunch and drifting down.
   Each fades in and out inside its own cycle, so at the wrap every one of
   them is already invisible and nothing pops.
   ============================================================ */
function drawFalling(pen, t) {
  const T = tools(pen),
    { wash, petal } = T;
  T.art();
  for (let k = 0; k < 5; k++) {
    const R = stream("fall", k);
    const sx = MC[0] + BQ.dx + rand(R, -MRX * 0.45, MRX * 0.25);
    const sy = MC[1] + BQ.dy + rand(R, MRY * 0.4, MRY * 0.72);
    const u = (t / LOOP + k / 5 + rand(R, 0, 0.08)) % 1;
    const drift = rand(R, 14, 32),
      spins = randi(R, 1, 2);
    const len = rand(R, 19, 31),
      wid = rand(R, 6, 10);
    const slide = rand(R, -34, 18),
      fall = rand(R, 190, 320),
      a0 = rand(R, 0, TAU);
    const g = clamp(u / 0.1, 0, 1) * clamp((1 - u) / 0.28, 0, 1);
    if (g <= 0.04) continue;
    const x = sx + Math.sin(u * TAU * 1.5 + k) * drift + u * slide;
    const y = sy + u * fall;
    const P = petal(
      x,
      y,
      a0 + u * TAU * spins,
      len,
      wid,
      Math.sin(u * TAU * 2) * 5,
    );
    wash(P, "teal", 0.62 * g);
    wash(P, "yellow", 0.38 * g);
    pen.line(P, "teal", 0.7, { closed: true, tone: 0.8 * g, amp: 0 });
  }
  T.done();
}

/* Everything in order — used for stills and for the PNG export. */
/* Everything in order — used for stills and for the PNG export.
   s is the device scale of the target context. */
function drawBouquet(pen, t, s = 1) {
  const ctx = pen.ctx;
  drawBase(pen);
  const cache = captureSprites(drawBunch, s, CW, CH);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  blitSprites(ctx, cache, 0, 0, bunchOffset(s, t));
  ctx.restore();
  drawFront(pen);
  drawFlyers(pen, t);
  drawFalling(pen, t);
}

export {
  CW,
  CH,
  LOOP,
  PAPER_CSS,
  bakeLayer,
  blitSprites,
  bunchOffset,
  captureSprites,
  drawBase,
  drawBunch,
  drawFalling,
  drawFlyers,
  drawFront,
  grain,
  makePen,
  resetInkCaches,
};
