// ============================================
// Frame constants for the Playbooks Trust Signal scene.
//
// Anchored at scene frame 0 (NOT against the original Playbooks
// scene's `phase7Start = 1134`). The scene picks up exactly where the
// artifact panel begins sliding in, then plays the dashboard stream,
// the new High Confidence tag, the existing feedback footer, and a
// scripted cursor-hover that triggers a popover with a Screen-Studio
// style zoom.
// ============================================

import { LAYOUT, ZOOM } from '../Playbooks/constants';

// All values are in 60fps frames (1 second = 60 frames). Comments
// note the equivalent wall-clock duration so future tweaks don't
// have to re-derive it.
export const TIMING = {
  // ---- Phase A: split slide-in ----
  splitOpenStart: 0,
  splitOpenEnd: 48, // 0.80s
  // Brief settle so the bubble + collapsed group + artifact card read
  // as a stable composition before the agent starts streaming.
  bubbleSettleEnd: 72, // 1.20s

  // ---- Phase B: dashboard response stream ----
  streamStart: 80, // 1.33s
  streamEnd: 240, // 4.00s

  // ---- Phase C: tag + feedback footer fade-in ----
  tagFadeStart: 248, // 4.13s
  tagFadeEnd: 272, // 4.53s
  footerFadeStart: 280, // 4.67s
  footerFadeEnd: 304, // 5.07s

  // ---- Phase D: cursor enters + camera zooms in ----
  // Zoom slightly overlaps the cursor move so the camera lands at the
  // same time the cursor reaches the tag.
  mouseEnterStart: 316, // 5.27s
  mouseEnterEnd: 384, // 6.40s
  zoomInStart: 324, // 5.40s
  zoomInEnd: 376, // 6.27s

  // ---- Phase E: popover surfaces ----
  // Popover fades + lifts up 4px once the cursor lands on the tag.
  popoverFadeInStart: 384, // 6.40s
  popoverFadeInEnd: 408, // 6.80s

  // ---- Phase F: hold so two short bullets read ----
  holdEnd: 536, // 8.93s

  // ---- Phase G: cursor exits + popover fades + zoom out ----
  mouseExitStart: 536, // 8.93s
  mouseExitEnd: 600, // 10.00s
  popoverFadeOutStart: 536, // 8.93s
  popoverFadeOutEnd: 564, // 9.40s
  zoomOutStart: 560, // 9.33s
  zoomOutEnd: 616, // 10.27s

  // Composition end -- a small tail after zoom-out for breathing room.
  sceneEnd: 640, // 10.67s
};

// ============================================
// Cursor + tag anchors (scene-space, pre-zoom).
//
// TAG_ANCHOR is the scene-space center of the High Confidence pill
// once the dashboard response has finished streaming and the chat
// column has reflowed into the contracted (615px) split layout.
//
// Derivation:
//   chat column scene-x range = [80, 695]
//   centered content (575 wide) inside column starts at 80 + 20 = 100
//   conversation viewport paddingLeft = 16 -> first content x = 116
//   tag pill (~140 wide) is left-aligned -> center x = 116 + 70 = 186
//
//   browser body top in scene-y = 90 + 52 = 142
//   conversation viewport top  = 142 + 138 = 280
//   stack inside the viewport (24-row + 16 + 44-card + 16 + ~7 line
//   paragraph at 28px = 196 + 16 + 28 tag) -> tag top = 312, center
//   = 326 -> scene-y = 280 + 326 = 606.
//
// If the dashboard copy in TrustSignalChatColumn changes line count,
// retune `y` by ~28px per added/removed line.
// ============================================

export type Point = { x: number; y: number };

export const TAG_ANCHOR: Point = { x: 186, y: 606 };

// ============================================
// Camera focus.
//
// We pick the focal point so a reasonable margin of the LEFT and
// BOTTOM scene edges stays visible after the zoom-in (the user
// wants to see both edges of the browser window framed against the
// background). Playbooks's clamp formula keeps the TOP-LEFT
// corner visible; here we bias toward BOTTOM-LEFT instead.
//
//   FOCUS_X: clamp against `MAX_FOCUS_X` so the LEFT edge of the
//            window sits at exactly `minEdgeMargin` (40px) inside
//            the scene after the zoom.
//   FOCUS_Y: chosen empirically so the BOTTOM edge of the window
//            ends up ~`minEdgeMargin` (40px) above the scene
//            bottom. Derivation:
//              new_bottom = paddingTop + H + focusY * H * (zoom - 1)
//              with `paddingTop=90`, `H=720`, `zoom=1.4`,
//              `new_bottom <= sceneHeight - minEdgeMargin = 860`
//              -> focusY >= (1098 - 860) / (288) = 0.826
// ============================================

const WINDOW_WIDTH =
  LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2;
const WINDOW_HEIGHT =
  LAYOUT.sceneHeight - LAYOUT.windowPaddingTop - LAYOUT.windowPaddingBottom;

const MAX_FOCUS_X =
  (LAYOUT.windowPaddingX - ZOOM.minEdgeMargin) /
  (WINDOW_WIDTH * (ZOOM.level - 1));

export const FOCUS_X = Math.min(
  Math.max((TAG_ANCHOR.x - LAYOUT.windowPaddingX) / WINDOW_WIDTH, 0),
  MAX_FOCUS_X,
);
export const FOCUS_Y = 0.83;

// Scene-space focal point (origin of the BrowserWindow's `scale`
// transform). The transform keeps this point fixed across the zoom.
const FOCAL_X = LAYOUT.windowPaddingX + FOCUS_X * WINDOW_WIDTH;
const FOCAL_Y = LAYOUT.windowPaddingTop + FOCUS_Y * WINDOW_HEIGHT;

// Where the tag visually lands at full zoom. The cursor is rendered
// OUTSIDE the BrowserWindow (no scaling), so we walk it to the tag's
// post-zoom scene coordinate -- otherwise the cursor would land at
// the tag's pre-zoom position, which the camera shift moves the
// actual pill away from.
const TAG_AT_ZOOM_X =
  FOCAL_X + (TAG_ANCHOR.x - FOCAL_X) * ZOOM.level;
const TAG_AT_ZOOM_Y =
  FOCAL_Y + (TAG_ANCHOR.y - FOCAL_Y) * ZOOM.level;

// Cursor lands a touch right of the tag's visual center so the
// pulse reads as "on the chip" rather than overlapping the shield
// icon.
export const MOUSE_TAG: Point = {
  x: TAG_AT_ZOOM_X + 12,
  y: TAG_AT_ZOOM_Y,
};

// Bottom-right offscreen entry point, matching the convention in
// PlaybooksAngle2.
export const MOUSE_OFFSCREEN: Point = { x: 1340, y: 960 };
