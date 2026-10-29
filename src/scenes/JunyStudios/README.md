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
