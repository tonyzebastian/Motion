---
name: riso-canvas
description: Draw or animate procedural risograph and screen-print artwork with the existing four-ink Canvas engine. Use when the user asks for that ink look, wants to extend the RisoCanvas compositions, or explicitly chooses this engine for a still or film.
---

# Riso Canvas

Illustrations where every mark is a function call. No images, no SVG, no WebGL —
one `<canvas>` and a renderer that simulates a printing process.

The trick is that you never draw a picture. You simulate a press: shapes are
knocked out to paper and then printed with an ink screened at a tone, the plates
are slightly out of register, the lines wobble, and the paper has grain. The
picture falls out of that.

## Start here

1. Copy `assets/riso.js` into the project. It is the whole engine (~330 lines)
   and has no dependencies. Define `MKCANVAS(w,h)` before loading it.
2. Copy `assets/template.html` and write your scene where it says so.
3. **Set up a headless render loop before drawing anything.** You cannot judge
   this style from code; you have to look at it. `references/workflow.md` has the
   setup and the numeric checks — do this first, it is the difference between
   three passes and fifteen.
4. Read `references/craft.md` before drawing figures, hands, faces or anything
   with a silhouette. It is a list of mistakes that cost real time.
5. Read `references/animation.md` only when you get to motion.

## The five rules of the look

1. **Nothing is a flat colour.** Every fill is paper knocked out, then an ink
   screened over it at a tone from 0 to 1. Four inks exist —
   `blue` `coral` `yellow` `teal` — and nothing else.
2. **Overlapping inks multiply.** That is how you get colours that are not on
   any drum. `yellow 1.0 + coral 0.5` is the amber of a work jacket;
   `coral 0.9 + blue 0.62` is boot leather; `blue + coral 0.22` is periwinkle.
   Reach for an overprint before you reach for a fifth ink, because there isn't one.
3. **Plates don't line up.** Each ink is offset about a pixel and its screen sits
   at a different angle. The moiré is the point. Don't fix it.
4. **Lines are drawn by hand.** `pen.line` resamples the path and pushes each
   point with noise indexed by arc length, so the wobble travels along the
   stroke instead of flickering per vertex.
5. **Light cannot come out of multiply.** Multiply only darkens. Every glow,
   sun patch and lamp is `pen.light` / `pen.glow`: lift the paper back up first,
   then print yellow on it.

## The two ways to lay ink down

Choosing between these is most of the craft.

```js
pen.fill(P, 'coral', .8);    // knock to paper, then tint — an opaque object
pen.tint(P, 'coral', .8);    // tint only — a wash; overlaps multiply and build up
```

Use `fill` for anything solid: a figure, a wall, a daisy petal that should read
as a hole punched in the colour. Use `tint` for anything that should accumulate:
petals over petals, foliage, soft masses, glazes. A bouquet made of `fill` looks
like stickers; the same bouquet made of `tint` has depth.

One exception worth knowing: a thin object lying **on** a dark area (a green stem
across an orange sweater) must `knock` first, or the multiply drags it to near
black. Wash where things should merge, knock where they should sit on top.

## What the pen gives you

```
pen.knock(P, a)              paper, opaque (or at alpha a)
pen.tint(P, ink, tone)       halftone ink, multiply
pen.fill(P, ink, tone)       knock + tint
pen.line(P, ink, w, opts)    wobbly stroke; {closed, amp, tone, dash, cap}
pen.shape(P, [ink,tone], o)  fill + outline
pen.dot(x, y, r, ink, tone)
pen.light(P, strength)       lift paper, then yellow — the only way to make light
pen.glow(x, y, r, ink, s)

pen.circle(x,y,r,n)          pen.blob(x,y,rx,ry,key,lump,n)     organic mass
pen.petal(x,y,ang,len,wid,c) pen.capsule(a,b,r)
pen.taper(a,b,r0,r1)         a limb, narrowing — see craft.md
pen.ribbon(P,r0,r1,wob)      a stem/cable/vine along a polyline
pen.p(i,j,z)                 isometric projection (only if you want one)
```

Globals: `stream(...keys)` seeded RNG, `rand/randi/pick`, `noise(x,y,seed)`,
`smooth(P,closed,iters)`, `resample`, `INKS`, `ANGLE`, `MISREG`, `CELL`.

## Never call Math.random

Everything is a pure function of its key:

```js
const R = stream('bookshelf', row);
const width = rand(R, .09, .17);
```

This is not a style preference. Determinism is what makes caching, animation and
diff-testing possible at all, and what stops the drawing changing every reload.
When a shape needs to stay put, give it a stable key — `pen.blob(x,y,rx,ry,'cat')`
returns the same cat every time.

## Composition

Density is the usual failure. An empty floor or a sparse bouquet reads as
unfinished. Aim high: 15–30 objects in a room, 40+ elements in a bunch of
flowers. Then check against the reference and cut.

Draw strictly back to front and be explicit about it. In a flat scene that means
listing the order; in an isometric one, sort standing objects by `i + j`
ascending. There is no z-buffer — order *is* depth, and most "why does this look
wrong" turns out to be an ordering bug rather than a geometry bug. See
`references/craft.md` § Draw order.

## Isometric scenes

`pen.p(i,j,z)` projects tile coordinates: `i` runs toward the lower right, `j`
toward the lower left, `z` up. One tile is about a person's shoulder width; a
person is ~1.7 tall, a table 0.75, a chair seat 0.45, a wall 3.

Rooms are a floor slab, plank lines, and two back walls (the `i` wall at `j=0`,
the `j` wall at `i=0`). Everything else is `pen.box` built from three quads:
top, and the two faces that point at the camera. Side faces are tinted darker
than the top — that single tonal step is what makes a box read as a solid.

## When recreating a reference image

Take the composition, the palette logic and the density. Do not try to match it
mark for mark — this medium has four inks and hard halftone edges, and a gouache
or watercolour reference will never come out the same. Say so up front rather
than iterating toward a match that cannot exist.

If the reference belongs to someone else, build something original in the same
spirit rather than a copy.

## Files

- `assets/riso.js` — the engine. Copy it whole.
- `assets/template.html` — a working page: engine, a scene stub, a runtime that
  fits the art to the window and exports a PNG on `P`.
- `references/craft.md` — figures, hands, faces, silhouettes, draw order,
  building colours by overprint. **Read before drawing people.**
- `references/animation.md` — how to animate a scene too expensive to redraw,
  and the three approaches that failed first.
- `references/workflow.md` — the headless render loop and the numeric checks.
- `references/remotion.md` — exporting to video. Read if the user mentions Remotion,
  video, MP4 or a rendered loop.
- `examples/bouquet.html` — flat illustration, animated, 4:5.
- `examples/room.html` — isometric cutaway room, animated, pan/zoom.

## Credit

The riso engine idea and the room-scene conventions are adapted, with thanks,
from Ishaan Kalra's MIT-licensed `creative-skills` repo
(github.com/IshaanKalra2103/creative-skills), itself inspired by Kevin Ngo's
"a small light, room by room". The animation architecture, the figure-drawing
notes and the verification workflow here are new.
