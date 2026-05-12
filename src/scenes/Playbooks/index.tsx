import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { AgendaScreen } from './components/AgendaScreen';
import { ArtifactViewer } from './components/ArtifactViewer';
import { Background } from './components/Background';
import { BrowserWindow } from './components/BrowserWindow';
import { ChatColumnWidthContext } from './components/ChatColumnWidth';
import { MouseCursor } from './components/MouseCursor';
import { SplitView } from './components/SplitView';
import { LAYOUT, MOUSE_TARGET, TIMING, ZOOM } from './constants';

// ============================================
// Playbooks Scene
// ============================================
// Phase 1: mouse cursor enters → clicks the agenda input → input becomes
// focused → camera zooms in (Screen-Studio style) → text types in → camera
// zooms back out.
// Phase 4: when the agent begins "Searching for relevant playbook", the
// camera zooms back in (same focus point) and holds through the reel until
// the matched playbook is selected. As the chip lifts up, the camera zooms
// back out so the chip, follow-up reply, and returning thinking state all
// resolve at the unzoomed scale.

// Convert the scene-space click point into focus fractions inside the window
// (BrowserWindow's transformOrigin is `${focusX * 100}% ${focusY * 100}%`
// of the rendered window).
const windowWidth = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2;
const windowHeight =
  LAYOUT.sceneHeight - LAYOUT.windowPaddingTop - LAYOUT.windowPaddingBottom;

const rawFocusX = (MOUSE_TARGET.x - LAYOUT.windowPaddingX) / windowWidth;
const rawFocusY = (MOUSE_TARGET.y - LAYOUT.windowPaddingTop) / windowHeight;

// Clamp focus so the window keeps a minimum margin from the scene's
// top and left edges after scaling (so the background is still visible
// above and to the left of the zoomed window).
// Derivation: top edge of window in scene coords after scale =
//   paddingTop + focusY * windowHeight * (1 - zoom)
// For that to stay >= minEdgeMargin we need
//   focusY <= (paddingTop - minEdgeMargin) / (windowHeight * (zoom - 1))
const maxFocusX =
  (LAYOUT.windowPaddingX - ZOOM.minEdgeMargin) /
  (windowWidth * (ZOOM.level - 1));
const maxFocusY =
  (LAYOUT.windowPaddingTop - ZOOM.minEdgeMargin) /
  (windowHeight * (ZOOM.level - 1));

const FOCUS_X = Math.min(Math.max(rawFocusX, 0), maxFocusX);
const FOCUS_Y = Math.min(Math.max(rawFocusY, 0), maxFocusY);

export const PlaybooksScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Snappy ease-out for both directions
  const easing = Easing.out(Easing.cubic);

  // Zoom in/out keyframes. Two zoom passes share the same focus point:
  //   Phase 1: 38→56 in, hold, 128→146 out  (mouse click + typing)
  //   Phase 4: 280→298 in, hold, 469→487 out (zoom out as the matched
  //            playbook is selected and lifts up as a chip)
  const phase1ZoomIn = interpolate(
    frame,
    [TIMING.zoomInStart, TIMING.zoomInEnd],
    [1, ZOOM.level],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const phase1ZoomOut = interpolate(
    frame,
    [TIMING.zoomOutStart, TIMING.zoomOutEnd],
    [ZOOM.level, 1],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const phase4ZoomIn = interpolate(
    frame,
    [TIMING.searchZoomInStart, TIMING.searchZoomInEnd],
    [1, ZOOM.level],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const phase4ZoomOut = interpolate(
    frame,
    [TIMING.searchZoomOutStart, TIMING.searchZoomOutEnd],
    [ZOOM.level, 1],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  let zoom: number;
  if (frame < TIMING.zoomOutStart) {
    zoom = phase1ZoomIn;
  } else if (frame < TIMING.searchZoomInStart) {
    zoom = phase1ZoomOut;
  } else if (frame < TIMING.searchZoomOutStart) {
    zoom = phase4ZoomIn;
  } else {
    zoom = phase4ZoomOut;
  }

  // Phase 7 split-screen progression. 0 pre-split, 1 fully split.
  // Drives both the SplitView column widths and the dynamic
  // chatColumnWidth that lets the chat content reflow into the
  // contracted left half.
  const splitProgress = interpolate(
    frame,
    [TIMING.phase7Start, TIMING.phase7SplitOpenEnd],
    [0, 1],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  // Chat column inner width: lerp from the original 800px down to the
  // left column's width minus padding on both sides, so the chat
  // content (bubble, viewport, follow-up input) lands with comfortable
  // breathing room rather than touching the column edges.
  const chatColumnWidth = interpolate(
    splitProgress,
    [0, 1],
    [
      LAYOUT.bubbleWidth,
      LAYOUT.leftColWidthSplit - LAYOUT.leftColPaddingSplit * 2,
    ],
  );
  const phase7Mounted = frame >= TIMING.phase7Start;

  return (
    <AbsoluteFill>
      <Background />
      <BrowserWindow
        url="app.sundial.ai"
        zoom={zoom}
        focusX={FOCUS_X}
        focusY={FOCUS_Y}
      >
        <ChatColumnWidthContext.Provider value={chatColumnWidth}>
          {phase7Mounted ? (
            <SplitView
              splitProgress={splitProgress}
              left={<AgendaScreen />}
              right={<ArtifactViewer />}
            />
          ) : (
            <AgendaScreen />
          )}
        </ChatColumnWidthContext.Provider>
      </BrowserWindow>
      <MouseCursor />
    </AbsoluteFill>
  );
};

export default PlaybooksScene;
