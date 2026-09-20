'use strict';
/* ============================================================
   SCENE — "ship it, then sleep"  ·  a developer's room
   Strictly back to front: walls -> floor -> standing things
   sorted by (i+j) -> things on top of things -> air.
   ============================================================ */
const ROOM = { w: 6.6, d: 6.2, h: 3.0, style: { floor: ['coral', .5], wall: ['blue', .3], wall2: ['blue', .4], plank: .8 } };

function drawScene(pen, t) {
  const p = pen.p;
  const onI = (u, z) => p(u, .02, z);      // a point on the back-RIGHT wall
  const onJ = (u, z) => p(.02, u, z);      // a point on the back-LEFT wall
  const wq = (wall, u, z, w, h) => pen.wallQuad(wall, u, z, w, h);
  // a light pool with soft, irregular edges — hard rectangles of light look wrong
  const softLight = (pts, s) => pen.light(smooth(pts, true, 3), s);

  /* ---------------------------------------------------------
     1. BACK-LEFT WALL — window on the night, shelves
     --------------------------------------------------------- */
  {
    const u0 = 3.7, z0 = 1.2, ww = 2.0, wh = 1.4;
    pen.fill(wq('j', u0, z0, ww, wh), 'blue', .82);                       // night outside
    for (let k = 0; k < 26; k++) {                                        // city lights on the far side
      const Rs = stream('city', k), u = rand(Rs, u0 + .1, u0 + ww - .1), z = rand(Rs, z0 + .1, z0 + wh - .5);
      const tw = .45 + .55 * Math.sin(t * 1.6 + k * 2.3);
      pen.dot(...onJ(u, z), rand(Rs, .7, 1.6), 'yellow', .55 + tw * .45);
    }
    const moon = Array.from({ length: 20 }, (_, k) => { const a = k / 20 * Math.PI * 2; return onJ(u0 + 1.58 + Math.cos(a) * .16, z0 + 1.08 + Math.sin(a) * .18); });
    pen.fill(moon, 'yellow', .9);
    pen.line(wq('j', u0, z0, ww, wh), 'blue', 1.9, { closed: true });      // frame
    pen.line([onJ(u0 + ww / 2, z0), onJ(u0 + ww / 2, z0 + wh)], 'blue', 1.2);
    pen.line([onJ(u0, z0 + wh * .52), onJ(u0 + ww, z0 + wh * .52)], 'blue', 1.2);
    pen.line([onJ(u0 - .14, z0 - .04), onJ(u0 + ww + .14, z0 - .04)], 'blue', 2.4);   // sill
    // a small plant on the sill, leaning into the light
    for (let k = 0; k < 5; k++) {
      const a = -1.9 + k * .38, L = 11 + k % 3 * 4, [x, y] = onJ(u0 + .35, z0 - .02);
      pen.shape(pen.leaf([x, y], [x + Math.cos(a) * L + Math.sin(t * 1.1 + k) * 1.2, y + Math.sin(a) * L], 3.4), ['teal', .7 + k * .04], { w: .7 });
    }
  }

  // shelves: three planks of books and junk
  for (let r = 0; r < 3; r++) {
    const z = .95 + r * .6, u0 = .45, wid = 2.7, dep = .4;
    pen.box(0, u0, z, dep, wid, .07, { ink: 'coral', tone: .7, shadow: false, w: .9 });
    const Rb = stream('shelf', r);
    let a = .08;
    while (a < wid - .25) {
      const bw = rand(Rb, .09, .17), bh = rand(Rb, .3, .48), lean = Rb() < .12;
      if (Rb() < .08) { a += rand(Rb, .12, .3); continue; }                 // a gap
      const q = lean
        ? [onJ(u0 + a, z + .07), onJ(u0 + a + bw + .1, z + .07), onJ(u0 + a + bw + .16, z + .07 + bh), onJ(u0 + a + .06, z + .07 + bh)]
        : [onJ(u0 + a, z + .07), onJ(u0 + a + bw, z + .07), onJ(u0 + a + bw, z + .07 + bh), onJ(u0 + a, z + .07 + bh)];
      pen.fill(q, pick(Rb, ['coral', 'yellow', 'teal', 'paper', 'teal', 'coral']), rand(Rb, .45, .95));
      pen.line(q, 'blue', .55, { closed: true, amp: .12 });
      a += bw + .015;
    }
  }
  // a small trophy-ish mug and a rubber duck on the top shelf
  {
    const [x, y] = onJ(2.85, 2.22);
    pen.shape(smooth([[x - 4, y], [x + 4, y], [x + 4, y - 9], [x - 4, y - 9]], true, 1), ['yellow', .8], { w: .9 });
    pen.line([[x + 4, y - 3], [x + 8, y - 4.5], [x + 4, y - 6]], 'blue', 1.1);
  }

  /* ---------------------------------------------------------
     2. BACK-RIGHT WALL — whiteboard, stickies, clock, LED strip
     --------------------------------------------------------- */
  {
    const u0 = .6, z0 = 1.5, bw = 2.5, bh = 1.15;
    pen.fill(wq('i', u0, z0, bw, bh), 'paper', 0);
    pen.line(wq('i', u0, z0, bw, bh), 'blue', 2, { closed: true });
    pen.line([onI(u0 + .08, z0 - .05), onI(u0 + bw - .08, z0 - .05)], 'blue', 2.6);       // marker tray
    pen.line([onI(u0 + .45, z0 - .06), onI(u0 + .85, z0 - .06)], 'coral', 2.2, { amp: .1 });
    pen.line([onI(u0 + .95, z0 - .06), onI(u0 + 1.3, z0 - .06)], 'teal', 2.2, { amp: .1 });
    // boxes-and-arrows: the architecture nobody has updated in six months
    const nodes = [[.28, .76, .56, .24], [1.2, .78, .6, .24], [.45, .32, .56, .22], [1.5, .3, .7, .24], [1.95, .74, .45, .2]];
    nodes.forEach(([a, b, w, h], k) => {
      const q = [onI(u0 + a, z0 + b), onI(u0 + a + w, z0 + b), onI(u0 + a + w, z0 + b + h), onI(u0 + a, z0 + b + h)];
      pen.line(q, k === 4 ? 'coral' : 'blue', 1.15, { closed: true, amp: .35 });
      for (let l = 0; l < 2; l++) pen.line([onI(u0 + a + .07, z0 + b + h - .07 - l * .08), onI(u0 + a + w * (l ? .5 : .78), z0 + b + h - .07 - l * .08)], 'blue', .7, { tone: .7, amp: .25 });
    });
    const arrow = (a0, b0, a1, b1, ink) => {
      pen.line([onI(u0 + a0, z0 + b0), onI(u0 + (a0 + a1) / 2, z0 + (b0 + b1) / 2 + .06), onI(u0 + a1, z0 + b1)], ink, 1, { amp: .3 });
      const [hx, hy] = onI(u0 + a1, z0 + b1), dir = a1 > a0 ? -1 : 1;
      pen.line([[hx + dir * 5, hy - 4], [hx, hy], [hx + dir * 5, hy + 3]], ink, 1, { amp: .2 });
    };
    arrow(.84, .88, 1.2, .9, 'blue'); arrow(.56, .76, .7, .54, 'blue');
    arrow(1.32, .78, 1.65, .54, 'blue'); arrow(1.78, .44, 2.0, .72, 'coral');
    // a question mark someone added in pink
    { const [x, y] = onI(u0 + 2.26, z0 + .46); pen.line([[x - 3, y - 7], [x + 2, y - 9], [x + 3, y - 4], [x, y - 1]], 'coral', 1.6, { amp: .4 }); pen.dot(x, y + 3, 1.4, 'coral'); }
  }
  // sticky notes, slightly crooked
  for (let k = 0; k < 7; k++) {
    const Rs = stream('sticky', k), u = 3.35 + (k % 3) * .48, z = 2.3 - Math.floor(k / 3) * .46 + rand(Rs, -.03, .03), s = .2, sk = rand(Rs, -.05, .05);
    const q = [onI(u, z), onI(u + s, z + sk), onI(u + s, z + s + sk), onI(u, z + s)];
    pen.fill(q, pick(Rs, ['yellow', 'yellow', 'coral', 'teal']), rand(Rs, .55, .9));
    pen.line(q, 'blue', .6, { closed: true, amp: .2 });
    for (let l = 0; l < 2; l++) pen.line([onI(u + .04, z + .13 - l * .05), onI(u + s - .05, z + .13 - l * .05 + sk)], 'blue', .5, { tone: .6, amp: .2 });
  }
  { // a poster: one big shape, printed in two inks
    const u = 4.62, z = 1.52, w = .62, h = .82, q = pen.wallQuad('i', u, z, w, h);
    pen.fill(q, 'paper', 0);
    const arc = [];
    for (let k = 0; k <= 16; k++) { const a = Math.PI + k / 16 * Math.PI; arc.push(onI(u + w / 2 + Math.cos(a) * .22, z + .3 + Math.sin(a) * .26)); }
    pen.fill(arc, 'coral', .85);
    for (let k = 0; k < 3; k++) pen.line([onI(u + .1, z + .68 - k * .07), onI(u + w - .1, z + .68 - k * .07)], 'blue', .8, { tone: .7, amp: .2 });
    pen.line(q, 'blue', 1.4, { closed: true });
  }
  // wall clock, 01:47
  {
    const cu = 5.4, cz = 2.25, disc = Array.from({ length: 22 }, (_, k) => { const a = k / 22 * Math.PI * 2; return onI(cu + Math.cos(a) * .26, cz + Math.sin(a) * .28); });
    pen.shape(disc, ['paper', 0], { w: 1.4 });
    const [cx, cy] = onI(cu, cz);
    pen.line([[cx, cy], [cx + 7, cy - 6]], 'blue', 1.4, { amp: .15 });
    const a = t * .55;
    pen.line([[cx, cy], [cx + Math.cos(a) * 11, cy + Math.sin(a) * 11]], 'coral', 1, { amp: .15 });
    pen.dot(cx, cy, 1.4, 'blue');
  }

  /* ---------------------------------------------------------
     3. FLAT FLOOR THINGS
     --------------------------------------------------------- */
  { // rug
    const i = .4, j = 1.6, w = 4.7, d = 3.0;
    pen.shape(pen.floorQuad(i, j, w, d, .01), ['teal', .4], { w: 1 });
    pen.line(pen.floorQuad(i + .28, j + .28, w - .56, d - .56, .01), 'coral', 1.1, { closed: true, tone: .8 });
    for (let k = 0; k < 4; k++) pen.line(pen.floorQuad(i + .5 + k * .1, j + .5 + k * .1, w - 1 - k * .2, d - 1 - k * .2, .012), k % 2 ? 'blue' : 'coral', .7, { closed: true, tone: .55, amp: .3 });
    for (let a = .2; a < d; a += .34) { pen.line([p(i, j + a, 0), p(i - .18, j + a, 0)], 'teal', .6, { amp: .1 }); pen.line([p(i + w, j + a, 0), p(i + w + .18, j + a, 0)], 'teal', .6, { amp: .1 }); }
  }
  // cable run from the tower, along the skirting and under the rug
  pen.line([p(4.9, .9, .02), p(4.8, 1.7, .02), p(4.2, 2.1, .02), p(4.5, 2.7, .02)], 'blue', 1.5, { tone: .85, amp: .5 });
  pen.line([p(4.9, .9, .02), p(5.5, 1.3, .02), p(5.6, 2.2, .02)], 'blue', 1.3, { tone: .8, amp: .5 });

  /* ---------------------------------------------------------
     4. THE DESK  (i 1.0 -> 5.6, against the back-right wall)
     --------------------------------------------------------- */
  const DI = .75, DJ = .35, DW = 4.0, DD = 1.1, DH = .76;
  const deskTop = DH;
  { // an LED strip behind the monitors washes the wall — soft edges, never a rectangle
    const band = [];
    for (let k = 0; k <= 14; k++) { const u = .7 + k / 14 * 3.9; band.push(onI(u, 1.42 + Math.sin(k) * .03)); }
    for (let k = 14; k >= 0; k--) { const u = .7 + k / 14 * 3.9; band.push(onI(u, .82 - Math.sin(k * .7) * .04)); }
    softLight(band, .2);
  }
  pen.tint(pen.floorQuad(DI + .15, DJ + .2, DW, DD, 0), 'blue', .32);                  // desk shadow
  for (const a of [DI + .05, DI + DW - .17]) for (const b of [DJ + .05, DJ + DD - .17])
    pen.box(a, b, 0, .12, .12, DH - .07, { ink: 'coral', tone: .8, shadow: false, w: .8 });
  pen.box(DI - .05, DJ - .05, DH - .07, DW + .1, DD + .1, .07, { ink: 'coral', tone: .55, left: .5, right: .6, shadow: false });

  // ---- PC tower under the desk, with LEDs that breathe
  {
    const i = 4.55, j = .5;
    pen.box(i, j, 0, .48, .78, 1.0, { ink: 'blue', tone: .9 });
    for (let k = 0; k < 5; k++) {
      const [x, y] = p(i + .02, j + .78, .78 - k * .13), on = .35 + .65 * Math.max(0, Math.sin(t * 2.4 - k * .8));
      pen.knock([[x + 4, y - 2], [x + 12, y - 2], [x + 12, y + 2], [x + 4, y + 2]], .5 * on);
      pen.dot(x + 8, y, 1.8, k === 2 ? 'coral' : 'teal', .35 + on * .65);
    }
    pen.line([p(i, j + .78, .95), p(i + .48, j + .78, .95)], 'teal', .8, { tone: .7 });
  }

  // ---- monitors
  const screenGlow = (i, w) => softLight(pen.floorQuad(i - .12, DJ + .34, w + .24, .6, deskTop + .005), .18);
  function monitor(i, w, h, content) {
    const j = DJ + .12, d = .11, z = deskTop;
    pen.box(i + w / 2 - .13, j + .1, z, .26, .3, .06, { ink: 'blue', tone: .85, shadow: false, w: .7 });   // foot
    pen.box(i + w / 2 - .05, j + .16, z + .06, .1, .1, .22, { ink: 'blue', tone: .9, shadow: false, w: .7 }); // neck
    pen.box(i, j, z + .28, w, d, h, { ink: 'blue', tone: .95, shadow: false, w: 1.1 });                    // bezel
    const jF = j + d, z0 = z + .33, i0 = i + .05, sw = w - .1, sh = h - .1;
    const sp = (a, b) => p(i0 + a, jF, z0 + b);
    const face = [sp(0, 0), sp(sw, 0), sp(sw, sh), sp(0, sh)];
    pen.fill(face, 'blue', 1);
    content(sp, sw, sh);
    pen.line(face, 'blue', .9, { closed: true, amp: .2 });
  }

  // monitor 1: an editor, scrolling
  screenGlow(1.0, 1.7);
  monitor(1.0, 1.7, .95, (sp, sw, sh) => {
    const rows = 22, step = sh / 9, Rc = stream('code');
    const lines = Array.from({ length: rows }, () => ({ ind: pick(Rc, [0, 0, .08, .16, .16, .24]), toks: Array.from({ length: randi(Rc, 2, 5) }, () => [rand(Rc, .09, .3), pick(Rc, ['teal', 'coral', 'yellow', 'paper'])]) }));
    const scroll = (t * .16) % 1;
    for (let k = 0; k < 9; k++) {
      const L = lines[(k + Math.floor(t * .16 * 9)) % rows], b = sh - .07 - (k - scroll) * step;
      if (b < .05 || b > sh - .05) continue;
      let a = .08 + L.ind;
      for (const [w, ink] of L.toks) {
        if (a + w > sw - .06) break;
        const q = [sp(a, b), sp(a + w, b), sp(a + w, b + .045), sp(a, b + .045)];
        pen.knock(q, .85); pen.tint(q, ink, .85);
        a += w + .035;
      }
    }
    // gutter + a blinking caret
    for (let k = 0; k < 9; k++) pen.dot(...sp(.045, sh - .05 - k * step), .8, 'teal', .5);
    if (Math.sin(t * 5) > 0) { const q = [sp(.5, sh - .38), sp(.53, sh - .38), sp(.53, sh - .33), sp(.5, sh - .33)]; pen.knock(q, .9); pen.tint(q, 'yellow', .9); }
  });

  // monitor 2: a dashboard that is not going in the right direction
  screenGlow(2.95, 1.4);
  monitor(2.95, 1.4, .82, (sp, sw, sh) => {
    const bars = 11, bw = (sw - .22) / bars;
    for (let k = 0; k < bars; k++) {
      const hgt = (.12 + .5 * (.5 + .5 * Math.sin(k * 1.3 + t * .9)) * (k / bars * .7 + .4)) * sh;
      const a = .11 + k * bw, q = [sp(a, .12), sp(a + bw * .68, .12), sp(a + bw * .68, .12 + hgt), sp(a, .12 + hgt)];
      pen.knock(q, .8); pen.tint(q, k > bars - 3 ? 'coral' : 'teal', .85);
    }
    pen.line([sp(.09, .1), sp(sw - .09, .1)], 'paper', .8, { tone: .7, amp: .1 });
    const pts = Array.from({ length: 12 }, (_, k) => sp(.11 + k * (sw - .22) / 11, sh - .22 + Math.sin(k * .9 + t * .6) * .05));
    pen.line(pts, 'yellow', 1.2, { amp: .3 });
  });

  // ---- desk surface: keyboard, mouse, mug, notebook, phone, lamp
  { // keyboard
    const i = 1.55, j = 1.08, w = 1.2, d = .36;
    pen.box(i, j, deskTop, w, d, .05, { ink: 'paper', tone: 0, shadow: false, w: .9 });
    const Rk = stream('keys');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
      const a = i + .05 + c * (w - .1) / 12, b = j + .05 + r * (d - .1) / 4;
      pen.tint(pen.floorQuad(a, b, .07, .05, deskTop + .051), 'blue', rand(Rk, .5, .85));
    }
    // two fingers tapping
    const tap = Math.sin(t * 9) > 0 ? 1 : 0;
    pen.dot(...p(i + .45, j + .16, deskTop + .07 + tap * .02), 2.2, 'coral', .35);
    pen.dot(...p(i + .72, j + .2, deskTop + .07 + (1 - tap) * .02), 2.2, 'coral', .35);
  }
  pen.box(2.95, 1.1, deskTop, .18, .28, .05, { ink: 'paper', tone: 0, shadow: false, w: .8 });   // mouse
  { // mug + steam
    const i = 3.75, j = .98, [x, y] = p(i, j, deskTop);
    pen.tint(pen.ellipse(i, j, deskTop + .002, .17, .17, 14), 'blue', .3);
    pen.shape([[x - 6, y - 1], [x + 6, y - 1], [x + 5, y - 15], [x - 5, y - 15]], ['coral', .8], { w: 1 });
    pen.line([[x + 5.5, y - 5], [x + 10, y - 7], [x + 5.5, y - 11]], 'coral', 1.4);
    pen.shape(pen.circle(x, y - 15, 5.3, 12), ['blue', .9], { w: .8, amp: .15 });
    for (let k = 0; k < 2; k++) {
      const P = [], ph = t * 1.5 + k * 1.8;
      for (let s = 0; s <= 9; s++) { const u = s / 9; P.push([x + (k - .5) * 4 + Math.sin(ph * 3 + u * 5) * 2.4 * u, y - 18 - u * 17]); }
      pen.line(P, 'blue', .8, { tone: .5, amp: .2 });
    }
  }
  { // notebook and pen
    const i = 4.25, j = .6;
    pen.box(i, j, deskTop, .4, .5, .04, { ink: 'yellow', tone: .75, shadow: false, w: .8 });
    for (let k = 0; k < 4; k++) pen.line([p(i + .06, j + .09 + k * .09, deskTop + .041), p(i + .34, j + .09 + k * .09, deskTop + .041)], 'blue', .5, { tone: .6 });
    pen.line([p(i - .1, j + .56, deskTop + .01), p(i + .32, j + .46, deskTop + .01)], 'coral', 2.2, { amp: .15 });
  }
  { // clamp lamp over the desk, flickering very slightly
    const i = .92, j = .5, h = 1.45, fl = .94 + .06 * noise(t * 2.2, 0, 77);
    pen.line([p(i, j, deskTop), p(i, j, deskTop + h)], 'blue', 1.6, { amp: .2 });
    pen.line([p(i, j, deskTop + h), p(i + .75, j + .25, deskTop + h - .18)], 'blue', 1.6, { amp: .2 });
    const [sx, sy] = p(i + .75, j + .25, deskTop + h - .18);
    softLight([[sx - 7, sy + 4], [sx + 7, sy + 4], [sx + 22, sy + 24], [sx + 26, sy + 42], [sx - 24, sy + 44], [sx - 27, sy + 25]], .16 * fl);
    pen.shape([[sx - 9, sy + 5], [sx + 9, sy + 5], [sx + 5, sy - 7], [sx - 5, sy - 7]], ['yellow', .85 * fl], { w: 1 });
    pen.dot(sx, sy + 4, 2.6, 'yellow', fl);
  }
  // a small plant at the end of the desk
  {
    const i = 4.6, j = 1.08, [x, y] = p(i, j, deskTop + .18);
    pen.box(i - .13, j - .13, deskTop, .26, .26, .2, { ink: 'coral', tone: .6, shadow: false, w: .8 });
    const Rp = stream('deskplant');
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + rand(Rp, -1.1, 1.1), L = rand(Rp, 9, 17), sway = Math.sin(t * 1.3 + k) * 1.1;
      pen.shape(pen.leaf([x, y], [x + Math.cos(a) * L + sway, y + Math.sin(a) * L], rand(Rp, 2.6, 4.2)), ['teal', rand(Rp, .6, .95)], { w: .7 });
    }
  }

  /* ---------------------------------------------------------
     5. THE DEVELOPER — a 22-second loop, typed out as a timeline
     --------------------------------------------------------- */
  developer(pen, t, 2.1, 2.05, p(2.1, 1.3, deskTop + .1));

  /* ---------------------------------------------------------
     6. THE REST OF THE ROOM, back to front by (i+j)
     --------------------------------------------------------- */
  { // floor lamp, right corner
    const i = 5.85, j = .95, h = 1.85, fl = .92 + .08 * noise(t * 2.6, 3, 11);
    pen.glow(i, j, 0, 1.1, 'yellow', .3 * fl);
    pen.fill(pen.ellipse(i, j, 0, .24), 'blue', .75);
    pen.line([p(i, j, 0), p(i, j, h)], 'blue', 1.5, { amp: .2 });
    const [sx, sy] = p(i, j, h);
    softLight([[sx - 7, sy + 5], [sx + 7, sy + 5], [sx + 19, sy + 24], [sx + 22, sy + 42], [sx - 21, sy + 44], [sx - 24, sy + 25]], .16 * fl);
    pen.shape([[sx - 9, sy + 6], [sx + 9, sy + 6], [sx + 5, sy - 7], [sx - 5, sy - 7]], ['coral', .8], { w: 1 });
  }
  // laundry-on-the-chair energy: a hoodie thrown over a stool
  {
    const i = 5.5, j = 2.4, [x, y] = p(i, j, .45);
    pen.box(i - .22, j - .22, 0, .44, .44, .45, { ink: 'coral', tone: .75, w: .9 });
    pen.shape(pen.blob(x, y - 6, 17, 11, 'hoodie', .18), ['teal', .7], { w: 1.1 });
    pen.line([[x - 10, y - 2], [x - 16, y + 9], [x - 12, y + 12]], 'teal', 2.4, { amp: .3, tone: .85 });
  }
  { // big plant, left corner
    const i = .5, j = 5.3, [x, y] = p(i, j, .48), Rp = stream('bigplant');
    pen.box(i - .32, j - .32, 0, .64, .64, .5, { ink: 'yellow', tone: .6 });
    for (let k = 0; k < 13; k++) {
      const a = -Math.PI / 2 + rand(Rp, -1.35, 1.35), L = rand(Rp, 20, 44), sway = Math.sin(t * 1.1 + k * .7) * 2;
      pen.shape(pen.leaf([x, y], [x + Math.cos(a) * L + sway, y + Math.sin(a) * L], rand(Rp, 4.5, 8)), ['teal', rand(Rp, .55, .95)], { w: .8 });
    }
  }
  { // cat asleep on a floor cushion, tail flicking
    const i = 4.85, j = 4.1, [x, y] = p(i, j, 0);
    pen.box(i - .38, j - .38, 0, .76, .76, .16, { ink: 'yellow', tone: .65, w: .9 });
    const cy = y - 10;
    pen.shape(pen.blob(x, cy, 17, 9, 'cat', .1), ['blue', .85], { w: 1 });
    pen.shape([[x + 9, cy - 5], [x + 12, cy - 13], [x + 15, cy - 5]], ['blue', .85], { w: .9 });
    pen.shape([[x + 15, cy - 5], [x + 18, cy - 12], [x + 20, cy - 3]], ['blue', .85], { w: .9 });
    const fl = Math.sin(t * 1.7) * 3;
    pen.line([[x - 15, cy + 3], [x - 22, cy + 1 + fl], [x - 19, cy - 6 + fl]], 'blue', 2.4, { amp: .2, tone: .9 });
    pen.dot(x + 16, cy - 4, 1, 'yellow');
  }
  { // a milk-crate side table with the old laptop still open on it
    const i = 2.05, j = 4.55;
    pen.box(i, j, 0, .8, .7, .45, { ink: 'coral', tone: .62 });
    for (let k = 1; k < 3; k++) pen.line([p(i, j + .7, .1 * k + .08), p(i + .8, j + .7, .1 * k + .08)], 'blue', .6, { tone: .6 });
    pen.box(i + .12, j + .12, .45, .5, .38, .03, { ink: 'blue', tone: .8, shadow: false, w: .8 });
    { const q = [p(i + .14, j + .16, .48), p(i + .6, j + .16, .48), p(i + .6, j + .16, .78), p(i + .14, j + .16, .78)];
      pen.fill(q, 'blue', 1);
      for (let k = 0; k < 4; k++) { const b = .72 - k * .06, r = [p(i + .18, j + .155, b), p(i + .18 + .1 + (k % 3) * .08, j + .155, b), p(i + .18 + .1 + (k % 3) * .08, j + .155, b + .03), p(i + .18, j + .155, b + .03)];
        pen.knock(r, .8); pen.tint(r, k === 1 ? 'coral' : 'teal', .8); }
      pen.line(q, 'blue', .9, { closed: true }); }
  }
  // floor clutter — the truth of the room
  {
    const mug = (i, j, ink) => { const [x, y] = p(i, j, 0); pen.tint(pen.ellipse(i, j, .002, .15, .15, 12), 'blue', .3); pen.shape([[x - 5, y], [x + 5, y], [x + 4, y - 12], [x - 4, y - 12]], [ink, .8], { w: .9 }); pen.shape(pen.circle(x, y - 12, 4.4, 12), ['blue', .85], { w: .7 }); };
    mug(2.9, 3.9, 'yellow'); mug(2.15, 4.5, 'teal');
    const Rs = stream('paper');
    for (let k = 0; k < 6; k++) {
      const i = rand(Rs, 1.1, 4.3), j = rand(Rs, 3.2, 5.1), s = rand(Rs, .28, .4);
      pen.shape(pen.floorQuad(i, j, s, s * 1.3, .012), ['paper', 0], { w: .8 });
      for (let l = 0; l < 3; l++) pen.line([p(i + .05, j + .1 + l * .12, .013), p(i + s - .06, j + .1 + l * .12, .013)], 'blue', .5, { tone: .55 });
    }
    // sneakers by the door edge
    for (const [i, j, k] of [[5.9, 4.8, 0], [5.6, 5.4, 1]]) {
      const [x, y] = p(i, j, 0);
      pen.shape(smooth([[x - 12, y], [x + 10, y - 2], [x + 12, y - 8], [x - 6, y - 9], [x - 12, y - 5]], true, 2), [k ? 'coral' : 'teal', .8], { w: 1 });
      pen.line([[x - 10, y - 1], [x + 11, y - 3]], 'paper', 1.6, { amp: .2 });
    }
    // a cardboard box that has never been unpacked, and a skateboard
    pen.box(3.85, 5.35, 0, .62, .56, .44, { ink: 'yellow', tone: .42, top: .28 });
    pen.line([p(3.94, 5.43, .45), p(4.38, 5.43, .45)], 'blue', 1, { tone: .8 });
    pen.line([p(3.85, 5.65, .24), p(4.47, 5.65, .24)], 'blue', .8, { tone: .6, amp: .3 });
    { const [x, y] = p(1.95, 5.75, 0);
      pen.tint(pen.ellipse(1.95, 5.75, .004, .55, .2, 16), 'blue', .3);
      pen.shape(smooth([[x - 26, y - 4], [x - 14, y - 8], [x + 14, y - 8], [x + 26, y - 4], [x + 14, y], [x - 14, y]], true, 2), ['teal', .8], { w: 1 });
      pen.dot(x - 17, y + 2, 2.4, 'blue', .9); pen.dot(x + 17, y + 2, 2.4, 'blue', .9); }
    // a power strip with too much plugged into it
    { const [x, y] = p(4.55, 3.15, 0);
      pen.shape([[x - 14, y], [x + 8, y - 7], [x + 14, y - 3], [x - 8, y + 4]], ['paper', 0], { w: .9 });
      for (let k = 0; k < 3; k++) pen.dot(x - 8 + k * 7, y - 1.5 - k * 2.2, 1.5, 'coral', .9); }
    // a stack of books someone means to read
    let z = 0;
    const Rb2 = stream('stack');
    for (let k = 0; k < 4; k++) { const th = rand(Rb2, .09, .14); pen.box(.95 + rand(Rb2, -.05, .05), 4.9 + rand(Rb2, -.05, .05), z, .55, .4, th, { ink: pick(Rb2, ['coral', 'teal', 'yellow']), tone: rand(Rb2, .5, .85), shadow: k === 0, w: .8 }); z += th; }
    { const [x, y] = p(1.2, 5.1, z); pen.shape([[x - 4, y], [x + 4, y], [x + 3, y - 10], [x - 3, y - 10]], ['paper', 0], { w: .8 }); }
  }

  /* ---------------------------------------------------------
     7. AIR — dust in the lamp light
     --------------------------------------------------------- */
  for (let k = 0; k < 16; k++) {
    const Rd = stream('dust', k), i = rand(Rd, .6, 5.4), j = rand(Rd, .4, 3.4), base = rand(Rd, .5, 2.3);
    const u = (t * rand(Rd, .04, .1) + Rd()) % 1;
    const [x, y] = p(i, j, base + u * .9);
    pen.dot(x + Math.sin(t * .6 + k) * 4, y, rand(Rd, .8, 1.5), 'yellow', .35 + .3 * Math.sin(t * 2 + k));
  }
}


