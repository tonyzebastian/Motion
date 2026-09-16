// ============================================
// Frame constants + geometry for the Playbooks Citations scene.
//
// Picks up at the trust-signal end state (split open, dashboard
// streamed, High Confidence tag settled, confidence popover dismissed)
// and layers the artifact "trust signal" citation annotations:
//   1. [1]..[8] markers fade in across the report (staggered).
//   2. Camera zooms into the MAU composition grid (Screen-Studio style).
//   3. Cursor enters and parks on citation [1] (Total MAU).
//   4. A footnote popover surfaces (source table + description + View SQL).
//   5. Hold, then popover + cursor out and camera zooms back.
//
// All values are 60fps frames. Geometry is derived from Playbooks LAYOUT
// so cursor / camera targets track the split layout.
// ============================================

import { LAYOUT, ZOOM } from '../Playbooks/constants';
import type { Point } from '../PlaybooksAngle2/timing';

export const TIMING = {
  // ---- Phase A: citation markers fade in (staggered by index) ----
  citationsFadeInStart: 0,
  citationsFadeInEnd: 30,
  // Per-marker stagger: marker i starts at (i-1) * step and ramps over len.
  citationStaggerStep: 3,
  citationFadeLen: 10,

  // ---- Phase B: camera zoom into the MAU grid ----
  zoomInStart: 24,
  zoomInEnd: 72,

  // ---- Phase C: cursor enters, parks on [1] ----
  mouseEnterStart: 36,
  mouseEnterEnd: 96,

  // ---- Phase D: footnote popover surfaces ----
  popoverFadeInStart: 96,
  popoverFadeInEnd: 120,

  // ---- Phase E: hold so the source reads ----
  holdEnd: 240,

  // ---- Phase F: popover + cursor out, camera zooms back ----
  popoverFadeOutStart: 240,
  popoverFadeOutEnd: 264,
  mouseExitStart: 240,
  mouseExitEnd: 300,
  zoomOutStart: 264,
  zoomOutEnd: 320,

  sceneEnd: 340,
};

// The citation index the cursor hovers ("25.6% year-over-year" in the
// intro prose, near the top-right of the artifact panel).
export const HOVERED_CITATION_INDEX = 6;

// Frame at which the (left) trust-signal chat column is frozen: late
// enough that the dashboard has fully streamed, the High Confidence tag
// + feedback footer are settled, and the confidence popover is already
// dismissed. Anchored against PlaybooksTrustSignal/timing (popover out
// by 564, scene settles ~600).
export const FROZEN_CHAT_FRAME = 600;

// ============================================
// Geometry (scene-space, pre-zoom)
// ============================================

const WINDOW_WIDTH = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2; // 1120
const WINDOW_HEIGHT =
  LAYOUT.sceneHeight - LAYOUT.windowPaddingTop - LAYOUT.windowPaddingBottom; // 720

// Scene-space position of citation [6]'s `[6]` marker, sitting just
// after the bold "25.6% year-over-year" at the end of the intro prose's
// first line -- near the TOP-RIGHT of the artifact panel. Tuned against
// rendered stills (the h1 wraps to two lines, so the marker lands a bit
// lower/left than a single-line estimate).
export const CITATION_ANCHOR: Point = { x: 982, y: 344 };

// Camera focal point. Biased toward the top-right so that, after the
// zoom-in, BOTH the panel's top edge and its right edge stay framed.
// FOCAL_X >= 1100 keeps the right edge ~40px inside the scene; a LOWER
// FOCAL_Y pushes the whole framing DOWN, so the browser chrome / panel
// top read with comfortable margin from the top of frame (each -50 in
// FOCAL_Y moves the top edge ~+20px down after the 1.4x zoom).
const FOCAL_SCENE: Point = { x: 1100, y: 230 };

export const FOCUS_X = (FOCAL_SCENE.x - LAYOUT.windowPaddingX) / WINDOW_WIDTH;
export const FOCUS_Y = (FOCAL_SCENE.y - LAYOUT.windowPaddingTop) / WINDOW_HEIGHT;

// Where the marker visually lands at full zoom. The cursor is rendered
// OUTSIDE the BrowserWindow (unscaled), so we walk it to the marker's
// post-zoom scene coordinate (scale about the focal point).
const MARKER_AT_ZOOM_X =
  FOCAL_SCENE.x + (CITATION_ANCHOR.x - FOCAL_SCENE.x) * ZOOM.level;
const MARKER_AT_ZOOM_Y =
  FOCAL_SCENE.y + (CITATION_ANCHOR.y - FOCAL_SCENE.y) * ZOOM.level;

// Cursor sits ON the `[6]` marker: the arrow's tip (~1.5px down-right of
// its origin) lands right at the marker so the pointer reads as resting
// on top of the citation.
export const MOUSE_TAG: Point = {
  x: MARKER_AT_ZOOM_X,
  y: MARKER_AT_ZOOM_Y,
};

// Bottom-right offscreen entry point (matches the other Playbook scenes).
export const MOUSE_OFFSCREEN: Point = { x: 1340, y: 960 };
