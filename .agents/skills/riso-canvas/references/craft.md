# Craft notes

Everything here was learned by drawing something, looking at it, and finding it
bad. The fixes are mostly not about geometry.

## Contents
- Draw order is depth
- Figures: silhouette before detail
- Limbs
- Hands
- Heads and faces
- Making colours you don't have
- Density and the empty-floor failure
- Organic shapes
- Things that always look wrong

---

## Draw order is depth

There is no z-buffer. Order is the only depth cue, and most "this looks wrong"
bugs are ordering bugs.

**Arms go before the body.** Draw the torso *after* the arms and the sweater
covers each shoulder end, so the joint disappears and the two read as one
silhouette. Draw arms after the body and you get tubes lying on a chest.

But that only works if the torso is *narrower* than the arm's path. If the body
bulges out past the arm, the limb stays buried inside the silhouette and only
emerges near the elbow — which reads as an arm growing out of the ribs. Check
where the arm's outer edge actually crosses the body's edge; if that is more than
a few pixels below the shoulder point, narrow the shoulders.

**A held object needs three layers.** A hand gripping a bundle is:

```
palm            (before)
the bundle      (over the palm)
fingers, thumb  (over the bundle)
```

Drawing the whole hand over the object makes a mitten pressed against the front.
Drawing the whole hand behind makes the object float.

**If something is drawn behind the figure, it will read as behind the figure**,
no matter where you put it. Overlap is the only depth cue a flat drawing has. An
object beside a character reads as held only if the hand visibly closes on it
against empty paper, or if some part of it crosses in front of them.

## Figures: silhouette before detail

At illustration scale a figure is 300–500px tall. Detail below about 4px does not
register; silhouette and tonal contrast do all the work.

Give the figure a colour nothing else in the scene has. A character in the same
ink as the floor disappears however well drawn. If the palette is spoken for,
build a new colour by overprint (below) — that is what it is for.

Draw in this order and each step covers the seam of the last: shadow → legs →
boots → arms → torso → collar → held objects → hands → head → hat.

## Limbs

A limb is not a tube of one width. Use `pen.taper(a, b, r0, r1)` and make the
forearm start *narrower* than the upper arm ends:

```js
armPiece([FX - 32, 818], ELBOW, 16, 11.5);   // upper arm 16 → 11.5
armPiece(ELBOW,          WRIST, 11.5, 9.5);  // forearm 11.5 → 9.5
```

Equal widths at the joint is exactly why an elbow reads as a crease rather than a
fold.

Capsule limbs also need real horizontal separation between the two segments or
the bend vanishes. A bent arm with the hand raised to shoulder height renders as
a folded flap, because the upper arm and forearm sit almost on top of each other.
A long, gently bent arm reads immediately. Prefer the pose that projects well.

Cuffs matter: end a sleeve with a slightly larger radius plus a line, or it
tapers to a spike poking into the hand.

## Hands

Hands are the hardest thing at this scale and there is one rule: **one silhouette,
details inside it.**

Four separate finger capsules laid across an object read as a comb, every time.
Instead draw the fist as a single closed shape and put the finger divisions
*inside* it as short creases, with only the thumb as a separate piece:

```js
const fist = smooth([[fx-18,fy-14],[fx-5,fy-18],[fx+12,fy-15],[fx+18,fy-2],
                     [fx+14,fy+11],[fx-3,fy+16],[fx-16,fy+10],[fx-20,fy-2]], true, 3);
skin(fist); pen.line(fist, 'blue', 1.3, { closed: true, tone: .85 });
for (let k = 0; k < 3; k++) pen.line(crease(k), 'blue', .9, { tone: .5 });
```

A relaxed hanging hand is better as one mitt shape with two creases than as
articulated fingers — articulation at that size competes with the working hand
and loses.

Skin is `coral 0.2–0.3 + yellow 0.34–0.38`. Coral alone comes out pink.

## Heads and faces

