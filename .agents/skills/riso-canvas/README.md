# riso-canvas

Procedural risograph illustrations on HTML Canvas 2D — four inks, halftone
screens, plate misregistration, hand-drawn linework, paper grain. Two finished
scenes, the engine they share, and the machinery for animating them.

**If you are an agent importing this into a Remotion project, read
`references/remotion.md` first.** It has the component, the four changes needed,
and the one real risk (codecs and halftone). This file is the map.

---

## What is here

```
SKILL.md                     the working method — read this before drawing anything new
assets/
  riso.js                    THE ENGINE. ~370 lines, no dependencies. Copy it whole.
  template.html              a blank page wired up: engine + scene stub + runtime
  preview.png                what the engine's marks look like
references/
  craft.md                   figures, hands, faces, draw order, building colours
  animation.md               how to animate a scene too expensive to redraw
  workflow.md                the headless render loop and the numeric checks
  remotion.md                video export — START HERE for Remotion
scenes/
  bouquet/                   flat illustration, 1200x1500 (4:5), animated
  room/                      isometric cutaway room, animated, pan/zoom
tools/
  render.mjs                 render one frame of either scene to a PNG
  verify.mjs                 the five checks; run after any change
  package.json               one dependency: @napi-rs/canvas
```

Both scenes run against the single `assets/riso.js`. There is no second copy of
the engine anywhere — verified by rendering both scenes against it.

## Quick start

```bash
npm install --prefix tools @napi-rs/canvas   # or just: npm install @napi-rs/canvas
node tools/render.mjs bouquet 4.8 out.png
node tools/render.mjs room 3.2 room.png
node tools/verify.mjs
```

`verify.mjs` covers both scenes. Output on this package, for comparison after
you change anything:

```
BOUQUET  (16s loop, sprite-cached)
build: 194ms | sprites: 312 (255 multiply) | atlas: 2048x1300
1. cache fidelity        mean 0.101  >16: 0.111%   PASS
2. loop closure          mean 0.000  max 0         PASS
3. frame determinism     max 0                     PASS
4. shimmer               0.37% of pixels changing  PASS
5. frame cost            9.7ms                     PASS

ROOM  (22s loop, drawn live - no sprite cache)
2. loop closure          0.00% differing  max 0    PASS
3. frame determinism     max 0                     PASS
5. frame cost            36.8ms                    PASS
```

Check 2 is the one that matters most for video and check 3 for Remotion
specifically: the same frame reached in any order must be pixel-identical,
because parallel workers render frames out of order.

Or just open `scenes/bouquet/bouquet.html` / `scenes/room/room.html` in a
browser. They are self-contained, no build step, no server.

## How the files load

There is no module system. Files are concatenated in order and evaluated, so the
same sources work unchanged in a single-file HTML bundle, in Node for headless
rendering, and inside a React component. Load order matters:

```
riso.js  →  (letters.js)  →  scene file  →  runtime
```

Define `MKCANVAS(w, h)` before `riso.js`:

```js
// browser
const MKCANVAS = (w, h) => { const c = document.createElement('canvas');
                             c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
// node
globalThis.MKCANVAS = (w, h) => createCanvas(Math.ceil(w), Math.ceil(h));
```

If you would rather have real modules, the only work is adding exports — nothing
depends on the globals being global.

## The bouquet scene

`scenes/bouquet/` — a man holding an oversized bunch of wildflowers. 1200×1500,
16-second loop.

| symbol | what it is |
|---|---|
| `CW, CH` | 1200, 1500 — the logical canvas; scale with one number |
| `LOOP` | 16 — seconds; every motion is a harmonic of this |
| `drawBase(pen)` | figure behind the bunch: legs, boots, arms, torso, palm |
| `drawBunch(pen)` | stems and every flower — the expensive part, ~200ms |
| `drawFront(pen)` | fingers, head, hat |
| `drawFlyers(pen, t)` | butterflies — cheap, drawn live |
| `drawFalling(pen, t)` | drifting leaves — cheap, drawn live |
| `windAt(ax, ay, t)` | the wind field, in artwork units |
| `bunchOffset(S, t)` | the callback `blitSprites` wants |
| `drawBouquet(pen, t, S)` | everything, for stills and exports |

Animated, the shape is: bake `drawBase` and `drawFront` once, `captureSprites`
the bunch once, then per frame blit those three and draw the live marks.
`scenes/bouquet/runtime.browser.js` is a working example of exactly that.

`letters.js` is a stroke alphabet — glyphs as polylines, drawn with `pen.line` so
the wobble does the handwriting. Currently unused; `letter(pen, 'TEXT', cx, by,
cap, opts)` brings it back.

## The room scene

`scenes/room/` — an isometric cutaway developer's room. Uses `pen.p(i,j,z)`,
`pen.box`, `pen.shell`, `pen.wallQuad`. A 22-second character loop (typing →
shoves back → a slow two-turn think → rolls in → types again).

`ROOM` is the room definition; `drawScene(pen, t)` draws the contents;
`pen.shell(ROOM)` draws floor and walls. The browser runtime adds pan, zoom and
PNG export.

This one is **not** sprite-cached — it redraws live, about 37ms a frame at
1280x900. That is fine for 30fps offline rendering in Remotion but too slow for a
smooth interactive page at full size, which is why the browser runtime redraws
only on camera or frame change. If you need it cheaper, cache it the way the
bouquet is cached.

Its 22-second loop closes exactly, but that was **fixed after the fact** — the
scene originally used raw frequencies (`Math.sin(t * 1.4)`, a continuously
rotating clock hand, value noise for the lamp flicker) and none of them returned
to their starting state. `HZ(f)` snaps a frequency to the nearest harmonic of
`LOOP`, and `nseLoop(t, turns, seed)` samples value noise around a circle, which
is the only way to get a periodic wobble out of noise. Use both if you add
motion, and re-run `verify.mjs`.

## Things that will bite you

**Whole-pixel offsets.** The reason the halftone does not crawl is that every
blit lands on an integer pixel. If you render the canvas smaller than output and
scale it up with CSS, or blit at fractional offsets, the dots resample and shimmer
comes straight back. Render at exact output resolution.

**`resetInkCaches()` when you change canvas.** Halftone patterns belong to the
context that created them. Reusing them across contexts fails silently and looks
like corruption. Call it whenever you start drawing on a different canvas.

**Keep `boil: 0`.** Boil re-rolls plate misregistration and every line's wobble
seed per frame. It is right for hand-drawn animation and wrong for a still
camera, and it is terrible for a video encoder.

**Never introduce `Math.random` or `Date.now`.** Everything is seeded through
`stream(...keys)`. Determinism is what makes the caching, the loop and the
parallel frame rendering work at all.

**Codecs hate halftone.** See `references/remotion.md` — this is the most likely
thing to disappoint, and the fix is in encoding settings or a coarser `CELL`, not
in the drawing.

## Licence and credit

The riso engine idea and the isometric room conventions are adapted, with thanks,
from Ishaan Kalra's MIT-licensed `creative-skills`
(github.com/IshaanKalra2103/creative-skills), itself inspired by Kevin Ngo's
"a small light, room by room". The two scenes, the animation architecture, the
craft notes and the verification tooling here are new work.
