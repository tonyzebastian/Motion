# Juny Studios

Each video lives in its own folder (starting with `Introduction/`) and shares `shared/` (theme, scene sequencing, placeholder card). Size and frame rate live in `shared/theme.ts` (1920×1080, 30fps).

## Layout

```
JunyStudios/
  index.tsx              registers every Juny composition (used by src/Root.tsx)
  shared/                theme, SceneSequence (joins scenes), types
  Introduction/
    scenes/<Scene>.tsx   one file per scene, with its own duration
    sceneList.ts         scene order + saved cuts
    index.tsx            the cut component and its props
```

## Assets

Media lives in `public/juny-studios/<video>/<scene>/`. Photos are resized to 960×1200 (4:5). Videos are converted to H.264 MP4 (the renderer can't reliably decode iPhone HEVC) and trimmed to just the part used, e.g.:

```bash
npx remotion ffmpeg -ss 2.0 -t 4.6 -i IMG_3134.mov -an -vf "scale=1920:-2,format=yuv420p" -c:v libx264 -crf 18 -g 15 -r 30 -movflags +faststart img_3134.mp4
```

## Opening scene

`Introduction/scenes/Opening/` — "I've mostly been behind the camera."

Two versions share all code and assets: `JunyIntroduction-Opening` (6.5s, video holds a still for 2s) and `JunyIntroduction-OpeningShort` (3s, snappier, video plays straight away). Each pace is a timing set in `timing.ts` (`STANDARD_TIMING`, `SHORT_TIMING`); add another set to make a new pace.

- `timing.ts`: every timing in one place, including each spoken word's frame and position (re-sync here once the voice-over is recorded), the small squares, the video's small size/position, when it expands, its trim, and the page color.
- `SoundEffects.tsx`: camera-themed sound effects (shutter per photo, tap per word, film advance when the video starts, whoosh + thump on the expand, ticks as the squares hit the corners). Volumes are per version, in each timing set's `sfx`. Sounds are synthesized by `node scripts/generate-juny-opening-sfx.mjs` into `public/juny-studios/introduction/opening/sfx/`; edit and re-run that script to change how they sound.
- Layout reference: Figma Storyboard file, Scratch page, node 81:1186. Word and square positions are copied from it; type is Reenie Beanie 92px on `#FFF7F2`. The squares start as wobbling blobs and turn into squares as they move to the video corners.
- `photos.ts`: photo order, position, size, depth and frame-number marks, plus the video source.

## Export a single scene

Each scene shows up in Studio under `Juny-Studios/Introduction/Introduction-Scenes`:

```bash
npx remotion render JunyIntroduction-Opening
```

## Combine scenes

A cut plays a list of scenes in order with a crossfade (`transitionFrames`, 0 for a hard cut). Its length is calculated from the scenes it contains.

- **Saved cut:** add an entry to `INTRO_CUTS` in `Introduction/sceneList.ts`, e.g. `Teaser: { scenes: ["Opening", "Outro"], transitionFrames: 15 }`. This creates `JunyIntroduction-Teaser`.
- **One-off:** edit the props of `JunyIntroduction-Full` in the Studio, or pass them on the command line:

```bash
npx remotion render JunyIntroduction-Full --props='{"scenes":["Opening","Outro"],"transitionFrames":0}'
```

## Add a scene

1. Create `Introduction/scenes/<Name>.tsx` exporting the component and `<NAME>_DURATION`.
2. Add it to `INTRO_SCENE_IDS` and `INTRO_SCENES` in `sceneList.ts`.

## Add a new video

Copy the `Introduction/` folder, rename the IDs, and add a `<Folder>` for it in `JunyStudios/index.tsx`.

## Reading scene

`Introduction/scenes/Reading/` — "For a while now, I've been getting more curious about stories."

An overhead clip of the Dune book, played straight through (3.3s): pages flip, then the book closes on the cover. The voice-over is handwritten over it with the shared handwriting engine (`shared/handwriting/`, see `docs/handwriting.md`): "for a while now," on the first spread, "I've been getting / more curious about" after the page swipe, and "stories." beside the cover. Each block has its own pen settings in `timing.ts` (`PEN`), tuned in the playground Handwriting tool and sped up to fit the clip.

The footage is the colour-graded take, which has a slow zoom added in the edit. The page text was placed on the un-zoomed take, so `zoom.ts` stores the zoom for every frame and the scene moves the text with the book. "stories." is placed on screen.

The clip in `public/juny-studios/introduction/reading/` is not committed. To recreate it from the graded export (`Original Videos/reading book.mov`):

```bash
npx remotion ffmpeg -i "reading book.mov" -an -vf "scale=1920:-2,format=yuv420p" -c:v libx264 -crf 16 -g 15 -r 30 -movflags +faststart public/juny-studios/introduction/reading/reading-book.mp4
```

If the edit's zoom changes, re-measure it. This needs the un-zoomed take (converted the same way) as the reference:

```bash
node scripts/track-juny-reading-zoom.mjs ungraded.mp4 public/juny-studios/introduction/reading/reading-book.mp4
```
