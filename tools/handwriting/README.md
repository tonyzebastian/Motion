# Handwriting

> **Internal.** This is a working tool for my own videos, not a finished
> product. It runs on this Mac only. Where it goes next is undecided (see
> [Making it standalone](#making-it-standalone)).

Handwritten text that writes itself on, one pen stroke at a time, exported
as a transparent video to lay over footage in DaVinci Resolve (or any editor
that reads ProRes 4444 with alpha).

There are two tools built on one handwriting engine:

| | Web tool | Mac tool (this folder) |
| --- | --- | --- |
| Where | Playground site, `/tools/handwriting` (play.tonyzeb.com) | This repo, `tools/handwriting/`, on this Mac |
| What you do there | Type, tune, preview | Type, tune, preview, **make the video** |
| Output | A settings file (`.json`) | A transparent ProRes 4444 `.mov` |
| Needs | A browser | macOS, Node, this repo installed |
| Opens from | Any browser | DaVinci Resolve's Scripts menu, or a terminal |

The web tool is standalone and stays that way for now: it designs the text
and exports its settings. Turning settings into video happens here.

---

## Contents

- [How it fits together](#how-it-fits-together)
- [The engine](#the-engine)
- [The web tool](#the-web-tool)
- [The Mac tool](#the-mac-tool)
  - [Studio](#studio)
  - [From DaVinci Resolve](#from-davinci-resolve)
  - [From a settings file](#from-a-settings-file)
  - [Looks](#looks)
- [Setup](#setup)
- [Dependencies](#dependencies)
- [Files](#files)
- [Troubleshooting](#troubleshooting)
- [Keeping the two tools in step](#keeping-the-two-tools-in-step)
- [Making it standalone](#making-it-standalone)

---

## How it fits together

```
                ┌──────────────── handwriting engine ────────────────┐
                │ fonts as pen strokes · layout · lead-in/tail ·      │
                │ taper · wobble · write-on / unwrite timing          │
                └───────────────┬─────────────────────┬───────────────┘
                     plain-JS copy                     TypeScript original
                                │                     │
   Web tool (playground)        │                     │   Mac tool (this repo)
   ┌────────────────────────┐   │                     │   ┌──────────────────────────────┐
   │ preview + controls     │◄──┘                     └──►│ HandwritingClip (Remotion)   │
   │ Export → settings.json ├──────────────────────────────►  render.mjs → .mov (ProRes)   │
   └────────────────────────┘     npm run handwriting      │ Studio (preview + Create)    │
                                                          │ Resolve menu → Open Studio   │
                                                          └──────────────────────────────┘
```

1. The **engine** turns text into pen strokes and decides, for any frame,
   how much of each stroke is drawn and how it wobbles.
2. The **web tool** runs a JavaScript copy of the engine in the browser to
   preview, and exports the settings.
3. The **Mac tool** runs the original engine inside a Remotion composition
   (`HandwritingClip`). The **Studio** previews that same composition, so
   what you see is what renders. **Create** (or `npm run handwriting`)
   renders it to a transparent `.mov` with Remotion.

## The engine

`src/scenes/JunyStudios/shared/handwriting/` (it also powers the Reading
scene of the Juny Studios intro).

- **Fonts are pen strokes, not outlines.** Each letter is stored as the
  path a pen takes. Script fonts from Google Fonts are traced to their
  centre line by `scripts/build-handwriting-from-font.mjs`: each letter is
  filled into a bitmap, thinned to a one-pixel line, and traced into
  strokes in a hand-like order. Single-line plotter fonts are converted by
  `scripts/build-handwriting-fonts.mjs`. The output is `fonts/*.ts`.
- **Built-in fonts:** Reenie Beanie (the default), Sacramento, Homemade
  Apple and Mrs Saint Delafield (Google Fonts, OFL/Apache), plus EMS Allure
  and EMS Felix (single-line, OFL).
- **Layout** (`geometry.ts`) places letters with the font's spacing, joins
  them into one pen path per line (with optional ink on the joins), and adds
  a lead-in before the first letter and a tail after the last. Lead-in
  styles: swoop, line, hook, wave. Tail styles: flick, lift, drop, wave,
  swash. `variation` re-rolls their shapes.
- **Drawing** (`HandWrite.tsx`) reveals the path over time like a trimmed
  stroke, with a pointed growing tip, a gentle wobble that re-rolls every
  few frames (`boil`), rough dry-brush edges (`texture`), and a soft shadow.
  Exits: unwrite (it leaves the way it was written), dissolve, or stay.
- **`HandwritingClip.tsx`** wraps it as a Remotion composition: text on a
  transparent background at any size and frame rate. It works in the tool's
  frame of reference (a 1920-wide canvas at 30 fps) and scales to the
  output, so 24, 25 or 60 fps play at the same speed.

## The web tool

Playground repo, `src/features/handwriting/` (route `/tools/handwriting`).

- Type in the text box, one line per row. Tune everything in the panel:
  font (or drop your own `.ttf`/`.otf`, traced in the browser), size, pen,
  lead-in and tail, wobble, colours, timing and exit.
- **Export for video (.json)…** saves the text and settings, with the chosen
  resolution and frame rate. Each file starts with an `instructions` field
  saying how to render it, so it can be handed to Claude and rendered
  straight away.
- It does not make video itself. See [Making it standalone](#making-it-standalone)
  for how it could.

## The Mac tool

Everything in this folder:

| File | What it is |
| --- | --- |
| `studio/server.mjs` | The Studio's local server (http://127.0.0.1:4517). Builds and serves the page, lists and saves looks, opens the folder picker, renders, reveals files in Finder. |
| `studio/app.tsx` | The Studio page: preview, text box, controls. |
| `render.mjs` | Renders a settings file to a `.mov` (`npm run handwriting`). |
| `resolve/handwriting.lua` | The Resolve menu entry: opens the Studio at the timeline's format. |
| `install-resolve.mjs` | Adds that entry to Resolve (`npm run resolve:install`). |
| `looks/` | Saved styles ("looks"). |

### Studio

Open it from Resolve (below) or run `npm run handwriting:studio` and go to
http://127.0.0.1:4517.

- **Left:** a live preview of the exact clip that will be rendered, on a
  dark, light or transparent backdrop, with the length shown. The text box
  is underneath; each line is a line of handwriting.
- **Right:** Look (pick one, or **Save as…**), Type (font, size, weight,
  line height, alignment, position: top, middle, lower third or bottom),
  Timing (word gap, pen speed, hold, exit), Pen (joins, lead-in and tail
  with styles, variation), Wobble, Colour, and Output (size, frame rate,
  **Save to** with a folder picker).
- **Create** renders into the save folder in a few seconds (named after the
  text, never replacing an earlier clip), then offers **Show in Finder**.
  Drag the clip onto a track above your footage.
- It remembers your last settings and save folder.

### From DaVinci Resolve

**Workspace → Scripts → Handwriting → Open Studio.** Works in the free
version of Resolve. It reads the current timeline's resolution and frame
rate, starts the Studio in the background if it isn't running, and opens it
in its own window (a Chrome app window if Chrome is installed, otherwise
your default browser).

That's all the Resolve side does. Placing the clip is done by hand: free
Resolve scripts can't wait on another window without freezing Resolve, and
dragging a clip in is quick.

### From a settings file

For a `.json` exported from the web tool:

```bash
npm run handwriting -- ~/Downloads/handwriting-for-a-while-now.json
```

It writes `out/handwriting/<file name>.mov`. Options:

- a second path to choose where it goes: `npm run handwriting -- file.json ~/Movies/title.mov`
- `--out-dir <folder>`: save into a folder, named after the text, without replacing anything
- `--text "line one|line two"`: replace the text (`|` starts a new line)
- `--width 3840 --height 2160 --fps 24`: change the output format
- `--set key=value`: change any other setting (repeatable), e.g. `--set position=lower-third`
- `--png`: a transparent PNG sequence instead of a `.mov`

### Looks

A look is a saved style: everything except the text and the output format.
Looks are the `.json` files in `looks/`. Save one from the Studio (**Save
as…**), or drop in a file exported from the web tool. The starting look is
"Reenie wave lift": Reenie Beanie, a wave lead-in and a lift tail.

## Setup

On this Mac it's already set up. On another Mac:

```bash
git clone <Motion repo>
cd Motion
npm install
npm run resolve:install   # adds Open Studio to Resolve; then restart Resolve
```

The first render downloads Remotion's headless Chrome (once). Re-run
`npm run resolve:install` if the repo moves or Node changes version: the
menu entry stores both paths.

If you change the Studio's code, stop it so the next Open Studio starts it
fresh:

```bash
pkill -f handwriting/studio/server.mjs
```

## Dependencies

| Need | Why | Version used |
| --- | --- | --- |
| macOS | Folder picker, Finder, app window, Resolve menu paths | macOS 15+ |
| Node.js | Runs the Studio server and renders | 22.13 (20+ works) |
| `remotion`, `@remotion/cli` | Renders the composition to video; includes its own ffmpeg | 4.0.525 |
| Remotion's headless Chrome | Draws each frame while rendering | Downloaded on first render |
| `@remotion/player` | The Studio's live preview | 4.0.525 |
| `esbuild` | Builds the Studio page when the server starts | 0.28.1 |
| `react`, `react-dom` | The Studio page and the composition | 19.2.3 |
| `zod` | The composition's settings schema | 4.5.4 |
| `opentype.js` | Reading font files when adding fonts (converters only) | 1.3.4 |
| DaVinci Resolve | Only for the Open Studio menu entry | 20.3.2 (free) |
| Google Chrome | Optional: opens the Studio as a clean app window | any |

It doesn't need the internet after setup, an account, or Resolve Studio.

The web tool (playground) needs only a browser. Its own dependencies are
the playground's (Next.js, React, DialKit) plus `opentype.js` for tracing
uploaded fonts.

## Files

Besides your clips, the Mac tool keeps:

| File | What |
| --- | --- |
| `~/Library/Application Support/Handwriting/settings.txt` | The save folder and the Studio's last settings |
| `~/Library/Logs/handwriting-studio.log` | The Studio's log, when Resolve started it |
| `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/Handwriting/Open Studio.lua` | The Resolve menu entry (from the installer) |

Renders use a temporary settings file, deleted straight after. Clips go to
the save folder (default `~/Movies/Handwriting`), or `out/handwriting/` for
`npm run handwriting`.

## Troubleshooting

- **Open Studio isn't in the menu:** run `npm run resolve:install`, then
  restart Resolve.
- **"The studio didn't start":** look at `~/Library/Logs/handwriting-studio.log`.
  Usually Node moved: re-run `npm run resolve:install`.
- **Studio shows old behaviour after a code change:** `pkill -f handwriting/studio/server.mjs`, then Open Studio again.
- **Choose… does nothing:** the folder picker can open behind the Studio
  window; check with Cmd+Tab.
- **Render fails:** the Studio shows the last lines of the error. Try the
  same settings with `npm run handwriting` in a terminal for the full log.
- **Resolve script errors:** details are in Workspace → Console, and in
  `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/logs/ResolveDebug.txt`.
  Notes for whoever edits `resolve/handwriting.lua`: in free Resolve,
  `Resolve()` returns nil in menu scripts (use the `resolve` global or
  `fu:GetResolve()`); settings come back as numbers or strings; and lists
  can hold their objects as keys rather than values.

## Keeping the two tools in step

The engine exists twice: TypeScript here, plain JavaScript in the
playground (`src/features/handwriting/engine/`).

- When `geometry.ts` or `HandWrite.tsx` changes here, port it to the
  playground. That copy was made by compiling with `tsc` (ESNext, JSX
  preserved) and swapping Remotion's `interpolate`, `Easing.bezier` and
  `random` for the playground's `engine/anim.js`.
- Settings files are read here by `handwritingClipSchema`
  (`HandwritingClip.tsx`) and written there by `exportSettings`
  (`handwritingConfig.js`). Keep their keys the same.
- Seeds must match for the shapes to match: each line uses
  `line-<n>-v<variation>`.

## Making it standalone

Today the Mac tool lives inside this repo and leans on its packages. Ways to
make it independent, roughly in order of effort:

1. **Another Mac of mine.** Clone this repo, `npm install`,
   `npm run resolve:install` (see [Setup](#setup)). About 10 minutes.
2. **Its own small repo.** Move the engine, fonts, `HandwritingClip`, a
   minimal Remotion entry point, and this folder into a dedicated project
   with only the [dependencies](#dependencies) above. Setup stays
   `npm install` + `npm run resolve:install`, but without the rest of
   Motion. A few hours, mostly moving files and trimming packages. This is
   the natural next step if it's going to be its own tool.
3. **Video export in the web tool.** Make the web tool render by itself, so
   no Mac or repo is needed:
   - *PNG sequence (zip):* draw each frame to an image in the browser and
     zip them. Resolve imports a numbered PNG sequence as one transparent
     clip. Simple and reliable; bigger downloads.
   - *ProRes `.mov` in the browser:* encode those frames with ffmpeg
     compiled for the browser (ffmpeg.wasm). Same kind of file as now, from
     any computer; a ~30 MB one-time download and slower renders
     (10–30 s per clip).
   - Frames drawn in the browser can differ very slightly from the Remotion
     render (edge softness, shadow blur): the same to the eye, not to the
     pixel.
   - *Server rendering* (Remotion on AWS Lambda) would match exactly, but
     needs an AWS account and costs per render. Not worth it for one person.
4. **A Mac app.** Wrap the Studio in an app shell (Electron) with Node and
   Remotion's renderer inside, so it installs by double-click with no
   terminal or repo. Large (300–500 MB, it carries Chrome and the video
   tools) and needs code signing so macOS doesn't block it. Only worth it if
   other people will use it.

Suggested path: 2 when the tool settles, 3 (ProRes in the browser, PNG
sequence as fallback) if the web tool should make videos on its own, and 4
only for sharing with others.
