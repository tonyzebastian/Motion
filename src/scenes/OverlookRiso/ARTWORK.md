# Overlook Riso

## Intent

Recreate the user-supplied photograph as a quiet, reflective print-style still. Keep the person and left-facing pose recognizable, and preserve the tree, slope, distant city, framing, and original 640 × 800 (4:5) dimensions.

## References and design

- Source: the user's `tony-sebastian-lwN5UCu4SzA-unsplash.jpg`, inspected as a visual reference for geometry, clothing, pose, and viewpoint. No source pixels are used in the render.
- Style study: `references/riso-windowseat/poster.png` informed the limited ink colors, paper tone, screened color mixing, and slight registration shift. No pixels from that poster appear in this composition.
- Palette: paper, cloud, sea, slate, navy, sage, forest, stone, rust, and skin tone. The broader palette distinguishes the face and layered jacket while keeping a print feel.

## Implementation and review

- Composition: `OverlookRiso`, one frame at 640 × 800, 30 fps for registration only.
- The entire scene is authored SVG geometry: paths for the landscape, tree, clothing, limbs, and facial profile; seeded code-generated leaves, grass, city blocks, and paper fibres. A dot screen gives the illustration a printed surface. The reference photo is not imported by the composition.
- Exported with `npx remotion still OverlookRiso out/overlook-riso.png`. Inspected the full PNG at native size and confirmed its dimensions with `sips`.
- Remaining limitation: at the original 640-pixel width, small facial details and distant buildings simplify into ink texture. The silhouette, clothing blocks, and exact composition remain readable.
