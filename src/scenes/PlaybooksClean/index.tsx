import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { AgendaScreen } from '../Playbooks/components/AgendaScreen';
import { ArtifactViewer } from '../Playbooks/components/ArtifactViewer';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { ChatColumnWidthContext } from '../Playbooks/components/ChatColumnWidth';
import { MouseCursor } from '../Playbooks/components/MouseCursor';
import { SplitView } from '../Playbooks/components/SplitView';
import { LAYOUT, MOUSE_START, MOUSE_TARGET, TIMING } from '../Playbooks/constants';
import { Sidebar, SIDEBAR_WIDTH } from './components/Sidebar';

// ============================================
// PlaybooksClean Scene
// ============================================
// Identical to the Playbooks scene, but trimmed to the actual content area
// and dressed in a slim product shell so it reads as the real Sundial app:
// - The decorative <Background /> behind the browser window is removed.
// - The Screen-Studio-style padding (windowPaddingX / windowPaddingTop /
//   windowPaddingBottom) is set to 0, so the BrowserWindow fills the entire
//   composition.
// - The Safari-style browser header is hidden, so the composition is just
//   the body content area.
// - A collapsed product Sidebar is docked on the left (matches the
//   Context-Engine Figma rail, node 319:4560) and takes SIDEBAR_WIDTH px.
// - The composition is sized SIDEBAR_WIDTH + bodyContentWidth wide so the
//   chat / artifact area still gets its full 1120px and existing layout
//   math (SplitView, agenda card, etc.) keeps working unchanged.
// - The Phase 1 and Phase 4 camera zooms are both disabled in this scene
//   so the product chrome stays anchored while the user watches the flow.
//
// Mouse coordinates are shifted by the removed padding AND header height
// (so the cursor still lands on the input field) AND by SIDEBAR_WIDTH so
// it tracks the chat column rather than the rail.

const CLEAN_CONTENT_WIDTH = LAYOUT.sceneWidth - LAYOUT.windowPaddingX * 2; // 1120
const CLEAN_SCENE_WIDTH = CLEAN_CONTENT_WIDTH + SIDEBAR_WIDTH; // 1168
const CLEAN_SCENE_HEIGHT =
  LAYOUT.sceneHeight -
  LAYOUT.windowPaddingTop -
  LAYOUT.windowPaddingBottom -
  LAYOUT.headerHeight; // 668

// In the clean scene the BrowserWindow has no padding and no header, so
// the chat content area starts at x = SIDEBAR_WIDTH. Shift the original
// mouse targets (which were in 1280x900 scene-space, with the body offset
// by windowPaddingTop + headerHeight from the top of the scene) into the
// new (SIDEBAR_WIDTH + 1120) x 668 scene-space.
const VERTICAL_TRIM = LAYOUT.windowPaddingTop + LAYOUT.headerHeight;
const CLEAN_MOUSE_TARGET = {
  x: MOUSE_TARGET.x - LAYOUT.windowPaddingX + SIDEBAR_WIDTH,
  y: MOUSE_TARGET.y - VERTICAL_TRIM,
};
const CLEAN_MOUSE_START = {
  x: Math.min(
    Math.max(MOUSE_START.x - LAYOUT.windowPaddingX + SIDEBAR_WIDTH, 0),
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
        paddingX={0}
        paddingTop={0}
        paddingBottom={0}
        showHeader={false}
        radius={0}
        showShadow={false}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
        >
          <Sidebar />
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              height: '100%',
              overflow: 'hidden',
            }}
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
          </div>
        </div>
      </BrowserWindow>
      <MouseCursor start={CLEAN_MOUSE_START} target={CLEAN_MOUSE_TARGET} />
    </AbsoluteFill>
  );
};

export default PlaybooksCleanScene;
