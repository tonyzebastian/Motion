import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { LAYOUT, ZOOM } from '../Playbooks/constants';
import { Background } from '../Playbooks/components/Background';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { SplitView } from '../Playbooks/components/SplitView';
import {
  AnimatedCursor,
  type CursorVisibilityWindow,
} from './components/AnimatedCursor';
import { ArtifactPanel, ActiveArtifact } from './components/ArtifactPanel';
import { ArtifactsList } from './components/ArtifactsList';
import { ARTIFACTS_ANGLE2 } from './data';
import {
  AHA_MOMENT_ROW_INDEX,
  computeCursorPosition,
  type CursorSegment,
  getHoveredRowIndex,
  LONG_TERM_ROW_INDEX,
  MOUSE_CLOSE_X,
  MOUSE_OFFSCREEN,
  MOUSE_ROW_AHA_MOMENT,
  MOUSE_ROW_LONG_TERM,
  TIMING,
} from './timing';

// ---- Camera focus clamps ----
//
// BrowserWindow scales around `transformOrigin: focusX*100% focusY*100%`.
// To keep the left + top scene edges visible after a zoom in, focusX
// must stay <= maxFocusEdge; to keep the right + top edges visible
// during the pan, focusX must stay >= 1 - maxFocusEdge. focusY is
// always clamped to the top side.
const windowWidth = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2;
const windowHeight =
  LAYOUT.sceneHeight - LAYOUT.windowPaddingTop - LAYOUT.windowPaddingBottom;

const maxFocusEdgeX =
  (LAYOUT.windowPaddingX - ZOOM.minEdgeMargin) /
  (windowWidth * (ZOOM.level - 1));
const maxFocusEdgeY =
  (LAYOUT.windowPaddingTop - ZOOM.minEdgeMargin) /
  (windowHeight * (ZOOM.level - 1));

const FOCUS_LEFT_X = maxFocusEdgeX;
const FOCUS_RIGHT_X = 1 - maxFocusEdgeX;
const FOCUS_TOP_Y = maxFocusEdgeY;

// ============================================
// Playbooks Angle 2 Scene
// ============================================
// Cursor-driven artifact browsing. The scene plays out:
//
//   1. Idle (list at full width).
//   2. Cursor enters -> clicks the top row -> right panel slides in
//      with the Long-Term Growth report.
//   3. Cursor moves to the Aha Moment row -> clicks -> panel toolbar
//      title + body cross-fade to the Aha Moment report.
//   4. Cursor moves to the close X -> clicks -> panel slides out ->
//      list returns to full width -> cursor fades.
//
// All motion is derived from frame counters declared in `timing.ts`.

const easeOut = Easing.out(Easing.cubic);

