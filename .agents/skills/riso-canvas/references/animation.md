# Animating a scene you cannot afford to redraw

A dense riso illustration costs 100–250ms per full render. That is hopeless per
frame, so animation is an architecture problem before it is a motion problem.

## Contents
- The budget
- Three approaches that failed, and why
- What works: per-element sprites with preserved blend modes
- Building the atlas
- The wind field
- Making a loop actually loop
- Live marks
- Boil

---

## The budget

Measure first. Render ten frames headless and divide.

```
full redraw of the bouquet piece ................ 216 ms
three cached layers, 3 blits .................... 24 ms
312 element sprites from one atlas .............. 15 ms
```

Anything over ~16ms per frame needs caching. The question is only *what* you can
cache without changing how the drawing looks.

## Three approaches that failed, and why

Worth reading — each one is the obvious idea, and each is wrong for a different
reason.

**1. Bake the scene, rotate the layer.** Pivot the whole bouquet about the fist
and rotate a few degrees. It shimmers badly. Rotating a bitmap resamples it, and
a halftone dot grid is the worst thing you can resample — the dots beat against
the pixel grid and crawl. Nothing about the drawing is wrong; the compositing is.

**2. Bake into several layers by distance, move each separately.** This changes
the order things are painted in. A blue wash that belonged *under* a knocked-out
daisy ends up over it, and the whole bunch goes dark and oversaturated. A riso
drawing is order-dependent because `knock` is opaque; you cannot slice it by
element and keep the look.

**3. One correct bake, blitted in horizontal slices, each sheared.** No
resampling, and the tips travel further than the base, so it flexes. But it reads
as rows of pixels sliding, because that is what it is. Anything with a visible
straight edge gives it away.

## What works: per-element sprites with preserved blend modes

Cache **every element separately, along with the blend mode it was painted with**.
A pure wash composites back with `multiply`; anything that knocked out to paper
composites with `source-over`.

This is exact, not an approximation. A `multiply`-blitted sprite lands ink on the
backdrop identically to painting it in place, and its transparent pixels are
no-ops. Blitted in the original order at zero offset it reconstructs the painting;
give each sprite its own offset and every flower drifts on its own.

Mark elements in the scene with the no-op hooks from `riso.js`:

```js
element(x, y);            // anchor for the motion field
  ...all the marks for this flower...
endElement();
```

Then:

```js
const cache = captureSprites(drawBunch, scale, W, H);
blitSprites(ctx, cache, offX, offY, (ax, ay) => windAt(ax, ay, t));
```

**Verify it.** Composite at zero offset and diff against drawing the scene
straight. Expect mean difference under 0.2/255. The only pixels that legitimately
differ are elements that knock at *partial* alpha, where ordering genuinely
cannot be preserved — about 0.1% of the image, and invisible.

**Round every offset to a whole pixel.** A whole-pixel blit is a straight copy.
Anything else resamples the halftone and you are back to approach 1.

## Building the atlas

The first working version allocated one canvas per sprite and took **9.3 seconds**
to build. Allocating hundreds of canvas surfaces is expensive everywhere.

`captureSprites` instead runs the scene twice:

1. **Geometry only** — every pen method stubbed to a function that just records
   the transformed bounding box. Costs only path construction.
2. **For real** — shelf-pack the boxes onto one atlas, then redraw with each
   element translated into its slot by a device-space offset:

```js
const m = ac.getTransform();
ac.setTransform(1, 0, 0, 1, slot.sx - slot.bx, slot.sy - slot.by);
ac.transform(m.a, m.b, m.c, m.d, m.e, m.f);
```

164ms, one 2048×1300 canvas. Both passes consume the random streams in the same
order, so the two runs agree exactly.

## The wind field

Per-element motion should be a *field* sampled at each element's position, not
independent noise per element — otherwise neighbours diverge and the mass tears.

```js
function windAt(ax, ay, t) {
  const th = TAU * t / LOOP;
  const d = Math.hypot(ax - PIVOT[0], ay - PIVOT[1]);
  const v = clamp((d - 130) / 440, 0, 1), a = Math.pow(v, 1.4);
  const ph = hash2(Math.round(ax), Math.round(ay), 7) * TAU;   // stable per element
  return [a * (7.5*Math.sin(th - v*.55) + 3.2*Math.sin(2*th + 1.1 - v*.35)
             + 2.4*Math.sin(2*th + ph)),
          a * (2.0*Math.sin(2*th + .7) + 1.6*Math.sin(th + ph))];
}
```

Three things make this read as wind rather than as wobble:

- **amplitude grows with distance from the anchor**, so a held bunch flexes and
  the grip stays put;
- **phase lags with distance** (`th - v*.55`), so the gust travels through the
  object instead of every part turning at once;
- **a per-element phase** from a hash of position, so neighbours move together
  but not in lockstep.

Anchor anything that must not move — the stems inside a fist — at the pivot, so
its `v` is zero.

## Making a loop actually loop

Build every motion out of **integer harmonics of one period**:

```js
const LOOP = 16;                  // seconds
const th = TAU * t / LOOP;
// sin(th), sin(2th + p), sin(3th + q)  — all return to their start
```

- Butterfly flight: a closed figure-eight from `sin u`, `sin 2u`, `sin 3u`.
- Wing flap: `cos(TAU * 64 * t / LOOP)` — 64 beats, an integer, so the beat
  closes on the wrap too.
- Anything that appears and disappears (falling leaves): fade in over the first
  10% of its own cycle and out over the last 28%, so at the wrap every one is
  already invisible and nothing pops.

Then **prove it**: render `t = 0` and `t = LOOP` and diff. Mean 0.000, max 0.
If it is not exactly zero, something is not a harmonic.

## Live marks

Things too cheap to cache — butterflies, falling petals — get drawn live each
frame. One trap: `pen.line`'s wobble seed is derived from the path's first point,
so a moving object reseeds its own jitter every frame and buzzes. Pass `amp: 0`
on anything that moves, and let the shape carry the character instead.

## Boil

The engine's `boil` parameter re-rolls plate misregistration and every line's
wobble seed. That is how hand-drawn animation gets its shimmer, and it is right
for an exported loop — but in an interactive scene it reads as the whole image
vibrating. Keep `boil: 0` unless you specifically want it, and if you expose it,
make it a URL flag rather than the default.

## Runtime shape

```
build once:   base layer (bake)        — everything behind the animated part
              sprite cache (capture)   — the animated part
              front layer (bake)       — everything in front
per frame:    fill paper
              drawImage(base)
              blitSprites(bunch, offsetFn)
              drawImage(front)
              draw live marks
              multiply the grain over everything
```

Cap at 30fps; it is plenty for this look and halves the battery cost. Honour
`prefers-reduced-motion` by freezing at `t = 0`. Call `resetInkCaches()` whenever
you start drawing on a different canvas — halftone patterns belong to the context
that created them, and reusing them across contexts fails silently.
