# Release 2026 — Scene 2

Scene 2 is a 1920×1080, 60fps, six-second composition registered in
`src/Root.tsx`.

- `index.tsx` defines editable props and layers the background, orbit, and copy.
- `ImageOrbit.tsx` moves dashboard cards along a depth-scaled oval. Image sets
  shorter than 12 items repeat automatically.
- `AnimatedCenterCopy.tsx` reveals the first line by letter, then snaps in the
  bold second line while shrinking the first.
- `../components/DitherBackground.tsx` renders the shared purple procedural
  dither.

Dashboard assets currently live in `public/release-2026/scene-01/`. Update the
inline `imageSources` default in `src/Root.tsx` when adding or replacing images.

Preview with `npm run dev` or render a check using
`npx remotion still Scene-2 --frame=170`.
