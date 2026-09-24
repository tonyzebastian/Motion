# Procedural artwork workflow

This is shared art-direction and inspection guidance for original stills and films in Remotion. The four-ink engine and its drawing rules remain in `.agents/skills/riso-canvas/`. Product demo compositions keep their existing workflows unless the task calls for original procedural artwork.

## Visual references

The curated [Window Seat references](../references/riso-windowseat/README.md) contain a poster and film frame sheet. Use the poster to study ink texture and hierarchy, and the sheet to study shot progression. Cite the specific reference and the decision it informed in the composition's `ARTWORK.md`. Keep source images out of `public/` and render original work for the composition.

## Work note

For a substantial work, create `ARTWORK.md` beside the composition. Keep it short and current:

- Intent: subject, feeling, audience, format, duration or output dimensions, and user constraints.
- References: links or files inspected and the concrete drawing or motion decisions they changed. Mark uncertain or inaccessible references.
- Design: viewpoint, value structure, palette or material, action and event times. Name the hardest frame and action.
- Implementation: composition ID, authoritative timing source, seed or asset choices, and any sound sources and licenses.
- Review: rendered frames and ranges inspected, normal-speed playback checked, final file measurements, observed faults and fixes.
- Remaining weaknesses: specific visible or audible issues and anything not inspected.

A completed test or attractive contact sheet does not establish artistic approval.

## Review order

1. Judge the subject and staging at thumbnail size: can the subject, action and focal point be read?
2. Inspect construction at full resolution: perspective, supports, contact points, edges and occlusion.
3. Inspect the chosen medium: print screens, texture stability, shader artifacts, compression and color.
4. For motion, inspect consecutive frames around cuts, contacts, resets and loop wraps. Watch the action and whole piece at normal speed; a sheet cannot show pacing.
5. Check delivery: repeated arbitrary-frame rendering, output dimensions, duration, frame count and audio when present.

Fix the most concrete failed criterion before adding detail elsewhere. Scale the checks to the work: a small edit need not repeat an entire production review.

## Frame review command

Run from the project root:

`node scripts/review-composition.mjs --id RisoBouquet --frames 0,120,240 --cuts 180,360`

The command writes native PNGs, a labelled `contact-sheet.html` and `review.json` under `out/reviews/<CompositionId>/`. Each cut includes its preceding, exact and following frame. It renders the first selected frame twice in separate browser runs and compares the PNG bytes. A mismatch fails the command. Open the sheet, then open individual PNGs at 1:1; the command cannot judge art or motion.

The review approach is adapted from [riso-windowseat](https://github.com/sevenevesai/riso-windowseat), especially its film notes, difficult-frame proof and contact-sheet inspection. This document does not copy its engine or impose its fixed format on this project.
