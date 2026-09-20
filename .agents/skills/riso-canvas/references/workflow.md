# Workflow: look at it, don't reason about it

You cannot judge this style from source. Every pass in this style is: render,
look, name one concrete fault, fix that fault, render again. Set the loop up
before you draw anything — it is the difference between three passes and fifteen.

## Headless renderer

`@napi-rs/canvas` is a prebuilt native Canvas 2D for Node. It supports
`createPattern` + `setTransform`, `DOMMatrix`, `multiply` blending and
`getTransform` — everything the engine needs.

```bash
npm install @napi-rs/canvas
```

```js
// render.mjs
import { createCanvas, DOMMatrix } from '@napi-rs/canvas';
import fs from 'fs';
globalThis.MKCANVAS = (w, h) => createCanvas(Math.ceil(w), Math.ceil(h));
globalThis.DOMMatrix = DOMMatrix;
globalThis.createCanvas = createCanvas;
globalThis.fs = fs;
const src = ['riso.js', 'scene.js'].map(f => fs.readFileSync(f, 'utf8'))
              .join('\n').replace(/^'use strict';$/gm, '');
(0, eval)(src + `
  const cv = createCanvas(CW, CH), c = cv.getContext('2d');
  c.fillStyle = PAPER_CSS; c.fillRect(0, 0, CW, CH);
  drawScene(makePen(c, { boil: 0 }), +(process.argv[2] || 0));
  c.globalCompositeOperation = 'multiply'; c.fillStyle = grain(c); c.fillRect(0, 0, CW, CH);
  fs.writeFileSync('out.png', cv.toBuffer('image/png'));
`);
```

`(0, eval)` rather than `import` so the scene's top-level `const`s are visible to
the harness. Concatenating files instead of using modules keeps the same source
usable in a single-file HTML artifact.

## Crop tool

Full frames hide everything. Keep a cropper and use it constantly — most faults
only appear at 3–5×.

```js
const out = createCanvas(CW * SC, CH * SC), c = out.getContext('2d');
c.drawImage(img, SX, SY, CW, CH, 0, 0, CW * SC, CH * SC);
```

Also render a strip of frames side by side to judge motion without a browser.

## Numeric checks worth having

Looking catches most things; numbers catch the rest. These each caught a real bug:

**Loop closure** — render `t=0` and `t=LOOP`, diff. Must be mean 0.000, max 0.

**Cache fidelity** — composite the sprite cache at zero offset, diff against
drawing the scene straight. Under 0.2/255 mean is fine.

**Shimmer** — count pixels changing by more than ~24 between two consecutive
frames. Under ~1% means only the things that should be moving are moving.

**Static-region stability** — pick a rectangle nothing should animate in and
assert it is pixel-identical across frames. This is how you catch an accidental
boil.

**Frame cost** — render ten frames, divide.

## Order of work

1. Layout blocks in flat tone. Check proportion and density only.
2. Add the real drawing, group by group, rendering after each.
3. Crop in on every face, hand and joint. They will be wrong.
4. Fix tone and colour relationships last — they depend on everything else.
5. Only then animate.

## Reading a reference

Measure it rather than eyeballing. Take fractions of the frame, convert to your
canvas, and place things by number:

```
figure height   469/1280 = 0.366  →  458px at CH 1250
bouquet top     270/936  = 0.288  →  360px
```

Then look at the two side by side and name *one* thing that is most wrong. Fix
that. Repeat. Trying to fix five faults at once produces a pass where nothing
clearly improved.

## Honest reporting

Say what is still weak. "The near forearm still reads as a tube rather than part
of one silhouette" is more useful than a summary that claims it is finished, and
it is usually the thing the user was about to point out.