/* ============================================================
   THE DEVELOPER
   type (8s) -> shove back off the desk -> a slow two-turn think
   -> roll in -> type again. Everything below is a function of
   one number, u, so the loop is seamless by construction.
   ============================================================ */
const LOOP = 22;
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// A body has depth as well as width. Build it from two elliptical cross-sections
// and take the hull, or it collapses to a sliver when he faces along the narrow
// isometric axis. (Monotone chain — the whole fix is these nine lines.)
function hull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}

function developer(pen, t, i0, j0, kb) {
  const p = pen.p, u = t % LOOP;

  // ---- the timeline ----
  const roll  = ss((u - 8) / 1.7) - ss((u - 17.2) / 1.7);   // 0 at the desk, 1 shoved back
  const spin  = TAU * 2 * ss((u - 9.9) / 6.9);              // two slow turns, landing back on 0
  const th    = spin + Math.sin(u * .7) * .05 * roll;       // a little drift while thinking
  const typing = (1 - roll) * (1 - ss((u - 7.4) / .6) + ss((u - 18.4) / .6));

  // ---- facing: th=0 means facing the desk (away from us, up-right) ----
  const fi = Math.sin(th), fj = -Math.cos(th);              // forward, in world tiles
  const ri = -fj, rj = fi;                                  // his right
  const P2 = (di, dj) => [(di - dj) * 32, (di + dj) * 16];   // a world offset, in screen px
  const F = m => P2(fi * m, fj * m), R = m => P2(ri * m, rj * m);
  const at = (base, ...offs) => offs.reduce((q, o) => [q[0] + o[0], q[1] + o[1]], base.slice());
  const fs = F(1), facingUs = fs[1] > 0;                    // is his face toward the camera?

  const ci = i0 + roll * .14, cj = j0 + roll * .95;
  const [bx, by] = p(ci, cj, 0);
  const seatZ = .47, breathe = Math.sin(t * 1.5) * .5;
  const seat = [bx, by - seatZ * 32];
  const hip  = [bx, by - seatZ * 32 - 2];
  const shY  = hip[1] - 30 + breathe + roll * 2.5;          // he sinks back a little when thinking
  const sh   = [bx + F(.09 * roll)[0], shY];

  // ---- coral over yellow makes an amber that isn't on any of the four drums,
  //      and it is the only warm-light thing in a room of coral, teal and navy ----
  const amber = (P, o = {}) => { pen.knock(P); pen.tint(P, 'yellow', o.a ?? 1); pen.tint(P, 'coral', o.b ?? .3); };
  const amberLine = (P, w, o = {}) => { pen.line(P, 'blue', w + .9, { ...o, tone: .7 }); pen.line(P, 'yellow', w, { ...o, tone: 1 }); pen.line(P, 'coral', w, { ...o, tone: .45 }); };

  pen.tint(pen.ellipse(ci, cj, .005, .48, .42, 16), 'blue', .3);

  // ---- chair: base and casters turn with him, which is what sells the spin ----
  for (let k = 0; k < 5; k++) {
    const a = th + k * TAU / 5, e = at([bx, by - 2], P2(Math.sin(a) * .46, -Math.cos(a) * .46));
    pen.line([[bx, by - 3], e], 'blue', 2.2, { amp: .2 });
    pen.dot(e[0], e[1] + 1, 2.1, 'blue', .9);
  }
  pen.line([[bx, by - 3], [bx, seat[1] + 2]], 'blue', 2.8, { amp: .15 });

  const seatQ = [at(seat, R(.3), F(.27)), at(seat, R(-.3), F(.27)), at(seat, R(-.3), F(-.27)), at(seat, R(.3), F(-.27))];
  pen.shape(smooth(seatQ, true, 2), ['blue', .55], { w: 1 });

  // ---- legs: tucked under the desk while typing, stuck out while he drifts ----
  const reach = .24 + roll * .3;
  for (const side of [-1, 1]) {
    const knee = at(hip, R(.17 * side), F(reach), [0, 4]), foot = at(knee, F(reach * .85), [0, 10 - roll * 3]);
    pen.line([at(hip, R(.17 * side)), knee, foot], 'blue', 3.4, { amp: .2, tone: .95 });
    pen.shape(smooth([at(foot, [-6, -3]), at(foot, [7, -4]), at(foot, [8, 2]), at(foot, [-6, 2])], true, 2), ['blue', .85], { w: .9 });
    pen.line([at(foot, [-5, 1.6]), at(foot, [7, .4])], 'paper', 1.8, { amp: .15 });
  }

  // ---- hood bunched at the back of his neck ----
  amber(smooth([at(sh, F(-.3), R(.2), [0, 2]), at(sh, F(-.4), [0, -2]), at(sh, F(-.3), R(-.2), [0, 2]), at(sh, F(-.06), [0, 5])], true, 3), { a: 1, b: .55 });

  // ---- torso ----
  const ring = (c, rx, ry, dy) => Array.from({ length: 14 }, (_, k) => { const a = k / 14 * TAU; return at(c, R(rx * Math.cos(a)), F(ry * Math.sin(a)), [0, dy]); });
  const torso = smooth(hull([...ring(hip, .4, .24, 4), ...ring(sh, .42, .25, 1)]), true, 2);
  amber(torso); pen.line(torso, 'blue', 1.3, { closed: true, tone: .9 });
  pen.line([at(sh, R(.36), [0, 13]), at(sh, R(-.36), [0, 13])], 'coral', 3.4, { amp: .25, tone: .95 });   // chest stripe
  if (facingUs) {                                            // kangaroo pocket + drawstrings, only when we can see them
    const pk = [at(hip, R(.26), [0, -4]), at(hip, R(-.26), [0, -4]), at(hip, R(-.2), [0, 3]), at(hip, R(.2), [0, 3])];
    pen.line(pk, 'blue', .9, { closed: true, tone: .75, amp: .3 });
    for (const sdx of [-.1, .1]) pen.line([at(sh, R(sdx), [0, 2]), at(sh, R(sdx * 1.4), [0, 13])], 'blue', 1.2, { amp: .3, tone: .8 });
  }

  // ---- arms: keyboard -> chin, cross-faded by `roll` ----
  const head = at(sh, F(.02), [0, -10]);
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const tap = Math.sin(t * 9) * 1.3 * typing;
  const kbR = [kb[0] + 7, kb[1] - tap], kbL = [kb[0] - 6, kb[1] + tap];
  const chin = at(head, F(.2), [0, 4]), lap = at(hip, F(.34), R(-.22), [0, -2]);
  const handR = mix(kbR, chin, roll), handL = mix(kbL, lap, roll);
  const arm = (side, hand) => {
    const s0 = at(sh, R(.44 * side), [0, 4]);
    const elbow = mix(s0, hand, .5), bend = at(elbow, R(.14 * side), [0, 5]);
    amberLine([s0, bend, hand], 3.6, { amp: .2 });
    pen.line([mix(bend, hand, .72), mix(bend, hand, .94)], 'coral', 3.8, { amp: .1, tone: .95 });   // cuff
    pen.dot(hand[0], hand[1], 3, 'coral', .3);
  };
  const order = R(1)[1] > 0 ? [-1, 1] : [1, -1];             // far arm first
  arm(order[0], order[0] < 0 ? handL : handR);

  // ---- head ----
  const hr = 9.2;
  pen.fill(pen.circle(head[0], head[1], hr, 18), 'blue', .95);                  // all hair to begin with
  pen.line([[head[0] - 2, head[1] - hr - 1], [head[0] + 1, head[1] - hr - 5], [head[0] + 4, head[1] - hr]], 'blue', 1.2, { amp: .4 });
  const faceAmt = clamp(fs[1] / 22, 0, 1);                                      // 0 facing away, 1 facing us
  if (faceAmt > .12) {                                                          // the face swings round with him
    const fc = at(head, [fs[0] * .2, fs[1] * .14 + 1.6]);
    const disc = Array.from({ length: 16 }, (_, k) => { const a = k / 16 * TAU; return [fc[0] + Math.cos(a) * hr * .66 * (.55 + .45 * faceAmt), fc[1] + Math.sin(a) * hr * .72]; });
    pen.fill(disc, 'coral', .26);
    pen.line(disc, 'blue', .7, { closed: true, tone: .5, amp: .2 });
    if (faceAmt > .3) {
      const blink = (t % 4.3) > 4.15 ? .3 : 1;
      for (const m of [-.095, .095]) { const e = at(fc, R(m), [0, -1.5]); pen.line([[e[0] - 1.9, e[1]], [e[0] + 1.9, e[1]]], 'blue', 2.1 * blink, { amp: 0 }); }
      const mo = at(fc, [0, 3.8]);
      pen.line([[mo[0] - 2.2, mo[1]], [mo[0] + 2.2, mo[1] - .6]], 'blue', 1, { amp: .2 });
    }
  }
  pen.line(pen.circle(head[0], head[1], hr, 18), 'blue', 1.2, { closed: true, amp: .2 });
  { const n = at(sh, [0, -2]); pen.line([[n[0] - 3, n[1]], [n[0] + 3, n[1]]], 'coral', 2.6, { amp: .1, tone: .35 }); }   // neck
  { // headphones — the cups slide round his head as he turns
    const band = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI, e = at(head, R(Math.cos(a) * .3), [0, Math.sin(a) * hr * 1.15]); band.push(e); }
    pen.line(band, 'coral', 2.2, { amp: .15 });
    for (const m of [-.3, .3]) { const c = at(head, R(m), [0, 1.5]); pen.shape(pen.circle(c[0], c[1], 3.2, 10), ['coral', .95], { w: .8 }); }
  }

  arm(order[1], order[1] < 0 ? handL : handR);               // near arm over the torso

  // ---- backrest: only in front of him when his back is toward us ----
  const bo = F(-.36), backNear = bo[1] > 0;
  const drawBack = () => {                                   // a mesh back: you can see him through it
    const c = at(seat, bo, [0, -4]), h = 26;
    const q = [at(c, R(.3), F(.05)), at(c, R(-.3), F(.05)), at(c, R(-.26), F(-.05), [0, -h]), at(c, R(.26), F(-.05), [0, -h])];
    pen.tint(q, 'blue', .1);
    for (let k = 1; k < 5; k++) { const y = -h * k / 5, m = .3 - .04 * k / 5; pen.line([at(c, R(m), [0, y]), at(c, R(-m), [0, y])], 'blue', .6, { tone: .55 }); }
    for (const m of [-.15, 0, .15]) pen.line([at(c, R(m)), at(c, R(m * .88), [0, -h])], 'blue', .6, { tone: .42 });
    pen.line(q, 'blue', 1.4, { closed: true });
    pen.line([at(c, R(.3), [0, -h]), at(c, R(-.3), [0, -h])], 'blue', 2.2, { amp: .2 });   // head rest bar
  };
  if (backNear) drawBack();

  // ---- armrests ----
  for (const side of [-1, 1]) {
    const a0 = at(seat, R(.36 * side), F(-.18), [0, -6]), a1 = at(a0, F(.42));
    pen.line([a0, a1], 'blue', 2.6, { amp: .15, tone: .9 });
  }
  if (!backNear) drawBack();

  // ---- a thought bubble while he spins ----
  const think = ss((u - 10.6) / 1.2) - ss((u - 16.2) / 1.2);
  if (think > .02) {
    const o = at(head, [14, -16]);
    for (let k = 0; k < 3; k++) {
      const c = [o[0] + k * 6 + Math.sin(t * 1.2 + k) * 1.5, o[1] - k * 7], rr = (1.4 + k * 1.6) * think;
      pen.shape(pen.circle(c[0], c[1], rr, 12), ['paper', 0], { w: .9 });
    }
    if (think > .6) { const c = [o[0] + 22, o[1] - 20]; pen.dot(c[0], c[1] - 3, 1.5, 'coral', .9); pen.line([[c[0], c[1] + 3], [c[0], c[1] + 6]], 'coral', 1.2, { amp: .2 }); }
  }
}
