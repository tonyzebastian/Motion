// ============================================
// Animation timing + cursor waypoints for the Playbooks Angle 2 scene.
//
// All frame numbers are at 30fps. The scene plays out four beats:
//
//   1. Idle hold (frame 0 onward) -- artifacts list at full width.
//   2. Cursor enters, clicks row 0 -> panel slides in with the
//      Long-Term Growth report.
//   3. Cursor moves down, clicks the Aha Moment row -> the panel's
//      toolbar title and report body cross-fade to the Aha Moment
//      variant.
//   4. Cursor moves to the panel's close X, clicks -> panel slides
//      out -> idle hold returns.
//
// Cursor waypoints are computed from Playbooks/LAYOUT so they stay
// correct if the browser chrome or split widths shift.
// ============================================

import { Easing, interpolate } from 'remotion';
import { LAYOUT } from '../Playbooks/constants';

export type Point = { x: number; y: number };

/**
 * One leg of the cursor's scripted path. The cursor sits at `from`
 * before `startFrame`, eases to `to` between `startFrame` and
 * `endFrame`, and rests at `to` afterward.
 */
export type CursorSegment = {
  from: Point;
  to: Point;
  startFrame: number;
  endFrame: number;
};

const easeInOut = Easing.inOut(Easing.cubic);

/**
 * Compute the cursor's `(x, y)` at the given frame given an ordered
 * list of move segments. Lives in this module (not inside the cursor
 * component) so the scene can read the cursor's position to drive
 * other effects (e.g. row hover) without duplicating the math.
 */
