# HandWrite

Handwritten words that draw themselves with a tapered pen, wiggle while
they sit, then erase themselves or dissolve.

```tsx
<HandWrite
  frame={frame}
  words={[{ text: "stories.", frame: 90 }]}
  x={735} y={620} align="right" size={190}
  exit={{ type: "unwrite", frame: 130 }}
/>
```

- `words`: each word starts on its own frame. Writing time follows the word's
  length and `speed` (px per frame).
- `font`: a key of `HAND_FONTS` (e.g. `reenieBeanie`, `sacramento`, `allure`).
- `weight`, `wiggle`, `boil`, `texture`: line thickness, wobble amount, how
  often the wobble re-rolls (frames), and rough brush edges.
- `connect` / `wordConnect`: ink on the joins between letters and words.
  0 draws each letter on its own, the next starting when the last is done.
- `lead` / `tail`: a swoop into the first letter and a flourish out of the
  last, about this long in em. They grow out of the letter's own direction,
  and their length varies with `seed`. `tail.style` is `flick`, `swash`
  (sweeps back under the word), `curl` or `auto`. With several lines, give
  `lead` to the first line and `tail` to the last.
- `exit`: `unwrite` (the text leaves the way it was written) or `dissolve`.

To try fonts and settings interactively, use the Handwriting tool in the
playground repo (`/tools/handwriting`), which runs the same engine. Its
exports render here as transparent clips through `HandwritingClip`
(`npm run handwriting -- file.json`); see `docs/handwriting.md`.

## Fonts

Each letter is stored as pen strokes in `fonts/*.ts`.

- EMS Felix and EMS Allure are single-line fonts by Sheldon B. Michaels (SIL
  OFL 1.1), converted by `scripts/build-handwriting-fonts.mjs`.
- Reenie Beanie, Sacramento, Mrs Saint Delafield (SIL OFL 1.1) and Homemade
  Apple (Apache 2.0) are Google Fonts traced to their centre line by
  `scripts/build-handwriting-from-font.mjs`:

  ```
  node scripts/build-handwriting-from-font.mjs path/to/font.ttf myFont
  ```

  Then add the new font to `HAND_FONTS` in `HandWrite.tsx`.
