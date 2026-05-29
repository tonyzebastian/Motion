import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Freeze,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { CITATIONS, LAYOUT, ZOOM } from '../Playbooks/constants';
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
import { TrustSignalChatColumn } from '../PlaybooksTrustSignal/components/TrustSignalChatColumn';
import { CitationPopover } from './components/CitationPopover';
import {
  FOCUS_X,
  FOCUS_Y,
  FROZEN_CHAT_FRAME,
  HOVERED_CITATION_INDEX,
  MOUSE_OFFSCREEN,
  MOUSE_TAG,
  TIMING,
} from './timing';

const easeOut = Easing.out(Easing.cubic);

// ============================================
// Playbooks Citations Scene
// ============================================
//
// Continues from the trust-signal end state (split open, dashboard
// streamed, High Confidence tag settled). The left chat column is
// frozen in that settled state; the right artifact panel grows an
// inline citation layer:
//   - [1]..[8] markers fade in across the report (staggered by index)
//   - the camera zooms into the MAU composition grid
//   - the cursor parks on citation [1] (Total MAU 51,955)
//   - a footnote popover surfaces (source table + description + View SQL)
//   - hold, then popover + cursor out and the camera zooms back
//
type PlaybooksCitationsSceneProps = {
  /**
   * When false, the decorative scene wallpaper is omitted so the floating
   * browser window can sit on top of whatever the parent composition
   * provides (e.g. the reel's mesh gradient). Defaults to true to keep
   * the standalone composition unchanged.
   */
  showBackground?: boolean;
  /**
   * When true, the citation markers start fully visible instead of
   * staggering in. The reel sets this because the preceding Trust Signal
   * sub-sequence already shows the markers, so re-fading them here would
   * read as a jump. The standalone composition leaves it false to keep
   * the staggered reveal as an intro.
   */
  citationsPrefilled?: boolean;
};

export const PlaybooksCitationsScene: React.FC<
  PlaybooksCitationsSceneProps
> = ({ showBackground = true, citationsPrefilled = false }) => {
  const frame = useCurrentFrame();

  // Split is already fully open for this beat; freeze the contracted
  // chat-column width that the trust-signal scene settles into.
  const chatColumnWidth =
    LAYOUT.leftColWidthSplit - LAYOUT.leftColPaddingSplit * 2;

  // ---- Phase A: staggered marker fade-in ----
  // In the reel the markers are already visible (carried over from the
  // Trust Signal sub-sequence), so they start fully filled to avoid a
  // pop-in at the crossfade.
  const citationOpacities: Record<number, number> = {};
  for (let i = 1; i <= 8; i++) {
    if (citationsPrefilled) {
      citationOpacities[i] = 1;
      continue;
    }
    const start = TIMING.citationsFadeInStart + (i - 1) * TIMING.citationStaggerStep;
    citationOpacities[i] = interpolate(
      frame,
      [start, start + TIMING.citationFadeLen],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  // ---- Phase D/F: popover surface + dismiss ----
  const popoverFadeIn = interpolate(
    frame,
    [TIMING.popoverFadeInStart, TIMING.popoverFadeInEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const popoverFadeOut = interpolate(
    frame,
    [TIMING.popoverFadeOutStart, TIMING.popoverFadeOutEnd],
    [1, 0],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const popoverOpacity = Math.min(popoverFadeIn, popoverFadeOut);
  const popoverMounted =
    frame >= TIMING.popoverFadeInStart && frame <= TIMING.popoverFadeOutEnd;

  const hoveredCitationIndex = popoverMounted
    ? HOVERED_CITATION_INDEX
    : undefined;
  const popoverNode = popoverMounted ? (
    <CitationPopover
      citation={CITATIONS[HOVERED_CITATION_INDEX]}
      opacity={popoverOpacity}
      liftProgress={popoverOpacity}
      align="right"
    />
  ) : undefined;

  // ---- Camera (zoom into the MAU grid, hold, zoom out) ----
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

  // ---- Cursor: enter -> park on [1] -> exit ----
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

  // Soft pulse as the cursor lands on the marker (hover, not a click).
  const clickFrames: number[] = [TIMING.mouseEnterEnd];

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
      {showBackground && <Background />}
      <BrowserWindow
        url="app.sundial.ai"
        zoom={zoom}
        focusX={FOCUS_X}
        focusY={FOCUS_Y}
      >
        <ChatColumnWidthContext.Provider value={chatColumnWidth}>
          <SplitView
            splitProgress={1}
            left={
              <Freeze frame={FROZEN_CHAT_FRAME}>
                <TrustSignalChatColumn />
              </Freeze>
            }
            right={
              <ArtifactViewer
                citationOpacities={citationOpacities}
                hoveredCitationIndex={hoveredCitationIndex}
                popoverNode={popoverNode}
              />
            }
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

export default PlaybooksCitationsScene;
