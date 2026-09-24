---
name: procedural-film
description: Create or substantially revise an original procedural film or visual loop in this Remotion project. Use for art-directed motion made with Canvas, SVG, shaders, React or mixed media; use riso-canvas as well when the chosen look uses its ink engine. Routine product UI animation edits and simple exports use the existing Remotion skills.
---

# Procedural film

Use Remotion's frame clock, composition registry and export CLI. Read [the shared workflow](../../../docs/procedural-workflow.md) for the brief, review criteria and work-note shape. For four-ink Canvas work, also read `riso-canvas` and its relevant craft references. For implementation and output commands, use `remotion-markup` and `remotion-render`.

1. Establish subject, feeling, duration, format, constraints and visual premise. When asked for ideas, offer distinct directions and wait for the user's choice. Otherwise choose a direction and proceed. For recognisable subjects, inspect references that answer construction and motion questions; record the decisions they changed.
2. For a substantial piece, create `ARTWORK.md` beside its composition before filling the timeline. Define events and their frame numbers from one authoritative timing source. Describe what changes, what causes the next change, and where the eye should go. Preserve approved choices during revisions.
3. Prove the most difficult frame at output resolution, then a short sample of the hardest action. Check silhouette, support, perspective, contacts and aftermath before adding texture or more shots. Watch a full-duration silent rough cut before polishing a long film.
4. Drive visible state from `useCurrentFrame()` and `useVideoConfig()`. Seed randomness with stable subject keys. Render arbitrary frames in any order without reading wall-clock time or accumulating unrecorded state. Use `delayRender` for asynchronous assets. Keep halftone and fine texture at native output size.
5. Review named moments and boundaries with `node scripts/review-composition.mjs --id <CompositionId> --frames 0,90,180 --cuts 120,240`. Read the generated contact sheet and 1:1 PNGs, then watch motion at normal speed. Fix observed faults and rerun the relevant review. A repeatable frame is not proof of good art or pacing.
6. Render the final film through Remotion. Inspect the encoded result at normal speed and verify duration, frame size and audio when present. Record what was actually inspected and any remaining weakness in `ARTWORK.md`. If using sampled sound, keep source and license credits with the composition.

For a small local revision, keep the review proportional to the changed shots. Do not turn this workflow into a required proposal round when the user asked to make the film.
