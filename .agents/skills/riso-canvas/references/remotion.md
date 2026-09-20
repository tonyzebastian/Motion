# Using this in Remotion

It folds in unusually well, because the engine is already a pure function of time
with no `Math.random`, no `Date.now` and no accumulated state. That is the thing
Remotion actually needs: parallel workers render arbitrary frames out of order,
and every one must agree.

Verify that before trusting it — render one frame twice from cold with other
frames in between, and diff. It should be zero differing pixels. If it is not,
something in the scene is reading wall-clock time or an unseeded random.

## What changes

**1. Time comes from the frame, not the clock.** Delete the `requestAnimationFrame`
loop. `t = useCurrentFrame() / fps`.

**2. Delete the responsive fit.** The composition has a fixed size, so
`S = width / CW` and nothing else. Do **not** size the canvas smaller and scale it
up with CSS — the whole-pixel offset trick that keeps the halftone from crawling
assumes the canvas is at exactly output resolution. A CSS scale reintroduces
resampling and the dots will crawl again.

**3. Cache at module scope, keyed by width.** The build costs ~460ms at 1080 wide.
React will remount on scrub; the cache should not rebuild.

**4. Wrap the first build in `delayRender`** so Remotion does not screenshot a
blank frame.

## The component

```tsx
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { useEffect, useRef, useState } from 'react';

let CACHE: { w: number; base: any; bunch: any; front: any } | null = null;

function build(width: number) {
  if (CACHE && CACHE.w === width) return CACHE;
  const S = width / CW;
  const bake = (fn: any) => {
    const cv = MKCANVAS(Math.round(CW * S), Math.round(CH * S));
    const c = cv.getContext('2d')!;
    c.setTransform(S, 0, 0, S, 0, 0);
    resetInkCaches();
    fn(makePen(c, { boil: 0 }));
    return cv;
  };
  CACHE = { w: width, base: bake(drawBase), bunch: captureBunch(S), front: bake(drawFront) };
  resetInkCaches();
  return CACHE;
}

export const Bouquet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender('riso: building layers'));

  useEffect(() => {
    const c = ref.current!.getContext('2d')!;
    const { base, bunch, front } = build(width);
    const S = width / CW, t = frame / fps;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = PAPER_CSS; c.fillRect(0, 0, width, height);
    c.drawImage(base, 0, 0);
    blitBunch(c, bunch, 0, 0, S, t);
    c.drawImage(front, 0, 0);

    c.setTransform(S, 0, 0, S, 0, 0);
    const pen = makePen(c, { boil: 0 });
    drawFlyers(pen, t);
    drawFalling(pen, t);

    c.globalCompositeOperation = 'multiply';
    c.fillStyle = grain(c); c.fillRect(-CW, -CH, CW * 3, CH * 3);
    c.globalCompositeOperation = 'source-over';
    continueRender(handle);
  }, [frame, width, height, fps, handle]);

  return <canvas ref={ref} width={width} height={height} />;
};
```

Composition: `durationInFrames = LOOP * fps` gives exactly one seamless loop.
`MKCANVAS` in the browser is `(w, h) => Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) })`.

## The one real risk: codecs hate halftone

Fine dot patterns are close to worst case for H.264 and VP9 — high spatial
frequency everywhere, which eats bitrate and smears into mush at normal settings.
This is the thing most likely to disappoint, and it is not fixable in the drawing.

In rough order of preference:

- master to **ProRes** (`--codec=prores`) and let the delivery platform
  re-encode once, rather than encoding twice;
- if you must ship H.264, push the quality right up (`--crf 16` or lower) and
  expect a large file;
- **coarsen the screen for video**: raise `CELL` from 2.5 to 3.5–4. Bigger dots
  survive compression far better and barely change the look at video size;
- render at 2× and downscale in ffmpeg — the downscale acts as a low-pass filter
  and gives the encoder something it can actually handle.

Test with a five-second export before committing to a long render.

## Minor notes

- `boil` must stay 0. Boil re-rolls every line's wobble seed per frame, and at
  video frame rates that is pure noise for the encoder as well as being visually
  wrong for a still camera.
- Live marks keep `amp: 0` on their outlines, same reason as in the browser.
- Full render cost: roughly `frames × 20ms` of drawing plus Remotion's own
  screenshot overhead. A 16s loop at 30fps is a minute or two, not an hour.
- If you add a camera move, animate it in Remotion with `interpolate` over the
  composition rather than inside the canvas, and keep the canvas at output
  resolution.
