import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { LAYOUT, ZOOM } from '../Playbooks/constants';
import { Background } from '../Playbooks/components/Background';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { SplitView } from '../Playbooks/components/SplitView';
import {
  AnimatedCursor,
  type CursorVisibilityWindow,
} from '../PlaybooksAngle2/components/AnimatedCursor';
import {
  computeCursorPosition,
  type CursorSegment,
  getHoveredRowIndex,
  MOUSE_CLOSE_X,
  MOUSE_OFFSCREEN,
  MOUSE_ROW_AHA_MOMENT,
  MOUSE_ROW_LONG_TERM,
  TIMING,
} from '../PlaybooksAngle2/timing';
import {
  ActivePlaybook,
  PlaybookPanel,
} from './components/PlaybookPanel';
import { PlaybooksList } from './components/PlaybooksList';
import {
  AHA_MOMENT_ROW_INDEX,
  LONG_TERM_ROW_INDEX,
  PLAYBOOKS_ANGLE_2_1,
} from './data';

// ---- Camera focus clamps ----
//
// Same derivations as PlaybooksAngle2: zoom around (focusX, focusY)
// while keeping a minimum margin on the relevant scene edges.
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
// Playbooks Angle 2.1 Scene
// ============================================
// Sibling of PlaybooksAngle2 with the same cursor-driven choreography
// (enter -> click row 0 -> panel slides in -> cursor to row 5 -> click
// + loading + cross-fade -> hold -> cursor to close -> panel slides
// out). Differences:
//
//   - Left column lists playbooks (single Name column) instead of
//     artifacts.
//   - Right panel renders a playbook detail preview (LLM description +
//     Content) instead of a report.
//   - Toolbar carries Edit + Download + Close (no HTML badge, no
//     Shared toggle).

const easeOut = Easing.out(Easing.cubic);

export const PlaybooksAngle2_1Scene: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- Split progress ----
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

  const panelMounted =
    frame >= TIMING.panelOpenStart && frame < TIMING.panelCloseEnd;

  // ---- Selection state ----
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

  // ---- Active playbook + swap progress ----
  const activePlaybook: ActivePlaybook =
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
  // Same waypoints as PlaybooksAngle2 (row 0 and row 5 click targets
  // land at the same scene-space points because the row geometry is
  // unchanged). Long Term Metric Change must sit at data index 0 and
  // Aha Moment at data index 5 in `PLAYBOOKS_ANGLE_2_1` for the
  // selection state above to match the cursor's target.
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
  const cursorPos = computeCursorPosition(
    frame,
    MOUSE_OFFSCREEN,
    cursorSegments,
  );
  const cursorOnscreen = visibilityWindows.some(
    (w) => frame >= w.start && frame <= w.end,
  );
  const hoveredIndex = cursorOnscreen
    ? getHoveredRowIndex(cursorPos, PLAYBOOKS_ANGLE_2_1.length)
    : null;

  // ---- Camera (zoom + pan) ----
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
            <PlaybooksList
              selectedIndex={selectedIndex}
              hoveredIndex={hoveredIndex}
            />
          }
          right={
            panelMounted ? (
              <PlaybookPanel
                activePlaybook={activePlaybook}
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

export default PlaybooksAngle2_1Scene;