Build from parts, not circles. A pink circle with a white circle under it is what
"a head" looks like when you have not drawn a head.

- **The hat must overlap the skull.** If the brim's lower edge sits above the
  skull's top, the hat floats — and it will float by exactly the amount you did
  not check. Put the brim ellipse *across* the forehead: brim centre below skull
  top. Draw crown first, then brim over it.
- **Draw order:** skull → ear → nose → eye and brow → beard → crown → brim.
- **A profile needs something breaking the silhouette.** A small nose wedge on
  the outline does more than any amount of interior detail.
- **A full beard rests on the collar.** There is no visible neck, and trying to
  show one is what makes the neck look broken. Build the neck shape anyway — it
  fills the gap behind — and let the beard cover it.
- **Faces that swing round.** For a head that turns, fill the whole skull with
  hair, then draw a skin disc offset along the facing direction, with eyes fading
  in once the face is more than a third toward the viewer. Offset scales with how
  far round they are.
- **Head tilt** is a `ctx.rotate` about the neck base. Sign trips people up: in
  canvas coordinates a *negative* angle sends a point on the left side *downward*.
  To make a left-facing profile look up, rotate **positive**.

## Making colours you don't have

There are four inks. Everything else is an overprint. Verified combinations:

| want | recipe |
|---|---|
| amber / ochre work jacket | `yellow 1.0 + coral 0.5 + blue 0.08` |
| boot leather, dark brown | `coral 0.9 + blue 0.62` |
| periwinkle, dusty blue | `blue 0.3 + coral 0.22×tone` |
| olive, sage green | `teal 0.5 + yellow 0.35` |
| plum, mauve | `blue 0.5 + coral 0.6` |
| tan skin | `coral 0.25 + yellow 0.36` |
| straw | `yellow 0.65 + coral 0.13 + blue 0.07` |

Add a trace of the opposite ink (0.06–0.1) to mute anything that comes out too
saturated. That is what stops a scene looking like clip art.

## Density and the empty-floor failure

The single most common failure is not enough stuff. An 8×8 room with a desk in it
reads as a warehouse. Rooms want 15–30 objects, 1–3 people, at least one light
source and floor clutter. A bunch of flowers wants 40+ elements.

Sample positions inside an ellipse rather than placing them by hand:

```js
const a = R() * TAU, rr = Math.sqrt(rand(R, .03, 1));   // sqrt = uniform in area
let x = cx + Math.cos(a) * RX * rr, y = cy + Math.sin(a) * RY * rr;
```

Then sort by y so the lowest draws first.

## Organic shapes

Straight lines look like diagrams. A stem, cable or vine wants three deviations
stacked on its perpendicular:

```js
const off = Math.sin(u * Math.PI) * bow           // one long bow, ends pinned
          + Math.sin(u * Math.PI * 2.4 + 1.1) * counter   // a shorter counter-bow
          + noise(u * 5, seed * .01, seed) * 4;          // wander on top
```

`sin(u·π)` is zero at both ends, so however much it bends in the middle it still
meets both its anchors exactly — the bend cannot pull an attachment apart.

Then modulate the width along its length (`× (1 + .16·sin(u·11 + phase))`) so it
does not read as an extrusion, and give the outline a real `amp`.

## Things that always look wrong

- **A closed shape with its own outline sitting on a garment** — a collar, a
  pocket, a patch. It reads as a ring stuck on the chest. Draw the neckline as
  two open arcs on the sweater instead. No shape, no outline, nothing to detach.
- **Hard-edged rectangles of light.** `pen.light` on a rectangle is obviously
  wrong. Smooth the polygon first and keep the strength low (0.16–0.3); strong
  light pools flood a floor and read as orange paint.
- **Symmetric everything.** Jitter baselines, sizes and slants.
- **A face at the same value as its beard.** Skin and white beard are both light;
  together they read as one blob. Give the skin enough tone to separate.
