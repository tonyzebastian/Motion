'use strict';
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
const CW = 1200, CH = 1500;          // 4:5 — the tallest ratio X shows uncropped in the timeline
const ART = { k: 1.22, dx: 6, dy: -137 };   // the artwork is authored in a 1000x1280 space
const BQ = { dx: -50, dy: 24 };             // the bouquet around its own origin
const HOLD_TOP = [500, 716], HOLD_BOT = [546, 930];
const FIST = [HOLD_BOT[0], HOLD_BOT[1] + 2];

const FX = 640, FEET = 1148;
const ELB_N = [FX - 80, 876], WRI_N = [FX - 88, 916];
const ELB_F = [FX + 62, 876], WRI_F = [FX + 60, 924];
const FX0 = HOLD_BOT[0] - 2, FY0 = HOLD_BOT[1] + 8;
const HX = FX - 4;
const MC = [458, 594], MRX = 162, MRY = 232;   // the mass, in the bouquet's own space
const NECK = [500, 700];

/* Every motion below is a harmonic of this, so the whole piece returns to
   exactly where it began. */
const LOOP = 16;

function tools(pen) {
  const wash = (P, ink, tone) => pen.tint(P, ink, tone);
  const solid = (P, ink, tone) => pen.fill(P, ink, tone);
  const petal = (cx, cy, a, len, wid, curve = 0) => {
    const tipX = cx + Math.cos(a) * len, tipY = cy + Math.sin(a) * len;
    const mx = cx + Math.cos(a) * len * .5 - Math.sin(a) * curve, my = cy + Math.sin(a) * len * .5 + Math.cos(a) * curve;
    const nx = -Math.sin(a) * wid, ny = Math.cos(a) * wid;
    return smooth([[cx, cy], [mx + nx, my + ny], [tipX, tipY], [mx - nx, my - ny]], true, 3);
  };
  const skin = (P, a = .3, b = .34) => { pen.knock(P); wash(P, 'coral', a); wash(P, 'yellow', b); };
  const knit = (P, c = .52) => { pen.knock(P); wash(P, 'yellow', 1); wash(P, 'coral', c); wash(P, 'blue', .08); };
  const capsule = (a, b, r) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * r, ny = dx / L * r, ux = dx / L * r, uy = dy / L * r;
    return smooth([[a[0] + nx - ux, a[1] + ny - uy], [b[0] + nx + ux, b[1] + ny + uy], [b[0] - nx + ux, b[1] - ny + uy], [a[0] - nx - ux, a[1] - ny - uy]], true, 3);
  };
  const taper = (a, b, r0, r1) => {   // a limb narrows along its length
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, N = 8, P = [];
    for (let k = 0; k <= N; k++) { const t = k / N, r = lerp(r0, r1, t); P.push([a[0] + dx * t + nx * r, a[1] + dy * t + ny * r]); }
    P.push([b[0] + ux * r1, b[1] + uy * r1]);
    for (let k = N; k >= 0; k--) { const t = k / N, r = lerp(r0, r1, t); P.push([a[0] + dx * t - nx * r, a[1] + dy * t - ny * r]); }
    P.push([a[0] - ux * r0, a[1] - uy * r0]);
    return smooth(P, true, 2);
  };
  const ribbon = (P, r0, r1, wob) => {
    const Q = smooth(P, false, 3), A = [], B = [];
    for (let i = 0; i < Q.length; i++) {
      const a = Q[Math.max(0, i - 1)], b = Q[Math.min(Q.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d, u = i / (Q.length - 1);
      const r = lerp(r0, r1, u) * (1 + .16 * Math.sin(u * 11 + wob));   // stems are not extruded tubes
      A.push([Q[i][0] + nx * r, Q[i][1] + ny * r]);
      B.push([Q[i][0] - nx * r, Q[i][1] - ny * r]);
    }
    return A.concat(B.reverse());
  };
  const art = () => { pen.ctx.save(); pen.ctx.translate(ART.dx, ART.dy); pen.ctx.scale(ART.k, ART.k); };
  const done = () => pen.ctx.restore();
  return { wash, solid, petal, skin, knit, capsule, taper, ribbon, art, done };
}

/* heads: points inside the mass, biased toward the middle. Computed once. */
let HEADS = null;
function headPoints() {
  if (HEADS) return HEADS;
  const RH = stream('heads'), h = [];
  for (let k = 0; k < 74; k++) {
    const a = RH() * TAU, rr = Math.sqrt(rand(RH, .03, 1));
    let x = MC[0] + Math.cos(a) * MRX * rr, y = MC[1] + Math.sin(a) * MRY * rr;
    y = Math.min(y, MC[1] + 160);
    if (y > MC[1]) { x -= (y - MC[1]) * .08; x += (MC[0] - x) * (y - MC[1]) / MRY * .8; }
    h.push([x, y]);
  }
  h.sort((p, q) => q[1] - p[1]);
  return HEADS = h;
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
  const th = TAU * t / LOOP;
  const d = Math.hypot(ax - FIST[0], ay - FIST[1]);
  const v = clamp((d - 130) / 440, 0, 1), a = Math.pow(v, 1.4);
  const ph = hash2(Math.round(ax), Math.round(ay), 7) * TAU;
  return [a * (7.5 * Math.sin(th - v * .55) + 3.2 * Math.sin(2 * th + 1.1 - v * .35) + 2.4 * Math.sin(2 * th + ph)),
          a * (2.0 * Math.sin(2 * th + .7) + 1.6 * Math.sin(th + ph))];
}

/* Element boundaries come from riso.js: element(x, y) / endElement() are
   no-ops until captureSprites() runs a capture over drawBunch. */

/* the offset callback captureSprites/blitSprites want: device px in, device px
   out, with the wind field evaluated in the artwork's own units */
function bunchOffset(S, t) {
  return (ax, ay) => {
    const [dx, dy] = windAt((ax / S - ART.dx) / ART.k, (ay / S - ART.dy) / ART.k, t);
    return [dx * ART.k * S, dy * ART.k * S];
  };
}

/* ============================================================
   LAYER 1 — the figure, everything behind the bunch
   ============================================================ */
function drawBase(pen) {
  const T = tools(pen), { wash, solid, petal, skin, knit, capsule, taper } = T;
  T.art();
  wash(pen.blob(FX - 30, FEET + 6, 86, 12, 'shadow', .25, 12), 'blue', .2);
  wash(pen.blob(FX - 20, FEET + 4, 52, 7, 'shadow2', .3, 10), 'blue', .18);

  // trousers
  const legs = smooth([[FX - 42, 920], [FX + 36, 918], [FX + 40, 1030], [FX + 30, 1136], [FX - 2, 1140], [FX - 4, 1040], [FX - 18, 1042], [FX - 30, 1138], [FX - 62, 1134], [FX - 54, 1010]], true, 3);
  solid(legs, 'blue', .82);
  pen.line(legs, 'blue', 1.6, { closed: true, tone: 1, amp: 1 });
  pen.line([[FX - 12, 960], [FX - 8, 1036]], 'blue', 1, { tone: 1, amp: 1.2 });
  wash(pen.blob(FX + 14, 1000, 11, 9, 'patch', .2, 8), 'coral', .7);   // a patch
  wash(pen.blob(FX - 40, 1072, 8, 7, 'patch2', .2, 8), 'coral', .6);

  // boots
  for (const B of [smooth([[FX - 66, 1124], [FX - 24, 1126], [FX - 18, 1146], [FX - 80, 1148], [FX - 88, 1134]], true, 2),
                   smooth([[FX - 2, 1126], [FX + 34, 1124], [FX + 42, 1138], [FX + 38, 1150], [FX - 4, 1148]], true, 2)]) {
    pen.knock(B); wash(B, 'coral', .9); wash(B, 'blue', .62);            // coral under blue is a boot brown
    pen.line(B, 'blue', 1.4, { closed: true, tone: .95, amp: .8 });
  }
  for (const b of [[-52, 1148], [16, 1150]]) pen.line([[FX + b[0] - 26, b[1]], [FX + b[0] + 22, b[1] - 1]], 'blue', 2, { tone: .9, amp: .6 });


  /* arms before the body, so the sweater covers each shoulder end and the joint disappears */
  const armPiece = (a, b, r0, r1, tone) => {
    const P = taper(a, b, r0, r1);
    knit(P, tone);
    pen.line(P, 'blue', 1.5, { closed: true, tone: .95, amp: 1 });
  };

    armPiece([FX - 32, 818], ELB_N, 16, 11.5, .56);
  armPiece(ELB_N, WRI_N, 11.5, 9.5, .66);
  armPiece([FX + 20, 814], ELB_F, 16, 11.5, .58);
  armPiece(ELB_F, WRI_F, 11, 7.5, .66);

  /* ---- neck, then the sweater over the shoulders ---- */
  { const neck = smooth([[FX - 16, 782], [FX + 8, 780], [FX + 10, 812], [FX - 18, 814]], true, 2);
    skin(neck, .24, .36); wash(neck, 'blue', .16);
    pen.line(neck, 'blue', 1.1, { closed: true, tone: .7, amp: .8 }); }

  const body = smooth([[FX - 46, 808], [FX - 32, 792], [FX + 12, 790], [FX + 30, 804], [FX + 48, 862], [FX + 46, 924], [FX + 4, 934], [FX - 24, 926], [FX - 52, 946], [FX - 62, 882]], true, 3);
  knit(body);
  pen.line(body, 'blue', 1.7, { closed: true, tone: .95, amp: 1 });
  for (let k = -3; k <= 3; k++) pen.line([[FX + k * 13 + 2, 812], [FX + k * 13 - 2, 926]], 'blue', .9, { tone: .3, amp: 1.2 });
  { const neckline = [[FX - 24, 793], [FX - 17, 805], [FX - 2, 809], [FX + 13, 806], [FX + 20, 792]];
    pen.line(neckline, 'blue', 1.6, { tone: .95, amp: .8 });
    pen.line(neckline.map(([x, y]) => [x + (x - FX + 2) * .07, y + 6]), 'blue', 1, { tone: .6, amp: .9 }); }

  /* ---- the grip, built in three layers:
       palm behind  ->  stems  ->  thumb and two fingers in front.
     A real fist has stems passing across the palm and only the curled
     fingers on top; drawing the whole hand over the bundle is what made
     it look like a mitt stuck on the front. */
  for (const W of [WRI_N, WRI_F]) pen.line([[W[0] - 8, W[1] - 4], [W[0] + 8, W[1] - 2]], 'blue', 1.1, { tone: .7, amp: .7 });

  { const palm = smooth([[FX0 - 18, FY0 - 14], [FX0 - 5, FY0 - 18], [FX0 + 12, FY0 - 15], [FX0 + 18, FY0 - 2],
                         [FX0 + 14, FY0 + 11], [FX0 - 3, FY0 + 16], [FX0 - 16, FY0 + 10], [FX0 - 20, FY0 - 2]], true, 3);
    skin(palm, .26, .38);
    pen.line(palm, 'blue', 1.3, { closed: true, tone: .85, amp: .9 }); }


  T.done();
}

/* ============================================================
   LAYER 2 — the bunch: whole stems, then the flowers over them.
   This is the layer the wind rotates.
   ============================================================ */
function drawBunch(pen) {
  const T = tools(pen), { wash, solid, petal, ribbon } = T;
  const heads = headPoints();
  T.art();

  /* whole stems: each starts at a flower head high inside the bunch, runs
     the length of the bouquet, closes into the fist and carries on to its
     cut end. One ribbon each — nothing bolted on at the bottom. */
  { const RB = stream('wholestems');
    for (let k = 0; k < 8; k++) {
      element(FIST[0], FIST[1]);
      const hx = MC[0] + BQ.dx + rand(RB, -MRX * .5, MRX * .5);
      const hy = MC[1] + BQ.dy + rand(RB, -MRY * .8, MRY * .1);
      const H = [hx, hy], F = [FIST[0] + rand(RB, -6, 6), FIST[1] + rand(RB, -4, 4)];
      const C = [F[0] + rand(RB, -13, 13), F[1] + rand(RB, 40, 74)];

      // the path: one long bow, a shorter counter-bow, and a little wander on
      // top of both. Ends are pinned, so every stem still meets the flowers
      // and the fist exactly.
      const dx = F[0] - H[0], dy = F[1] - H[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      const bow = rand(RB, -26, 26), counter = rand(RB, -13, 13), sd = Math.floor(RB() * 1e5);
      const P = [];
      for (let i = 0; i <= 9; i++) {
        const u = i / 9;
        const off = Math.sin(u * Math.PI) * bow + Math.sin(u * Math.PI * 2.4 + 1.1) * counter + noise(u * 5, sd * .01, sd) * 4;
        P.push([lerp(H[0], F[0], u) + nx * off, lerp(H[1], F[1], u) + ny * off]);
      }
      for (let i = 1; i <= 3; i++) {                                   // on past the fist to the cut end
        const u = i / 3;
        P.push([lerp(F[0], C[0], u) + rand(RB, -3, 3), lerp(F[1], C[1], u)]);
      }

      const tn = rand(RB, .5, .85);
      const S = ribbon(P, rand(RB, .9, 1.4), rand(RB, 2, 2.9), rand(RB, 0, 6.2));
      pen.knock(S); wash(S, 'teal', tn); wash(S, 'yellow', tn * .55);
      pen.line(S, 'teal', .7, { closed: true, tone: .9, amp: 1.1 });

      // a leaf or two clasping the stem partway down
      if (RB() < .55) {
        const i0 = randi(RB, 2, 6), at = P[i0], nxt = P[i0 + 1];
        const ang = Math.atan2(nxt[1] - at[1], nxt[0] - at[0]) + (RB() < .5 ? -1 : 1) * rand(RB, 1.5, 2.3);
        const L = petal(at[0], at[1], ang, rand(RB, 26, 48), rand(RB, 5, 9), rand(RB, -7, 7));
        pen.knock(L); wash(L, 'teal', tn + .05); wash(L, 'yellow', tn * .5);
        pen.line(L, 'teal', .7, { closed: true, tone: .85, amp: 1 });
      }
      endElement();
    }
  }


  pen.ctx.save(); pen.ctx.translate(BQ.dx, BQ.dy);

  // soft masses behind everything (hydrangea / delphinium clouds)
  const masses = [[394, 524, 64, 54, .3], [382, 640, 56, 58, .27], [472, 468, 52, 44, .25], [340, 574, 44, 40, .23], [468, 656, 48, 44, .21], [514, 546, 42, 40, .2], [422, 440, 40, 36, .2], [486, 730, 38, 32, .18]];
  masses.forEach(([x, y, rx, ry, tn], k) => {
    const RM = stream('mass', k); element(x, y);
    for (let q = 0; q < 7; q++) {                       // a cluster of florets, not one smooth smudge
      const a = RM() * TAU, rr = Math.sqrt(RM());
      const fx = x + Math.cos(a) * rx * rr * .7, fy = y + Math.sin(a) * ry * rr * .7, fr = rand(RM, rx * .42, rx * .68);
      const P = pen.blob(fx, fy, fr, fr * rand(RM, .78, 1.1), 'fl' + k + q, .3, 9);
      wash(P, 'blue', tn); wash(P, 'coral', tn * .22);
    }
    wash(pen.blob(x, y, rx * .5, ry * .46, 'core' + k, .36, 11), 'blue', tn + .16);
    endElement();
  });

  // greenery inside the mass and spilling from the neck
  const RL = stream('leaves');
  for (let k = 0; k < 44; k++) {
    const src = k < 34 ? heads[Math.floor(RL() * heads.length)] : [NECK[0] + rand(RL, -40, 40), NECK[1] + rand(RL, -20, 60)];
    const px = src[0] + rand(RL, -22, 22), py = src[1] + rand(RL, -20, 20);
    const la = rand(RL, -Math.PI * 1.05, .1), len = rand(RL, 20, 50);
    const P = petal(px, py, la, len, rand(RL, 4, 9), rand(RL, -6, 6));
    element(px, py);
    wash(P, 'teal', rand(RL, .4, .72)); wash(P, 'yellow', rand(RL, .25, .5));
    endElement();
  }

  // filler heads: the small stuff that makes it read as one mass
  const RF = stream('filler');
  heads.forEach(([hx, hy], k) => {
    const n = 2 + Math.floor(RF() * 2);
    for (let q = 0; q < n; q++) {
      const x = hx + rand(RF, -22, 22), y = hy + rand(RF, -20, 20), r = rand(RF, 6, 16);
      const P = pen.blob(x, y, r, r * rand(RF, .75, 1.25), 'f' + k + '_' + q, .32, 9);
      element(x, y);
      const roll = RF();
      if (roll < .3) { wash(P, 'blue', rand(RF, .24, .5)); wash(P, 'coral', rand(RF, .06, .16)); }
      else if (roll < .46) { pen.knock(P, .8); wash(P, 'yellow', .12); }        // pale blooms, holes in the colour
      else if (roll < .7) wash(P, 'coral', rand(RF, .28, .58));
      else if (roll < .86) { wash(P, 'teal', rand(RF, .3, .5)); wash(P, 'yellow', rand(RF, .2, .4)); }
      else wash(P, 'yellow', rand(RF, .45, .8));
      if (RF() < .3) pen.line(P, 'blue', .6, { closed: true, tone: .32, amp: .7 });
      endElement();
    }
  });

  // a handful of hero blooms, larger than everything around them
  const heroes = [[362, 512, 38, 'blue', .34], [446, 620, 34, 'blue', .3], [506, 540, 28, 'coral', .4], [392, 690, 30, 'coral', .32], [488, 430, 26, 'blue', .3]];
  heroes.forEach(([x, y, r, ink, tn], k) => {
    const RHb = stream('hero', k), n = 5 + Math.floor(RHb() * 2); element(x, y);
    for (let q = 0; q < n; q++) {
      const a = q / n * TAU + rand(RHb, -.15, .15);
      const P = petal(x, y, a, r * rand(RHb, .85, 1.15), r * .52, rand(RHb, -6, 6));
      wash(P, ink, tn); wash(P, ink === 'blue' ? 'coral' : 'blue', .1);
    }
    wash(pen.blob(x, y, r * .3, r * .3, 'hc' + k, .2, 8), 'yellow', .8);
    endElement();
  });

  // tulips and poppies reaching out of the top
  const tulips = [[406, 388, -1.62, .58], [458, 364, -1.44, .48], [508, 400, -1.2, .64], [364, 434, -1.85, .44], [542, 458, -1.05, .42]];
  tulips.forEach(([x, y, a, tn], k) => {
    const RTu = stream('tp', k); element(x, y + 40);
    for (let q = -1; q <= 1; q++) {
      const P = petal(x, y + 50, a + q * .28, rand(RTu, 50, 70), 17, q * 9);
      wash(P, 'coral', tn); wash(P, 'blue', .13);
    }
    wash(pen.blob(x, y + 40, 15, 20, 'tb' + k, .22, 10), 'coral', tn + .12);
    endElement();
  });

  // cattails: the tall dark accents that break the silhouette
  const cats = [[336, 330, 74], [360, 360, 56], [482, 316, 66], [426, 308, 48]];
  cats.forEach(([x, y, h], k) => {
    element(x, y + h * .45);
    pen.line([[x + 8, y + h + 130], [x + 2, y + h]], 'teal', 1.6, { tone: .7, amp: .9 });
    const P = pen.blob(x, y + h * .45, 7.5, h * .45, 'cat' + k, .12, 11);
    wash(P, 'coral', .55); wash(P, 'blue', .5);
    endElement();
  });

  // small yellow starbursts
  const RY = stream('yel');
  for (let k = 0; k < 18; k++) {
    const [hx, hy] = heads[Math.floor(RY() * heads.length)];
    const x = hx + rand(RY, -26, 26), y = hy + rand(RY, -24, 24), r = rand(RY, 9, 16);
    element(x, y);
    for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + RY(); wash(petal(x, y, a, r, r * .32), 'yellow', .9); }
    pen.dot(x, y, r * .3, 'coral', .8);
    endElement();
  }

  // the daisies — white, so they read as holes punched in the colour
  const daisies = [[410, 506, 33], [478, 566, 27], [348, 552, 24], [512, 486, 21], [338, 468, 19], [458, 660, 22], [404, 668, 18], [508, 632, 17], [414, 598, 15], [478, 736, 15]];
  daisies.forEach(([x, y, r], k) => {
    const RD = stream('daisy', k), n = 9 + Math.floor(RD() * 4); element(x, y);
    for (let q = 0; q < n; q++) {
      const a = q / n * TAU + rand(RD, -.12, .12);
      const P = petal(x, y, a, r * rand(RD, .85, 1.15), r * .3, rand(RD, -3, 3));
      pen.knock(P, .93); wash(P, 'yellow', .09); pen.line(P, 'blue', .7, { closed: true, tone: .42, amp: .6 });
    }
    solid(pen.circle(x, y, r * .3, 12), 'yellow', .95);
    pen.line(pen.circle(x, y, r * .3, 12), 'coral', .8, { closed: true, tone: .5 });
    endElement();
  });

  // pollen in the air
  const RP = stream('pollen');
  for (let k = 0; k < 18; k++) {
    const px = MC[0] + rand(RP, -200, 200), py = MC[1] + rand(RP, -230, 250), pr = rand(RP, 1.4, 2.8);
    element(px, py); pen.dot(px, py, pr, 'yellow', .9); endElement();
  }

  pen.ctx.restore();
  T.done();
}

/* ============================================================
   LAYER 3 — what sits in front of the bunch: fingers, head, hat
   ============================================================ */
function drawFront(pen) {
  const T = tools(pen), { wash, solid, petal, skin, capsule } = T;
  T.art();
  { for (let k = 0; k < 2; k++) {
      const f = capsule([FX0 - 17, FY0 - 7 + k * 9], [FX0 + 10, FY0 - 10 + k * 9], 4.2);
      skin(f, .28, .38); pen.line(f, 'blue', 1, { closed: true, tone: .82, amp: .6 });
    }
    const th = capsule([FX0 + 14, FY0 - 13], [FX0 - 3, FY0 + 2], 4.4);           // thumb folded across
    skin(th, .32, .38); pen.line(th, 'blue', 1.05, { closed: true, tone: .82, amp: .6 });
  }

  { // the hanging hand: one relaxed shape, two creases, nothing more
    const hx = WRI_F[0] - 1, hy = WRI_F[1] + 12;
    const rest = smooth([[hx - 9, hy - 8], [hx + 8, hy - 9], [hx + 10, hy + 6], [hx + 2, hy + 14], [hx - 8, hy + 10]], true, 3);
    skin(rest, .26, .38); pen.line(rest, 'blue', 1.1, { closed: true, tone: .8, amp: .8 });
    pen.line([[hx - 4, hy + 3], [hx - 1, hy + 12]], 'blue', .8, { tone: .5, amp: .7 });
    pen.line([[hx + 3, hy + 2], [hx + 5, hy + 10]], 'blue', .8, { tone: .5, amp: .7 });
  }

  /* ---- the head: skull, profile, beard, then the hat sitting ON it ---- */
  pen.ctx.save(); pen.ctx.translate(HX, 800); pen.ctx.rotate(.24); pen.ctx.translate(-HX, -800);
  const skull = smooth([[HX - 26, 758], [HX - 21, 738], [HX - 2, 731], [HX + 16, 739], [HX + 21, 762], [HX + 13, 788], [HX - 7, 795], [HX - 24, 782]], true, 3);
  skin(skull, .2, .36);
  pen.line(skull, 'blue', 1.2, { closed: true, tone: .75, amp: .9 });
  // ear
  { const ear = pen.circle(HX + 16, 766, 5, 12); skin(ear, .26, .36); pen.line(ear, 'blue', .9, { closed: true, tone: .7, amp: .6 });
    pen.line([[HX + 14, 763], [HX + 17, 767], [HX + 14, 770]], 'blue', .7, { tone: .6, amp: .5 }); }
  // the profile: a nose that breaks the silhouette on the left
  { const nose = smooth([[HX - 25, 757], [HX - 34, 768], [HX - 24, 772]], true, 2);
    skin(nose, .24, .36); pen.line([[HX - 25, 757], [HX - 34, 768], [HX - 24, 772]], 'blue', 1.1, { tone: .75, amp: .6 }); }
  pen.dot(HX - 16, 761, 2.4, 'blue', .95);                                                    // eye
  pen.line([[HX - 22, 754], [HX - 11, 753]], 'blue', 1.1, { tone: .7, amp: .8 });             // brow
  // beard and moustache, white
  { // one shape: moustache, cheeks and a chin that comes to a point
    const beard = smooth([[HX - 28, 770], [HX - 18, 765], [HX - 8, 772], [HX + 4, 769], [HX + 14, 776], [HX + 16, 788],
                          [HX + 6, 798], [HX - 8, 808], [HX - 20, 803], [HX - 28, 790]], true, 3);
    solid(beard, 'paper', 0);
    pen.line(beard, 'blue', 1.2, { closed: true, tone: .65, amp: 1.1 });
    pen.line([[HX - 24, 774], [HX - 16, 777], [HX - 6, 774]], 'blue', .9, { tone: .5, amp: .8 });   // under the moustache
    for (let k = 0; k < 3; k++)                                                                     // hair following the jaw to the chin
      pen.line([[HX - 20 + k * 11, 782 - k], [HX - 16 + k * 9, 793], [HX - 9 + k * 3, 802]], 'blue', .6, { tone: .3, amp: 1.2 }); }
  // a wisp of white hair at the nape
  { const nape = smooth([[HX + 12, 774], [HX + 21, 778], [HX + 20, 787], [HX + 11, 786]], true, 3);
    solid(nape, 'paper', 0); pen.line(nape, 'blue', .8, { closed: true, tone: .55, amp: .9 }); }

  // ---- the hat, crown first then brim, so it reads as sitting down on the skull
  const crown = smooth([[HX - 27, 742], [HX - 23, 715], [HX - 3, 706], [HX + 17, 714], [HX + 22, 742]], true, 3);
  solid(crown, 'yellow', .7); T.wash(crown, 'coral', .16); T.wash(crown, 'blue', .06);
  pen.line(crown, 'blue', 1.5, { closed: true, tone: .85, amp: .9 });
  const brim = pen.circle(HX - 2, 740, 1, 26).map(([x, y]) => [HX - 2 + (x - (HX - 2)) * 55, 740 + (y - 740) * 11 ]);
  solid(brim, 'yellow', .62); T.wash(brim, 'coral', .12); T.wash(brim, 'blue', .07);
  pen.line(brim, 'blue', 1.5, { closed: true, tone: .85, amp: .9 });
  pen.line([[HX - 26, 736], [HX + 20, 734]], 'coral', 2.4, { tone: .75, amp: .8 });            // band
  pen.line([[HX - 40, 742], [HX + 38, 740]], 'blue', .8, { tone: .45, amp: 1.1 });             // straw weave
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
  { x: 806, y: 452, s: 1.2, ink: 'coral', tone: .72, tilt: .18, key: 'a', ax: 46, ay: 30, ph: 0 },
  { x: 214, y: 352, s: .66, ink: 'coral', tone: .62, tilt: -.32, key: 'b', ax: 36, ay: 26, ph: 2.3 },
  { x: 168, y: 706, s: 1.0, ink: 'blue', tone: .46, tilt: .38, key: 'c', ax: 54, ay: 34, ph: 4.1 },
];

function drawFlyers(pen, t) {
  const T = tools(pen), { wash, petal } = T;
  T.art();
  const th = TAU * t / LOOP;

  for (const B of FLYERS) {
    const u = th + B.ph;
    const x = B.x + B.ax * Math.sin(u) + B.ax * .42 * Math.sin(2 * u + .6);
    const y = B.y + B.ay * Math.sin(2 * u + 1.2) + B.ay * .38 * Math.sin(3 * u);
    const tilt = B.tilt + .26 * Math.cos(u) + .10 * Math.sin(2 * u);
    const flap = .30 + .70 * (.5 + .5 * Math.cos(TAU * 64 * t / LOOP + B.ph * 3));   // 64 beats to the loop
    const lift = .90 + .10 * flap;
    const s = B.s, ink = B.ink, RB = stream('fly', B.key);

    const wing = (a, L, W, tn) => {
      const P = petal(x, y, a + tilt, L * s, W * s, 0).map(([px, py]) => [x + (px - x) * flap, y + (py - y) * lift]);
      wash(P, ink, tn); wash(P, 'yellow', .18);
      pen.line(P, 'blue', .9, { closed: true, tone: .45, amp: 0 });
      for (let q = 0; q < 3; q++) {
        const v = rand(RB, .35, .85);
        let sx = x + Math.cos(a + tilt) * L * s * v + rand(RB, -5, 5) * s;
        let sy = y + Math.sin(a + tilt) * L * s * v + rand(RB, -5, 5) * s;
        sx = x + (sx - x) * flap; sy = y + (sy - y) * lift;
        pen.dot(sx, sy, rand(RB, 1.6, 3) * s, 'blue', .65);
      }
    };
    wing(-2.62, 40, 19, B.tone); wing(-0.52, 40, 19, B.tone);                 // upper wings
    wing(2.86, 28, 13, B.tone * .85); wing(0.28, 28, 13, B.tone * .85);       // lower wings
    pen.line([[x, y - 12 * s], [x + Math.sin(tilt) * 6 * s, y + 15 * s]], 'blue', 2 * s, { tone: .85, amp: 0 });
    pen.line([[x, y - 10 * s], [x - 11 * s, y - 24 * s]], 'blue', .9, { tone: .7, amp: 0 });
    pen.line([[x, y - 10 * s], [x + 9 * s, y - 25 * s]], 'blue', .9, { tone: .7, amp: 0 });
    pen.dot(x - 11 * s, y - 24 * s, 1.4 * s, 'blue', .8); pen.dot(x + 9 * s, y - 25 * s, 1.4 * s, 'blue', .8);
  }
  T.done();
}

/* ============================================================
   LIVE — leaves coming loose from the bunch and drifting down.
   Each fades in and out inside its own cycle, so at the wrap every one of
   them is already invisible and nothing pops.
   ============================================================ */
function drawFalling(pen, t) {
  const T = tools(pen), { wash, petal } = T;
  T.art();
  for (let k = 0; k < 5; k++) {
    const R = stream('fall', k);
    const sx = MC[0] + BQ.dx + rand(R, -MRX * .45, MRX * .25);
    const sy = MC[1] + BQ.dy + rand(R, MRY * .4, MRY * .72);
    const u = ((t / LOOP) + k / 5 + rand(R, 0, .08)) % 1;
    const drift = rand(R, 14, 32), spins = randi(R, 1, 2);
    const len = rand(R, 19, 31), wid = rand(R, 6, 10);
    const slide = rand(R, -34, 18), fall = rand(R, 190, 320), a0 = rand(R, 0, TAU);
    const g = clamp(u / .10, 0, 1) * clamp((1 - u) / .28, 0, 1);
    if (g <= .04) continue;
    const x = sx + Math.sin(u * TAU * 1.5 + k) * drift + u * slide;
    const y = sy + u * fall;
    const P = petal(x, y, a0 + u * TAU * spins, len, wid, Math.sin(u * TAU * 2) * 5);
    wash(P, 'teal', .62 * g); wash(P, 'yellow', .38 * g);
    pen.line(P, 'teal', .7, { closed: true, tone: .8 * g, amp: 0 });
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
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  blitSprites(ctx, cache, 0, 0, bunchOffset(s, t));
  ctx.restore();
  drawFront(pen);
  drawFlyers(pen, t);
  drawFalling(pen, t);
}