export const PlaybooksAngle2Scene: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- Split progress: 0 idle -> 1 panel open -> 0 panel closed. ----
  //
  // Two non-overlapping interpolation windows. Outside both we hold the
  // most recent steady-state value.
  let splitProgress: number;
  if (frame < TIMING.panelOpenStart) {
    splitProgress = 0;
  } else if (frame < TIMING.panelCloseStart) {
    splitProgress = interpolate(
      frame,
      [TIMING.panelOpenStart, TIMING.panelOpenEnd],
      [0, 1],
      { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  } else {
    splitProgress = interpolate(
      frame,
      [TIMING.panelCloseStart, TIMING.panelCloseEnd],
      [1, 0],
      { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  // The right panel only needs to be meaningfully rendered while it
  // has any visible width. Outside the open/close window the right
  // slot stays null -- but we ALWAYS render the SplitView wrapper so
  // the left-column ArtifactsList stays in a stable subtree across
  // the whole scene. Swapping between `<ArtifactsList />` standalone
  // and `<SplitView left={<ArtifactsList/>}>` causes React to remount
  // the list mid-animation, which shows up as a 1-frame flash during
  // the zoom-in.
  const panelMounted =
    frame >= TIMING.panelOpenStart && frame < TIMING.panelCloseEnd;

  // ---- Selection state ----
  //
  //   null            -> before click 1
  //   LONG_TERM (0)   -> click 1 .. click 2
  //   AHA_MOMENT (5)  -> click 2 .. click 3
  //   null            -> after click 3 (panel closes)
  let selectedIndex: number | null;
  if (frame < TIMING.click1Frame) {
    selectedIndex = null;
  } else if (frame < TIMING.click2Frame) {
    selectedIndex = LONG_TERM_ROW_INDEX;
  } else if (frame < TIMING.click3Frame) {
    selectedIndex = AHA_MOMENT_ROW_INDEX;
  } else {
    selectedIndex = null;
  }

  // ---- Active artifact + swap progress ----
  //
  // activeArtifact flips at click 2; swapProgress runs a short
  // cross-fade window that begins as the loading overlay finishes
  // covering the body. After the swap window we hold swapProgress at
  // 1 so the Aha Moment report stays at full opacity.
  const activeArtifact: ActiveArtifact =
    frame >= TIMING.click2Frame ? 'ahaMoment' : 'longTerm';
  const swapProgress =
    frame >= TIMING.click2Frame
      ? interpolate(
          frame,
          [TIMING.swapStart, TIMING.swapEnd],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 0;

  // ---- Loading overlay opacity ----
  //
  // After click 2 the right panel briefly shows a loading state before
  // the Aha Moment report appears. The overlay ramps in over 8 frames,
  // holds while the previous body fades out and the new one fades in,
  // then ramps out over the final 8 frames of the loading window.
  let loadingOpacity = 0;
  if (frame >= TIMING.loadingStart && frame <= TIMING.loadingEnd) {
    const rampInEnd = TIMING.loadingStart + 8;
    const rampOutStart = TIMING.loadingEnd - 8;
    if (frame < rampInEnd) {
      loadingOpacity = interpolate(
        frame,
        [TIMING.loadingStart, rampInEnd],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    } else if (frame > rampOutStart) {
      loadingOpacity = interpolate(
        frame,
        [rampOutStart, TIMING.loadingEnd],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    } else {
      loadingOpacity = 1;
    }
  }

  // ---- Cursor script ----
  //
  //   Seg 1: offscreen        -> row 0          (frames 16 -> 44)
  //   Seg 2: row 0            -> Aha Moment row (frames 130 -> 160)
  //   Seg 3: Aha Moment row   -> close X        (frames 240 -> 272)
  //
  // The cursor fades out late in the scene (after the panel finishes
  // closing) so the close click visibly registers before the cursor
  // disappears.
  const cursorSegments: CursorSegment[] = [
    {
      from: MOUSE_OFFSCREEN,
      to: MOUSE_ROW_LONG_TERM,
      startFrame: TIMING.mouseEnter1Start,
      endFrame: TIMING.mouseEnter1End,
    },
    {
      from: MOUSE_ROW_LONG_TERM,
      to: MOUSE_ROW_AHA_MOMENT,
      startFrame: TIMING.mouseMove2Start,
      endFrame: TIMING.mouseMove2End,
    },
    {
      from: MOUSE_ROW_AHA_MOMENT,
      to: MOUSE_CLOSE_X,
      startFrame: TIMING.mouseMove3Start,
      endFrame: TIMING.mouseMove3End,
    },
  ];

  const clickFrames = [
    TIMING.click1Frame,
    TIMING.click2Frame,
    TIMING.click3Frame,
  ];

  // ---- Cursor visibility ----
  //
  // The cursor only needs to be on screen while it's actively moving
  // toward a target and clicking it. Between beats (the camera-hold
  // pause after click 1, the panel-read pause after click 2, the
  // panel-close hold after click 3) we hide it so the user's eye
  // doesn't get stuck on a parked arrow.
  // Each window holds the cursor at full opacity for ~18 frames after
  // the click (so the click feedback lands clearly with the cursor
  // still parked on the target) before fading out over 10 frames.
  const visibilityWindows: CursorVisibilityWindow[] = [
    {
      start: TIMING.mouseEnter1Start - 4,
      end: TIMING.click1Frame + 28,
      fadeIn: 4,
      fadeOut: 10,
    },
    {
      start: TIMING.mouseMove2Start - 6,
      end: TIMING.click2Frame + 28,
      fadeIn: 6,
      fadeOut: 10,
    },
    {
      start: TIMING.mouseMove3Start - 6,
      end: TIMING.cursorFadeOutEnd,
      fadeIn: 6,
      fadeOut: TIMING.cursorFadeOutEnd - TIMING.cursorFadeOutStart,
    },
  ];

  // ---- Hover detection ----
  //
  // Compute the cursor's scene-space position with the same helper the
  // cursor renderer uses, then ask the table geometry which row (if
  // any) sits underneath it. Only treated as a hover while the cursor
  // is visible -- otherwise rows would briefly wash mid-pause when
  // the cursor is hidden but technically still parked over them.
  const cursorPos = computeCursorPosition(
    frame,
    MOUSE_OFFSCREEN,
    cursorSegments,
  );
  const cursorOnscreen = visibilityWindows.some(
    (w) => frame >= w.start && frame <= w.end,
  );
  const hoveredIndex = cursorOnscreen
    ? getHoveredRowIndex(cursorPos, ARTIFACTS_ANGLE2.length)
    : null;

  // ---- Camera (zoom + pan) ----
  //
  //   pre-click:           zoom 1.0,    focus centered
  //   zoomInStart..End:    zoom 1 -> 1.4 around the row-0 click point
  //                        (left + top edges of the window kept visible)
  //   panStart..End:       focusX shifts from left to right (right + top
  //                        edges kept visible), zoom held at 1.4
  //   hold:                steady at right-focused 1.4 zoom
  //   zoomOutStart..End:   zoom 1.4 -> 1, focusX eases back to center
  //                        so the framing settles before the cursor
  //                        moves down to row Aha
  const easing = Easing.out(Easing.cubic);

  const zoomLevel = (() => {
    if (frame < TIMING.zoomInStart) return 1;
    if (frame < TIMING.zoomInEnd) {
      return interpolate(
        frame,
        [TIMING.zoomInStart, TIMING.zoomInEnd],
        [1, ZOOM.level],
        { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
    if (frame < TIMING.zoomOutStart) return ZOOM.level;
    if (frame < TIMING.zoomOutEnd) {
      return interpolate(
        frame,
        [TIMING.zoomOutStart, TIMING.zoomOutEnd],
        [ZOOM.level, 1],
        { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
    return 1;
  })();

  const focusX = (() => {
    if (frame < TIMING.panStart) return FOCUS_LEFT_X;
    if (frame < TIMING.panEnd) {
      return interpolate(
        frame,
        [TIMING.panStart, TIMING.panEnd],
        [FOCUS_LEFT_X, FOCUS_RIGHT_X],
        { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
    if (frame < TIMING.zoomOutStart) return FOCUS_RIGHT_X;
    if (frame < TIMING.zoomOutEnd) {
      // Drift focus back toward center while zooming out so the
      // framing doesn't snap sideways when the scale lands at 1.
      return interpolate(
        frame,
        [TIMING.zoomOutStart, TIMING.zoomOutEnd],
        [FOCUS_RIGHT_X, 0.5],
        { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
    return 0.5;
  })();

  const focusY = zoomLevel > 1 ? FOCUS_TOP_Y : 0.5;

  return (
    <AbsoluteFill>
      <Background />
      <BrowserWindow
        url="app.sundial.ai"
        zoom={zoomLevel}
        focusX={focusX}
        focusY={focusY}
      >
        <SplitView
          splitProgress={splitProgress}
          left={
            <ArtifactsList
              selectedIndex={selectedIndex}
              hoveredIndex={hoveredIndex}
            />
          }
          right={
            panelMounted ? (
              <ArtifactPanel
                activeArtifact={activeArtifact}
                swapProgress={swapProgress}
                loadingOpacity={loadingOpacity}
              />
            ) : null
          }
        />
      </BrowserWindow>
      <AnimatedCursor
        initialPosition={MOUSE_OFFSCREEN}
        segments={cursorSegments}
        clickFrames={clickFrames}
        visibilityWindows={visibilityWindows}
      />
    </AbsoluteFill>
  );
};

export default PlaybooksAngle2Scene;
