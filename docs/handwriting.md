# Handwriting clips

Handwritten text that writes itself on stroke by stroke, exported as a
transparent video for DaVinci Resolve (or any editor that reads ProRes 4444
with alpha).

There are two pieces:

- **The Handwriting tool** in the playground repo (`/tools/handwriting`,
  live at play.tonyzeb.com/tools/handwriting). You type and tune the text
  there.
- **`HandwritingClip`** in this repo. It renders a settings file from the tool
  as a `.mov` with a transparent background. It runs the same engine, so the
  render matches the preview.

## Make a clip

1. **Tune it in the tool.**
   - Type the text, one line per row.
   - Pick a font, or drop your own `.ttf` or `.otf` on the stage.
   - Adjust size, pen speed, joins, lead-in and tail, wiggle, exit and so on.
   - Variation re-rolls the lead-in and tail shapes until you like one.
2. **Export.** In the panel's **Export** group, pick the resolution and frame
   rate of your Resolve timeline, then press **Export for video (.json)…**.
   This saves a file such as `handwriting-for-a-while-now.json`.
3. **Render it here.**

   ```bash
   npm run handwriting -- ~/Downloads/handwriting-for-a-while-now.json
   ```

   This writes `out/handwriting/handwriting-for-a-while-now.mov` (ProRes
   4444, transparent background). A short line takes a few seconds.

   - Give a second path to choose where the file goes:
     `npm run handwriting -- file.json ~/Movies/title.mov`
   - Add `--png` for a transparent PNG sequence instead.

4. **In Resolve,** drag the `.mov` onto a track above your footage. The
   transparency comes through on its own, so there's nothing to key. Move,
   scale and colour-correct it like any other clip.

## Things to know

- **Timing:**
  - The tool works in 30 fps frames. The clip is converted to the frame rate
    you exported, so the speed stays the same at 24, 25 or 60 fps.
  - The clip starts empty, writes the text, holds for the **Hold** frames,
    then plays the exit.
  - Choose **Stay** as the exit if you'd rather cut or fade it in Resolve.
- **Shadow:** the soft dark shadow under the ink is part of the alpha, which
  helps white text read over bright footage. Turn **Shadow** off in the tool
  for clean ink only.
- **Uploaded fonts:** their stroke data is saved inside the JSON, so the
  render needs nothing else.
- **Studio:** open **Tools → HandwritingClip** in Remotion Studio
  (`npm run dev`) to preview a clip. Its props match the JSON fields.

## Where the code lives

| What | Where |
| --- | --- |
| Engine (layout, strokes, lead/tail, wobble) | `src/scenes/JunyStudios/shared/handwriting/` |
| Clip composition | `src/scenes/JunyStudios/shared/handwriting/HandwritingClip.tsx` |
| Render command | `scripts/render-handwriting.mjs` (`npm run handwriting`) |
| Font converters | `scripts/build-handwriting-from-font.mjs`, `scripts/build-handwriting-fonts.mjs` |
| The tool | playground repo, `src/features/handwriting/` |

The tool's engine (`playground/src/features/handwriting/engine/`) is a
plain-JavaScript copy of the engine here. When you change `geometry.ts` or
`HandWrite.tsx`, port the change there too. The JSON fields are defined
in two places that must stay in step: `exportSettings` in the tool's
`handwritingConfig.js`, and `handwritingClipSchema` here.
