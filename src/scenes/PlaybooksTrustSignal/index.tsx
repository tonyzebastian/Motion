import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { LAYOUT, ZOOM } from '../Playbooks/constants';
import { ArtifactViewer } from '../Playbooks/components/ArtifactViewer';
import { Background } from '../Playbooks/components/Background';
import { BrowserWindow } from '../Playbooks/components/BrowserWindow';
import { ChatColumnWidthContext } from '../Playbooks/components/ChatColumnWidth';
import { SplitView } from '../Playbooks/components/SplitView';
import {
  AnimatedCursor,
  type CursorVisibilityWindow,
} from '../PlaybooksAngle2/components/AnimatedCursor';
import type { CursorSegment } from '../PlaybooksAngle2/timing';
import { TrustSignalChatColumn } from './components/TrustSignalChatColumn';
import {
  FOCUS_X,
  FOCUS_Y,
  MOUSE_OFFSCREEN,
  MOUSE_TAG,
  TIMING,
} from './timing';

const easeOut = Easing.out(Easing.cubic);

// ============================================
// Playbooks Trust Signal Scene
// ============================================
//
// Picks up at the moment the artifacts panel begins sliding in
// (frame 0 = split start), runs the Phase 6 dashboard stream, fades
// in a new High Confidence tag above the feedback footer, then
// scripts a cursor-hover sequence that triggers a popover with a
// camera zoom-in. After a hold the cursor exits, the popover fades,
// and the camera zooms back to its resting state.
//
export const PlaybooksTrustSignalScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- Split slide-in ----
  const splitProgress = interpolate(
    frame,
    [TIMING.splitOpenStart, TIMING.splitOpenEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Same lerp as the original Phase 7 (Playbooks/index.tsx) so the
  // chat bubble + follow-up input + viewport reflow into the
  // contracted column the moment the split starts.
  const chatColumnWidth = interpolate(
    splitProgress,
    [0, 1],
    [
      LAYOUT.bubbleWidth,
      LAYOUT.leftColWidthSplit - LAYOUT.leftColPaddingSplit * 2,
    ],
  );

  // ---- Camera (zoom in around the tag, hold, zoom out) ----
  let zoom: number;
  if (frame < TIMING.zoomInStart) {
    zoom = 1;
  } else if (frame < TIMING.zoomInEnd) {
    zoom = interpolate(
      frame,
      [TIMING.zoomInStart, TIMING.zoomInEnd],
      [1, ZOOM.level],
      { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  } else if (frame < TIMING.zoomOutStart) {
    zoom = ZOOM.level;
  } else if (frame < TIMING.zoomOutEnd) {
    zoom = interpolate(
      frame,
      [TIMING.zoomOutStart, TIMING.zoomOutEnd],
      [ZOOM.level, 1],
      { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  } else {
    zoom = 1;
  }

  // ---- Cursor: enter -> park on tag -> exit ----
  //
  // The AnimatedCursor handles both segments + visibility windows in
  // one component, which avoids the double-render / fade-flicker
  // problems of stacking two of the original Playbooks MouseCursors.
  const cursorSegments: CursorSegment[] = [
    {
      from: MOUSE_OFFSCREEN,
      to: MOUSE_TAG,
      startFrame: TIMING.mouseEnterStart,
      endFrame: TIMING.mouseEnterEnd,
    },
    {
      from: MOUSE_TAG,
      to: MOUSE_OFFSCREEN,
      startFrame: TIMING.mouseExitStart,
      endFrame: TIMING.mouseExitEnd,
    },
  ];

  // No real "click" -- the popover triggers on hover. We still pulse
  // the cursor as it lands on the tag so the moment reads as a
  // deliberate gesture rather than an idle hover.
  const clickFrames: number[] = [TIMING.mouseEnterEnd];

  // Single visibility window: cursor appears just before the enter
  // segment and stays visible through the exit. Fade-in / fade-out
  // ramps soften the entry and exit so the cursor doesn't snap on or
  // off mid-pixel.
  const visibilityWindows: CursorVisibilityWindow[] = [
    {
      start: TIMING.mouseEnterStart - 8,
      end: TIMING.mouseExitEnd,
      fadeIn: 8,
      fadeOut: 16,
    },
  ];

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
          <SplitView
            splitProgress={splitProgress}
            left={<TrustSignalChatColumn />}
            right={<ArtifactViewer />}
          />
        </ChatColumnWidthContext.Provider>
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

export default PlaybooksTrustSignalScene;
