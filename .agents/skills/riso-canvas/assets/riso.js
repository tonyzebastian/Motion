'use strict';
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
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- seeded randomness ----------------------------------------
   Never call Math.random(). Everything is a pure function of its key, so
   the same drawing comes back identically on every frame and every reload
   — which is what makes caching and diff-testing possible at all. */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function stream(...keys) { let h = 0x9E3779B9; for (const k of keys) { h = Math.imul(h ^ hashStr(String(k)), 0x85EBCA6B); h ^= h >>> 13; } const r = mulberry(h >>> 0); r(); r(); return r; }
const rand = (R, a, b) => a + R() * (b - a);
const randi = (R, a, b) => Math.floor(rand(R, a, b + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function hash2(x, y, s) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function noise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  return lerp(lerp(hash2(xi, yi, s), hash2(xi + 1, yi, s), a), lerp(hash2(xi, yi + 1, s), hash2(xi + 1, yi + 1, s), a), b) * 2 - 1;
}

/* ---------- polyline helpers ---------- */
function resample(P, step) {
  const out = [P[0].slice()]; let need = step;
  for (let n = 1; n < P.length; n++) {
    let x0 = P[n - 1][0], y0 = P[n - 1][1]; const x1 = P[n][0], y1 = P[n][1]; let d = Math.hypot(x1 - x0, y1 - y0);
    while (d >= need && d > 0) { const t = need / d; x0 += (x1 - x0) * t; y0 += (y1 - y0) * t; out.push([x0, y0]); d -= need; need = step; }
    need -= d;
  }
  const L = P[P.length - 1], E = out[out.length - 1];
  if (Math.hypot(L[0] - E[0], L[1] - E[1]) > step * .25) out.push(L.slice());
  return out;
}
function smooth(P, closed = false, it = 2) {      // Chaikin
  let p = P;
  for (let k = 0; k < it; k++) {
    const q = [], n = p.length; if (!closed) q.push(p[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = p[i], b = p[(i + 1) % n]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
    if (!closed) q.push(p[n - 1]); p = q;
  }
  return p;
}

/* ---------- isometric projection (only if you want one) ----------
   i runs toward the lower right, j toward the lower left, z up. */
const TW = 64, TH = 32, TZ = 32;
const iso = (i, j, z = 0) => [(i - j) * TW / 2, (i + j) * TH / 2 - z * TZ];

/* ---------- the inks ------------------------------------------------
   Real Riso drum colours. There are four, and no others: every colour in
   the piece is one of these screened at a tone, or two of them overprinted.
   Swap these and the whole drawing re-palettes. */
const PAPER = [242, 234, 218];
const INKS = {
  blue:   [45, 72, 132],    // Federal Blue — linework, shadow, night
  coral:  [242, 82, 100],   // Fluoro Pink  — warm things, skin
  yellow: [255, 226, 0],    // Yellow       — light, glow, straw
  teal:   [0, 138, 138],    // Teal         — plants, glass, water
};
const ANGLE = { blue: 15, coral: 75, yellow: 0, teal: 45 };   // screen angles; the moiré is the point
const MISREG = 1.15;                                          // how far the plates slip, world px
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const PAPER_CSS = css(PAPER);

/* ---------- halftone screens ----------------------------------------
   One tile per ink per tone level, baked once and reused as a repeating
   pattern. This is the performance secret: fills become pattern fills
   rather than per-pixel work. */
const SS = 4, CELL = 2.5, TILE_N = 8, LEVELS = 16;
const tiles = new Map();
function halftoneTile(ink, level) {
  const key = ink + '|' + level; let cv = tiles.get(key); if (cv) return cv;
  const cell = CELL * SS, size = cell * TILE_N, tone = level / LEVELS, salt = hashStr(ink) % 9973;
  cv = MKCANVAS(size, size); const c = cv.getContext('2d'); c.fillStyle = css(INKS[ink]);
  if (level >= LEVELS) c.fillRect(0, 0, size, size);
  else if (tone <= .5) {                                   // dots grow: area proportional to tone
    for (let y = 0; y < TILE_N; y++) for (let x = 0; x < TILE_N; x++) {
      const r = cell * Math.sqrt(tone / Math.PI) * (.9 + hash2(x, y, salt + level) * .2);
      const jx = (hash2(x, y, salt) - .5) * .08 * cell, jy = (hash2(y, x, salt) - .5) * .08 * cell;
      c.beginPath(); c.arc((x + .5) * cell + jx, (y + .5) * cell + jy, r, 0, TAU); c.fill();
    }
  } else {                                                 // past 50% it flips: solid with shrinking holes
    c.fillRect(0, 0, size, size); c.globalCompositeOperation = 'destination-out';
    for (let y = 0; y <= TILE_N; y++) for (let x = 0; x <= TILE_N; x++) {
      const r = cell * Math.sqrt((1 - tone) / Math.PI) * (.9 + hash2(x % TILE_N, y % TILE_N, salt + level) * .2);
      c.beginPath(); c.arc(x * cell, y * cell, r, 0, TAU); c.fill();
    }
  }
  c.globalCompositeOperation = 'destination-out';          // worn drum: specks of missing ink
  const R = stream('speck', ink, level), n = size * size / 280;
  for (let k = 0; k < n; k++) { const s = rand(R, 1, 3.2); c.globalAlpha = rand(R, .25, .9); c.fillRect(R() * size, R() * size, s, s); }
  tiles.set(key, cv); return cv;
}
const screens = new Map();
var grainPattern = null;
/* Patterns belong to the context that created them. Call this whenever you
   start drawing on a different canvas, or you will get silent corruption. */
function resetInkCaches() { screens.clear(); grainPattern = null; }
function screen(ctx, ink, tone, dx, dy) {
  const level = clamp(Math.round(tone * LEVELS), 1, LEVELS);
  const key = `${ink}|${level}|${dx.toFixed(2)}|${dy.toFixed(2)}`;
  let pat = screens.get(key); if (pat) return pat;
  pat = ctx.createPattern(halftoneTile(ink, level), 'repeat');
  pat.setTransform(new DOMMatrix().translateSelf(dx, dy).rotateSelf(ANGLE[ink] || 0).scaleSelf(1 / SS));
  screens.set(key, pat); return pat;
}

/* ---------- paper stock ---------- */
function grain(ctx) {
  if (grainPattern) return grainPattern;
  const cv = MKCANVAS(384, 384), c = cv.getContext('2d'), R = stream('grain');
  for (let k = 0; k < 2600; k++) { c.fillStyle = css(INKS.blue, rand(R, .03, .1)); const s = rand(R, .6, 1.8); c.fillRect(R() * 384, R() * 384, s, s); }
  for (let k = 0; k < 110; k++) {
    c.strokeStyle = css(pick(R, [INKS.coral, INKS.blue]), rand(R, .04, .09)); c.lineWidth = .6;
    const x = R() * 384, y = R() * 384, a = R() * TAU, l = rand(R, 4, 12);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  return grainPattern = ctx.createPattern(cv, 'repeat');
}

/* ============================================================
   THE PEN — every mark in the drawing goes through here.
   ============================================================ */
function makePen(ctx, opt = {}) {
  const ox = opt.ox || 0, oy = opt.oy || 0, boil = opt.boil || 0, variant = boil % 3;
  const plate = {};                                       // plates don't line up, and slip again on each boil
  for (const k in INKS) { const J = stream('plate', k, variant); plate[k] = [rand(J, -1, 1) * MISREG, rand(J, -1, 1) * MISREG]; }
  const pen = { ctx, boil, ox, oy };
  const p = pen.p = (i, j, z = 0) => { const q = iso(i, j, z); return [q[0] + ox, q[1] + oy]; };
  const trace = (P, dx = 0, dy = 0) => { ctx.beginPath(); for (let n = 0; n < P.length; n++) { const x = P[n][0] + dx, y = P[n][1] + dy; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
  const withInk = (ink, tone, fn) => {
    if (!INKS[ink]) ink = 'blue';
    const [dx, dy] = plate[ink];
    ctx.globalCompositeOperation = 'multiply';            // ink on paper only ever darkens
    fn(screen(ctx, ink, tone, dx, dy), dx, dy);
    ctx.globalCompositeOperation = 'source-over';
  };

  /* Two ways to lay ink down, and choosing between them is most of the look.
       knock + tint  = an opaque object. Use for anything solid.
       tint alone    = a wash. Overlaps multiply, so petals laid over petals
                       build density the way real overprinting does.        */
  pen.knock = (P, a = 1) => { if (P.length < 3) return; trace(P); ctx.closePath(); ctx.fillStyle = a === 1 ? PAPER_CSS : css(PAPER, a); ctx.fill(); };
  pen.tint = (P, ink, tone = 1) => { if (tone <= 0 || P.length < 3) return; withInk(ink, tone, (st, dx, dy) => { trace(P, dx, dy); ctx.closePath(); ctx.fillStyle = st; ctx.fill(); }); };
  pen.fill = (P, ink, tone = 1) => { pen.knock(P); if (ink && ink !== 'paper') pen.tint(P, ink, tone); };

  /* the hand-drawn line: resample, then push each point with noise indexed
     by arc length so the wobble travels ALONG the stroke instead of
     flickering per vertex */
  pen.line = (P, ink = 'blue', w = 1.3, o = {}) => {
    if (!P || P.length < 2) return;
    const src = o.closed ? [...P, P[0]] : P;
    let Q = resample(src, Math.max(2.5, w * 1.5)); if (Q.length < 2) return;
    const amp = o.amp ?? (.35 + w * .15);
    if (amp > 0) {
      const seed = (hash2(Math.round(src[0][0] * 3), Math.round(src[0][1] * 3), boil * 7 + 1) * 1e6) | 0;
      let s = 0;
      Q = Q.map((q, n) => {
        if (n) s += Math.hypot(q[0] - Q[n - 1][0], q[1] - Q[n - 1][1]);
        return [q[0] + noise(s * .045, .5, seed) * amp + (hash2(n, seed, 1) - .5) * amp * .3,
                q[1] + noise(s * .045, 7.5, seed) * amp + (hash2(seed, n, 2) - .5) * amp * .3];
      });
      if (o.closed) Q[Q.length - 1] = Q[0].slice();
    }
    withInk(ink, o.tone ?? 1, (st, dx, dy) => {
      ctx.strokeStyle = st; ctx.lineWidth = w; ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      trace(Q, dx, dy); ctx.stroke();
      if (o.dash) ctx.setLineDash([]);
    });
  };
  pen.shape = (P, fill, o = {}) => { if (fill) pen.fill(P, fill[0], fill[1]); if (o.line !== false) pen.line(P, o.line || 'blue', o.w ?? 1.2, { closed: true, amp: o.amp, tone: o.lineTone }); };
  pen.dot = (x, y, r, ink = 'blue', tone = 1) => pen.tint(pen.circle(x, y, r, 10), ink, tone);

  /* light cannot come out of multiply: lift the paper first, then print yellow */
  pen.light = (P, strength = .5, ink = 'yellow') => { pen.knock(P, .35 * strength + .1); pen.tint(P, ink, .22 + .35 * strength); };
  pen.glow = (i, j, z, r, ink = 'yellow', strength = .6) => { for (let k = 0; k < 4; k++) { const E = pen.ellipse(i, j, z, r * (1 - k * .22)); pen.knock(E, .18 * strength); pen.tint(E, ink, strength * (k + 1) / 4); } };
  pen.glowAt = (x, y, r, ink = 'yellow', strength = .6) => { for (let k = 0; k < 4; k++) { const E = pen.circle(x, y, r * (1 - k * .22), 20); pen.knock(E, .18 * strength); pen.tint(E, ink, strength * (k + 1) / 4); } };

  /* geometry — everything returns a point array */
  pen.circle = (x, y, r, n = 18) => Array.from({ length: n }, (_, k) => [x + Math.cos(k / n * TAU) * r, y + Math.sin(k / n * TAU) * r]);
  pen.floorQuad = (i, j, w, d, z = 0) => [p(i, j, z), p(i + w, j, z), p(i + w, j + d, z), p(i, j + d, z)];
  pen.ellipse = (ci, cj, z, ri, rj = ri, n = 28) => Array.from({ length: n }, (_, k) => { const a = k / n * TAU; return p(ci + Math.cos(a) * ri, cj + Math.sin(a) * rj, z); });
  pen.blob = (x, y, rx, ry, key = 'blob', lump = .22, n = 9) => {
    const R = stream('blob', key), P = [];
    for (let k = 0; k < n; k++) { const a = k / n * TAU + rand(R, -.2, .2), m = 1 + rand(R, -lump, lump); P.push([x + Math.cos(a) * rx * m, y + Math.sin(a) * ry * m]); }
    return smooth(P, true, 3);
  };
  pen.petal = (cx, cy, a, len, wid, curve = 0) => {
    const tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len;
    const mx = cx + Math.cos(a) * len * .5 - Math.sin(a) * curve, my = cy + Math.sin(a) * len * .5 + Math.cos(a) * curve;
    const nx = -Math.sin(a) * wid, ny = Math.cos(a) * wid;
    return smooth([[cx, cy], [mx + nx, my + ny], [tx, ty], [mx - nx, my - ny]], true, 3);
  };
  pen.wallQuad = (wall, u, z, w, h, off = .02) => { const W = (a, zz) => wall === 'i' ? p(u + a, off, zz) : p(off, u + a, zz); return [W(0, z), W(w, z), W(w, z + h), W(0, z + h)]; };
  pen.leaf = (a, b, wid) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * wid, ny = dx / L * wid; return smooth([a, [mx + nx, my + ny], b, [mx - nx, my - ny]], true, 2); };
  /* an isometric box: shadow, the two faces pointing at the camera, then the top.
     Side faces are tinted darker than the top — that one tonal step is what
     makes a box read as a solid rather than a flat shape. */
  pen.box = (i, j, z, w, d, h, o = {}) => {
    const ink = o.ink || 'coral', tone = o.tone ?? .5;
    if (o.shadow !== false) pen.tint(pen.floorQuad(i + .12, j + .18, w, d, z), 'blue', .3);
    const top = pen.floorQuad(i, j, w, d, z + h);
    const faceJ = [p(i, j + d, z), p(i + w, j + d, z), p(i + w, j + d, z + h), p(i, j + d, z + h)];
    const faceI = [p(i + w, j, z), p(i + w, j + d, z), p(i + w, j + d, z + h), p(i + w, j, z + h)];
    pen.fill(faceJ, o.leftInk || ink, o.left ?? clamp(tone + .3, 0, 1));
    pen.fill(faceI, o.rightInk || ink, o.right ?? clamp(tone + .15, 0, 1));
    pen.fill(top, o.topInk || ink, o.top ?? tone);
    if (o.line !== false) { const lw = o.w ?? 1.1; for (const F of [faceJ, faceI, top]) pen.line(F, 'blue', lw, { closed: true }); }
    return { top, faceI, faceJ };
  };
  /* a cutaway room: floor slab, plank lines, the two back walls */
  pen.shell = (r) => {
    const { w, d, h } = r, st = r.style || {}, T = .25;
    const [fi, ft] = st.floor || ['blue', .65], [wi, wt] = st.wall || ['coral', .3], [wi2, wt2] = st.wall2 || [wi, Math.min(1, wt + .12)];
    pen.shape([p(-T, d, 0), p(w, d, 0), p(w, d, -.5), p(-T, d, -.5)], [fi, Math.min(1, ft + .25)]);
    pen.shape([p(w, -T, 0), p(w, d, 0), p(w, d, -.5), p(w, -T, -.5)], [fi, Math.min(1, ft + .12)]);
    pen.shape(pen.floorQuad(-T, -T, w + T, d + T, 0), [fi, ft], { w: 1.4 });
    if (st.planks !== false) for (let a = st.plank || .8; a < d; a += st.plank || .8) pen.line([p(0, a, 0), p(w, a, 0)], 'blue', .6, { tone: .9, amp: .25 });
    if (h > 0) {
      pen.shape(pen.wallQuad('j', 0, 0, d, h, 0), [wi2, wt2]);
      pen.shape(pen.wallQuad('i', 0, 0, w, h, 0), [wi, wt]);
      pen.shape([p(w, -T, 0), p(w, 0, 0), p(w, 0, h), p(w, -T, h)], [wi, Math.min(1, wt + .3)]);
      pen.shape([p(-T, d, 0), p(0, d, 0), p(0, d, h), p(-T, d, h)], [wi2, Math.min(1, wt2 + .3)]);
      pen.shape([p(-T, -T, h), p(w, -T, h), p(w, 0, h), p(0, 0, h), p(0, d, h), p(-T, d, h)], ['paper', 0]);
      pen.line([p(0, d, .12), p(0, 0, .12), p(w, 0, .12)], 'blue', .8, { tone: .8 });
    }
  };
  pen.capsule = (a, b, r) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * r, ny = dx / L * r, ux = dx / L * r, uy = dy / L * r;
    return smooth([[a[0] + nx - ux, a[1] + ny - uy], [b[0] + nx + ux, b[1] + ny + uy], [b[0] - nx + ux, b[1] - ny + uy], [a[0] - nx - ux, a[1] - ny - uy]], true, 3);
  };
  /* a limb is not a tube of one width — taper it or the elbow reads as a crease */
  pen.taper = (a, b, r0, r1) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, N = 8, P = [];
    for (let k = 0; k <= N; k++) { const t = k / N, r = lerp(r0, r1, t); P.push([a[0] + dx * t + nx * r, a[1] + dy * t + ny * r]); }
    P.push([b[0] + ux * r1, b[1] + uy * r1]);
    for (let k = N; k >= 0; k--) { const t = k / N, r = lerp(r0, r1, t); P.push([a[0] + dx * t - nx * r, a[1] + dy * t - ny * r]); }
    P.push([a[0] - ux * r0, a[1] - uy * r0]);
    return smooth(P, true, 2);
  };
  /* a stem / cable / vine: one closed ribbon along a polyline, tapering,
     with its width modulated so it does not read as an extrusion */
  pen.ribbon = (P, r0, r1, wob = 0) => {
    const Q = smooth(P, false, 3), A = [], B = [];
    for (let i = 0; i < Q.length; i++) {
      const a = Q[Math.max(0, i - 1)], b = Q[Math.min(Q.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d, u = i / (Q.length - 1);
      const r = lerp(r0, r1, u) * (1 + .16 * Math.sin(u * 11 + wob));
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
function element(x, y) { if (REC) REC.begin(x, y); }
function endElement() { if (REC) REC.end(); }

/* Run drawFn twice — once for geometry only (cheap, gives bounding boxes),
   once for real with each element translated into its slot on one atlas —
   and return every element as a sprite plus the blend mode it was painted
   with. Compositing those sprites back at zero offset reproduces the
   drawing exactly; giving each its own offset animates it. */
function captureSprites(drawFn, S, W, H) {
  const boxes = [], anchors = [], knocks = [];
  {                                                     // pass 1: geometry only
    const cv = MKCANVAS(8, 8), c = cv.getContext('2d');
    c.setTransform(S, 0, 0, S, 0, 0);
    const pen = makePen(c, { boil: 0 });
    let bb = null, knocked = false, anchor = [0, 0];
    const note = (P, pad) => {
      const m = c.getTransform();
      for (const q of P) {
        const x = m.a * q[0] + m.c * q[1] + m.e, y = m.b * q[0] + m.d * q[1] + m.f;
        if (!bb) bb = [x - pad, y - pad, x + pad, y + pad];
        else { if (x - pad < bb[0]) bb[0] = x - pad; if (y - pad < bb[1]) bb[1] = y - pad; if (x + pad > bb[2]) bb[2] = x + pad; if (y + pad > bb[3]) bb[3] = y + pad; }
      }
    };
    pen.knock = (P) => { knocked = true; note(P, 3 * S); };
    pen.tint = (P) => note(P, 3 * S);
    pen.line = (P, i, w) => note(P, (4 + (w || 1) * 1.5) * S);
    REC = {
      begin(x, y) { const m = c.getTransform(); anchor = [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; bb = null; knocked = false; },
      end() { boxes.push(bb && [Math.max(0, Math.floor(bb[0])), Math.max(0, Math.floor(bb[1])), Math.ceil(bb[2]), Math.ceil(bb[3])]); anchors.push(anchor); knocks.push(knocked); bb = null; }
    };
    drawFn(pen); REC = null;
  }

  const pad = 1, AW = Math.round(clamp(2048 * S, 1024, 4096));
  let x = pad, y = pad, rowH = 0, AH = pad;
  const slots = boxes.map(b => {
    if (!b) return null;
    const w = b[2] - b[0], h = b[3] - b[1];
    if (w <= 0 || h <= 0) return null;
    if (x + w + pad > AW) { x = pad; y += rowH + pad; rowH = 0; }
    const s = { sx: x, sy: y, w, h, bx: b[0], by: b[1] };
    x += w + pad; rowH = Math.max(rowH, h); AH = Math.max(AH, y + rowH + pad);
    return s;
  });

  const atlas = MKCANVAS(AW, AH), ac = atlas.getContext('2d');
  resetInkCaches();
  ac.setTransform(S, 0, 0, S, 0, 0);
  const pen = makePen(ac, { boil: 0 });
  let n = 0, open = false;
  REC = {
    begin() {
      const sl = slots[n]; if (!sl) { open = false; return; }
      const m = ac.getTransform();
      ac.save();
      ac.setTransform(1, 0, 0, 1, sl.sx - sl.bx, sl.sy - sl.by);   // device-space offset into the slot
      ac.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      open = true;
    },
    end() { if (open) { ac.restore(); open = false; } n++; }
  };
  drawFn(pen); REC = null;
  resetInkCaches();

  const sprites = [];
  slots.forEach((sl, i) => {
    if (sl) sprites.push({ sx: sl.sx, sy: sl.sy, w: sl.w, h: sl.h, x: sl.bx, y: sl.by,
                           blend: knocks[i] ? 'source-over' : 'multiply', ax: anchors[i][0], ay: anchors[i][1] });
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
    ctx.drawImage(cache.atlas, sp.sx, sp.sy, sp.w, sp.h,
      ox + sp.x + Math.round(d[0]), oy + sp.y + Math.round(d[1]), sp.w, sp.h);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* bake a whole static layer (no per-element motion) */
function bakeLayer(drawFn, S, W, H) {
  const cv = MKCANVAS(Math.ceil(W * S), Math.ceil(H * S)), c = cv.getContext('2d');
  c.setTransform(S, 0, 0, S, 0, 0);
  resetInkCaches();
  drawFn(makePen(c, { boil: 0 }));
  return cv;
}
