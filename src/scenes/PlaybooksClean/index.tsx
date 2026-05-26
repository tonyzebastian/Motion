import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { AgendaScreen } from '../Playbooks/components/AgendaScreen';
import { ArtifactViewer } from '../Playbooks/components/ArtifactViewer';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { ChatColumnWidthContext } from '../Playbooks/components/ChatColumnWidth';
import { MouseCursor } from '../Playbooks/components/MouseCursor';
import { SplitView } from '../Playbooks/components/SplitView';
import { LAYOUT, MOUSE_START, MOUSE_TARGET, TIMING, ZOOM } from '../Playbooks/constants';

// ============================================
// PlaybooksClean Scene
// ============================================
// Identical to the Playbooks scene, but trimmed to the actual content area:
// - The decorative <Background /> behind the browser window is removed.
// - The Screen-Studio-style padding (windowPaddingX / windowPaddingTop /
//   windowPaddingBottom) is set to 0, so the BrowserWindow fills the entire
//   composition.
// - The composition itself is sized 1120x720 (= LAYOUT.sceneWidth/Height
//   minus the padding) so there's no surrounding margin to render or export.
//
// Mouse coordinates and the zoom focus point are shifted by the removed
// padding so the cursor still lands on the input field and the camera still
// zooms around the same on-screen point as the original scene.

const CLEAN_SCENE_WIDTH = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2; // 1120
const CLEAN_SCENE_HEIGHT =
  LAYOUT.sceneHeight - LAYOUT.windowPaddingTop - LAYOUT.windowPaddingBottom; // 720

// In the clean scene the BrowserWindow has no padding, so window-local
// coordinates equal scene coordinates. Shift the original mouse targets
// (which were in 1280x900 scene-space) into the new 1120x720 scene-space.
const CLEAN_MOUSE_TARGET = {
  x: MOUSE_TARGET.x - LAYOUT.windowPaddingX,
  y: MOUSE_TARGET.y - LAYOUT.windowPaddingTop,
};
const CLEAN_MOUSE_START = {
  x: Math.min(
    Math.max(MOUSE_START.x - LAYOUT.windowPaddingX, 0),
    CLEAN_SCENE_WIDTH,
  ),
  y: Math.min(
    Math.max(MOUSE_START.y - LAYOUT.windowPaddingTop, 0),
    CLEAN_SCENE_HEIGHT,
  ),
};

// Zoom focus point as a fraction of the window's own size. With zero
// padding the window equals the scene, so this is just the click point
// divided by the scene dimensions. We don't apply the original
// minEdgeMargin clamp because there's no visible background to keep
// peeking out from behind the zoomed window.
const FOCUS_X = CLEAN_MOUSE_TARGET.x / CLEAN_SCENE_WIDTH;
const FOCUS_Y = CLEAN_MOUSE_TARGET.y / CLEAN_SCENE_HEIGHT;

export const PlaybooksCleanScene: React.FC = () => {
  const frame = useCurrentFrame();

  const easing = Easing.out(Easing.cubic);

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

  const splitProgress = interpolate(
    frame,
    [TIMING.phase7Start, TIMING.phase7SplitOpenEnd],
    [0, 1],
    { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
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
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <BrowserWindow
        url="app.sundial.ai"
        zoom={zoom}
        focusX={FOCUS_X}
        focusY={FOCUS_Y}
        paddingX={0}
        paddingTop={0}
        paddingBottom={0}
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
      <MouseCursor start={CLEAN_MOUSE_START} target={CLEAN_MOUSE_TARGET} />
    </AbsoluteFill>
  );
};

export default PlaybooksCleanScene;