export const computeCursorPosition = (
  frame: number,
  initialPosition: Point,
  segments: CursorSegment[],
): Point => {
  let x = initialPosition.x;
  let y = initialPosition.y;
  for (const seg of segments) {
    if (frame < seg.startFrame) {
      break;
    }
    if (frame >= seg.endFrame) {
      x = seg.to.x;
      y = seg.to.y;
      continue;
    }
    const progress = interpolate(
      frame,
      [seg.startFrame, seg.endFrame],
      [0, 1],
      {
        easing: easeInOut,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
    x = seg.from.x + (seg.to.x - seg.from.x) * progress;
    y = seg.from.y + (seg.to.y - seg.from.y) * progress;
    break;
  }
  return { x, y };
};

// ============================================
// Beat boundaries (frame numbers)
// ============================================

export const TIMING = {
  // ---- Beat 1: idle ----
  idleEnd: 16,

  // ---- Beat 2: cursor in, click row 0, panel open ----
  mouseEnter1Start: 16,
  mouseEnter1End: 44,
  click1Frame: 46,
  // Panel reveal is deferred until the camera pans right; the camera
  // first holds at the click point so the click feedback (row wash +
  // hand cursor pulse) lands clearly before the panel slides in.
  panelOpenStart: 76,
  panelOpenEnd: 92,
  // Hold + read window before the second cursor move begins.
  hold1End: 130,

  // ---- Beat 3: cursor moves to Aha Moment row, load + swap ----
  mouseMove2Start: 130,
  mouseMove2End: 160,
  click2Frame: 162,
  // After click 2 we show a loading overlay on the right panel for
  // ~24 frames (the previous report body fades out, a centered spinner
  // fades in), then the new report fades in.
  //   - loadingStart: spinner begins fading in / outgoing body fades out
  //   - loadingEnd: spinner is gone; new body is fully revealed
  //   - swapStart/End: the body cross-fade itself (kept short so the
  //     incoming report appears immediately as the spinner clears)
  loadingStart: 164,
  loadingEnd: 196,
  swapStart: 188,
  swapEnd: 200,
  hold2End: 252,

  // ---- Beat 4: cursor to close X, panel close ----
  mouseMove3Start: 252,
  mouseMove3End: 282,
  click3Frame: 284,
  panelCloseStart: 288,
  panelCloseEnd: 312,

  // ---- Outro ----
  cursorFadeOutStart: 326,
  cursorFadeOutEnd: 346,
  sceneEnd: 380,

  // ---- Camera (Screen-Studio style zoom + pan) ----
  //
  // The camera zoom starts mid cursor-move (frame 28) so the punch-in
  // is in motion by the time the cursor lands and clicks at frame 46
  // -- this makes the click feel like the climax of the zoom rather
  // than a separate beat that follows it.
  //
  // After the zoom completes the camera holds at the click point for
  // ~28 frames so the row wash + hand-cursor pulse can register
  // before the panel slides in.
  //
  // Pan + panel open run together (76 -> 92): focal point shifts from
  // left to right while the panel slides in from the scene's right
  // edge. The camera then holds on the right-focused frame for ~20
  // frames before zooming back out just ahead of the second cursor
  // move.
  zoomInStart: 28,
  zoomInEnd: 48,
  panStart: 76,
  panEnd: 92,
  zoomOutStart: 112,
  zoomOutEnd: 128,
};

// ============================================
// Selected-row indices
// ============================================

/** Long-Term User Growth Opportunities Analysis row (top of the list). */
export const LONG_TERM_ROW_INDEX = 0;

/**
 * Aha Moment Analysis row index in data.ts. The data array is ordered
 * as: LongTerm(0), GMV(1), SG(2), Upstream(3), Shop(4), AhaMoment(5),
 * UserDeletion(6), ... -- if the data order changes, update this.
 */
export const AHA_MOMENT_ROW_INDEX = 5;

// ============================================
// Cursor waypoints (scene-space pixels)
// ============================================

// ---- Geometry derivations (kept inline so future tweaks are obvious) ----
//
// The BrowserWindow body starts at:
//   bodyTop    = windowPaddingTop + headerHeight   (= 90 + 52 = 142)
//   bodyLeft   = windowPaddingX                    (= 80)
//
// Inside the body, the ArtifactsList paints:
//   paddingTop  = 14
//   heading h1: fontSize 22 / lineHeight 28, marginBottom 22 -> 50px tall total
//   ColumnHeader: paddingTop 4 + 16 (label) + paddingBottom 10 + 1 border = 31
//   total chrome above row 0 = 14 + 50 + 31 = 95
//
// Each ArtifactRow is exactly 60px tall (height: 60 in ArtifactRow).

const BODY_TOP = LAYOUT.windowPaddingTop + LAYOUT.headerHeight;
const BODY_LEFT = LAYOUT.windowPaddingX;
const BODY_RIGHT = LAYOUT.sceneWidth - LAYOUT.windowPaddingX;

const LIST_TOP_OFFSET = 14 + 50 + 31; // padding + heading + column header
const ROW_HEIGHT = 60;
const LIST_TOP_Y = BODY_TOP + LIST_TOP_OFFSET;

/**
 * Return the index of the row the cursor is currently hovering over,
 * or `null` if the cursor is outside the table area entirely. Used by
 * the scene to drive a subtle hover wash on the row underneath the
 * cursor while it's in motion across the list.
 */
export const getHoveredRowIndex = (
  pos: Point,
  rowCount: number,
): number | null => {
  if (pos.x < BODY_LEFT || pos.x > BODY_RIGHT) return null;
  if (pos.y < LIST_TOP_Y) return null;
  const idx = Math.floor((pos.y - LIST_TOP_Y) / ROW_HEIGHT);
  if (idx < 0 || idx >= rowCount) return null;
  return idx;
};

const rowCenterY = (rowIndex: number): number =>
  BODY_TOP + LIST_TOP_OFFSET + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

// Cursor lands inside the title block of a row. The list has paddingLeft=36
// and rows bleed -16 past it; we pick an x well inside the title text.
const ROW_CLICK_X = BODY_LEFT + 36 + 80;

// Close X position (when the right panel is fully open).
//   - Right panel ends at the scene-right body edge: BODY_RIGHT (= 1200)
//   - Toolbar paddingRight = 12 (per ArtifactViewer)
//   - Close button is 26x26; its center sits 12 + 13 = 25px in from the edge.
//   - Toolbar y center = BODY_TOP + artifactToolbarHeight/2
const CLOSE_X_X = BODY_RIGHT - 12 - 13;
const CLOSE_X_Y = BODY_TOP + LAYOUT.artifactToolbarHeight / 2;

// Off the bottom-right corner of the 1280x900 scene. The cursor enters
// from this point and arcs up to the first row.
export const MOUSE_OFFSCREEN: Point = { x: 1340, y: 960 };

export const MOUSE_ROW_LONG_TERM: Point = {
  x: ROW_CLICK_X,
  y: rowCenterY(LONG_TERM_ROW_INDEX),
};

export const MOUSE_ROW_AHA_MOMENT: Point = {
  x: ROW_CLICK_X,
  y: rowCenterY(AHA_MOMENT_ROW_INDEX),
};

export const MOUSE_CLOSE_X: Point = {
  x: CLOSE_X_X,
  y: CLOSE_X_Y,
};
