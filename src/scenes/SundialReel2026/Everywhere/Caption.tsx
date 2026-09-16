import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import { fontFamily as aleo, loadFont as loadAleo } from '@remotion/google-fonts/Aleo';
import { B_CHROME_IN_START, BEAT_C_START, ZOOM_OUT_START } from './timing';

loadFunnelSans('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});

loadAleo('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;
const ALEO_STACK = `"${aleo}", "Georgia", "Times New Roman", serif`;
const PLUM = '#531D59';

// Vertical center of the caption block. When only line 1 is on screen it sits
// centered here; once line 2 rises in, the growing block re-centers around
// this point so line 1 is pushed UP and line 2 settles below it.
const CAPTION_CENTER_Y = 892;

// Line 1 — uppercase Funnel Sans, revealed segment-by-segment as each
// surface appears. Smaller + lighter than the opening headline's line 1.
const LINE1_FONT_SIZE = 42;

// Line 2 — serif Aleo payoff line. Bolder than line 1 and the same family
// the headline uses, but much smaller / lighter than that 92px treatment.
const LINE2_FONT_SIZE = 58;
const LINE2_LINE_HEIGHT = 1.15;
const LINE2_BOX = Math.round(LINE2_FONT_SIZE * LINE2_LINE_HEIGHT);
const LINE2_GAP = 10; // gap between line 1 and line 2 once revealed
const LINE2_RISE_PX = 28;

// --- Reveal schedule (section-relative frames) ---
//   "Ask in Slack" → when the Slack UI appears
//   ", on web"     → when the Claude (web) UI appears
//   ", anywhere"   → as the camera zooms back out (Sundial MCP removed)
//   line 2         → just after line 1 finishes, pushing line 1 up
const SEG_DURATION = 28;
const SLACK_REVEAL_START = B_CHROME_IN_START; // 260
const WEB_REVEAL_START = BEAT_C_START + 4; // 394
// ", anywhere" lands in step with the zoom-out: as the UI pulls back to its
// resting frame, the caption resolves to its final "anywhere" state.
const ANYWHERE_REVEAL_START = ZOOM_OUT_START; // 564
// Line 2 rises in shortly after "anywhere" finishes building (now that the
// "anywhere" segment was pulled earlier to ride the zoom-out), so the serif
// payoff lands sooner and has more room to breathe before the section ends.
const LINE2_REVEAL_START = ANYWHERE_REVEAL_START + SEG_DURATION + 12; // 604
const LINE2_DURATION = 44;

// Approximate rendered widths (px) that the appended segments add to line 1.
// Used only to compensate line 1's horizontal recentering so it GLIDES left
// as each new segment fades in, instead of popping. The final (all-revealed)
// layout is centered by flexbox regardless, so small inaccuracies here only
// affect the transient slide.
const WIDTH_ON_WEB = 185;
const WIDTH_ANYWHERE = 265;

const softBlur = Easing.bezier(0.22, 1, 0.36, 1);
const smoothGlide = Easing.bezier(0.16, 1, 0.3, 1);

export const Caption: React.FC = () => {
  const frame = useCurrentFrame();

  const segReveal = (start: number): number =>
    interpolate(frame, [start, start + SEG_DURATION], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: softBlur,
    });

  // Soft-blur-in style reveal for an inline line-1 segment. Unrevealed
  // segments are pulled out of layout (display:none) so the visible phrase
  // stays centered; the horizontal recenter is smoothed by `line1ShiftX`.
  const segStyle = (start: number, alwaysShown = false): React.CSSProperties => {
    const t = segReveal(start);
    const shown = alwaysShown || frame >= start;
    return {
      display: shown ? 'inline-block' : 'none',
      whiteSpace: 'pre',
      opacity: t,
      transform: `translateY(${(1 - t) * 8}px)`,
      filter: `blur(${(1 - t) * 6}px)`,
      willChange: 'transform, opacity, filter',
    };
  };

  // Compensate line 1's recentering: when a segment enters layout its width
  // appears instantly, shifting the centered line left by width/2. We cancel
  // that with an equal rightward offset at the toggle frame, then ramp it to
  // zero as the segment reveals — turning the pop into a smooth glide.
  const webReveal = segReveal(WEB_REVEAL_START);
  const anywhereReveal = segReveal(ANYWHERE_REVEAL_START);
  const compWeb =
    frame < WEB_REVEAL_START ? 0 : (WIDTH_ON_WEB / 2) * (1 - webReveal);
  const compAnywhere =
    frame < ANYWHERE_REVEAL_START
      ? 0
      : (WIDTH_ANYWHERE / 2) * (1 - anywhereReveal);
  const line1ShiftX = compWeb + compAnywhere;

  // Line 2 rises in and grows the block height (which pushes line 1 up via the
  // block's center anchoring).
  const line2Reveal = interpolate(
    frame,
    [LINE2_REVEAL_START, LINE2_REVEAL_START + LINE2_DURATION],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smoothGlide },
  );
  const line2Opacity = interpolate(
    frame,
    [LINE2_REVEAL_START, LINE2_REVEAL_START + LINE2_DURATION * 0.8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: softBlur },
  );
  const line2MaskHeight = (LINE2_BOX + LINE2_GAP) * line2Reveal;
  const line2InnerY = (1 - line2Reveal) * LINE2_RISE_PX;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: CAPTION_CENTER_Y,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Line 1 — uppercase, built up segment-by-segment. */}
        <div
          style={{
            fontFamily: FUNNEL_STACK,
            fontWeight: 400,
            fontSize: LINE1_FONT_SIZE,
            lineHeight: 1.2,
            color: PLUM,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            transform: `translateX(${line1ShiftX}px)`,
            willChange: 'transform',
          }}
        >
          <span style={segStyle(SLACK_REVEAL_START, true)}>Ask in Slack</span>
          <span style={segStyle(WEB_REVEAL_START)}>, on web</span>
          <span style={segStyle(ANYWHERE_REVEAL_START)}>, anywhere</span>
        </div>

        {/* Line 2 — serif payoff. The mask wrapper height animates 0 → full so
            the block grows and pushes line 1 up; the inner text rises into the
            mask for a clean reveal. */}
        <div style={{ overflow: 'hidden', height: line2MaskHeight }}>
          <div
            style={{
              paddingTop: LINE2_GAP,
              fontFamily: ALEO_STACK,
              fontWeight: 600,
              fontSize: LINE2_FONT_SIZE,
              lineHeight: LINE2_LINE_HEIGHT,
              color: PLUM,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              opacity: line2Opacity,
              transform: `translateY(${line2InnerY}px)`,
              willChange: 'transform, opacity',
            }}
          >
            Sundial answers and remembers.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
