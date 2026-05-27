import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { AgendaScreen } from '../Playbooks/components/AgendaScreen';
import { ArtifactViewer } from '../Playbooks/components/ArtifactViewer';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { ChatColumnWidthContext } from '../Playbooks/components/ChatColumnWidth';
import { MouseCursor } from '../Playbooks/components/MouseCursor';
import { SplitView } from '../Playbooks/components/SplitView';
import { LAYOUT, MOUSE_START, MOUSE_TARGET, TIMING, ZOOM } from '../Playbooks/constants';

// Phase 4 zoom is anchored near the top-left of the body (top edge pinned,
// horizontal anchor pulled left) so the playbook reel and the chat content
// on the left side stay prominently visible as the camera pushes in.
const PHASE4_FOCUS_X = 0.25;
const PHASE4_FOCUS_Y = 0;

// ============================================
// PlaybooksClean Scene
// ============================================
// Identical to the Playbooks scene, but trimmed to the actual content area:
// - The decorative <Background /> behind the browser window is removed.
// - The Screen-Studio-style padding (windowPaddingX / windowPaddingTop /
//   windowPaddingBottom) is set to 0, so the BrowserWindow fills the entire
//   composition.
// - The Safari-style browser header is hidden, so the composition is just
//   the body content area.
// - The composition is sized 1120x668 (= LAYOUT.sceneWidth/Height minus
//   the padding minus the headerHeight) so there's no surrounding margin
//   or chrome to render or export.
//
// Mouse coordinates and the zoom focus point are shifted by the removed
// padding AND by the removed header height so the cursor still lands on
// the input field and the camera still zooms around the same on-screen
// point as the original scene.

const CLEAN_SCENE_WIDTH = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2; // 1120
const CLEAN_SCENE_HEIGHT =
  LAYOUT.sceneHeight -
  LAYOUT.windowPaddingTop -
  LAYOUT.windowPaddingBottom -
  LAYOUT.headerHeight; // 668

// In the clean scene the BrowserWindow has no padding and no header, so
// window-local body-coordinates equal scene coordinates. Shift the original
// mouse targets (which were in 1280x900 scene-space, with the body offset
// by windowPaddingTop + headerHeight from the top of the scene) into the
// new 1120x668 body-only scene-space.
const VERTICAL_TRIM = LAYOUT.windowPaddingTop + LAYOUT.headerHeight;
const CLEAN_MOUSE_TARGET = {
  x: MOUSE_TARGET.x - LAYOUT.windowPaddingX,
  y: MOUSE_TARGET.y - VERTICAL_TRIM,
};
const CLEAN_MOUSE_START = {
  x: Math.min(
    Math.max(MOUSE_START.x - LAYOUT.windowPaddingX, 0),
    CLEAN_SCENE_WIDTH,
  ),
  y: Math.min(
    Math.max(MOUSE_START.y - VERTICAL_TRIM, 0),
    CLEAN_SCENE_HEIGHT,
  ),
};

export const PlaybooksCleanScene: React.FC = () => {
  const frame = useCurrentFrame();

  const easing = Easing.out(Easing.cubic);

  // Phase 1 zoom (around the input click point) is intentionally
  // disabled in the clean scene -- we stay at 1x while the user types
  // the initial prompt. Only the Phase 4 "searching for playbook" zoom
  // is kept, anchored to the top-left so the reel stays fully visible.
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
  if (frame < TIMING.searchZoomInStart) {
    zoom = 1;
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
        focusX={PHASE4_FOCUS_X}
        focusY={PHASE4_FOCUS_Y}
        paddingX={0}
        paddingTop={0}
        paddingBottom={0}
        showHeader={false}
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
