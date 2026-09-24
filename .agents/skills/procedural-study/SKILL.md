---
name: procedural-study
description: Study a technique in an existing Remotion composition, explain how its source works, and apply it to a short new procedural experiment. Use when the user wants to learn, transfer or test a specific visual or motion technique; ordinary composition creation uses procedural-film or procedural-still.
---

# Procedural study

Read [the shared workflow](../../../docs/procedural-workflow.md). The goal is to learn a reusable mechanism from this repository and prove it on a different subject.

1. Locate a working technique in the composition source. If the user has not picked one, offer a short set of genuinely different options with the source files and what each could teach. Ask for a choice only when the user asked to choose.
2. Explain the mechanism in plain language and point to the responsible source lines. Separate the reusable method from the original scene's palette, subject and timing. Check the source and a rendered frame or clip before claiming how it behaves.
3. Build a compact study using a new subject and the relevant procedural-film or procedural-still workflow. Keep the composition's frame state deterministic. Register the study in `src/Root.tsx` and choose a duration appropriate to the question; 15 seconds is a useful default for motion, not a rule.
4. Render the study and inspect the specific behavior being transferred with `scripts/review-composition.mjs` for motion, or a native PNG for a still. Compare the new work with the original at comparable size and motion speed. State what transferred, what needed adapting, and what remains unproven.

Use `riso-canvas` when the technique depends on its four-ink engine. Avoid copying an entire finished scene merely to claim a new application.
