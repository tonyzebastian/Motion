import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';

loadFunnelSans('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

// Reel caption house color (matches Everywhere/Caption.tsx).
const PLUM = '#531D59';

// Signature reel easings.
const SOFT_IN = Easing.bezier(0.22, 1, 0.36, 1);
const SHARP_OUT = Easing.bezier(0.64, 0, 0.78, 0);

// --- Fly-in timing (frames @ 60fps) ---
// Snappier than the raw catalog (900ms) so the captions read quickly in a
// reel: label glides in first, then the description lines slide in from the
// margin edge one after another (line-by-line-slide).
const LABEL_ENTER = 20;
const LINE_ENTER = 28;
const LINE_STAGGER = 6;
const LABEL_LEAD = 6; // description lines start after the label begins

const EXIT_DUR = 22;
const EXIT_STAGGER = 4;

export type CaptionSide = 'left' | 'right';

export type PlaybookCaptionProps = {
  /** Uppercase eyebrow label, e.g. "Deep Playbooks". */
  label: string;
  /** Description, one entry per rendered line (controls line breaks). */
  description: string[];
  /** Which margin column the caption sits in. */
  side: CaptionSide;
  /** Top edge of the caption block, in 1920x1080 frame space. */
  top: number;
  /**
   * Total mounted length of this caption (== its Sequence durationInFrames).
   * Used to schedule the exit so it animates out before the beat ends.
   */
  durationInFrames: number;
  /** Column width in px (defaults to a narrow margin column). */
  width?: number;
};

/**
 * Product-video style explainer caption that flies in from the page margin.
 *
 * Lives in full 1920x1080 frame space (rendered OUTSIDE the scaled 1280x900
 * stage) so it sits in the clear mesh column beside the browser window.
 *
 * Enter: the eyebrow label slides + blurs in, then each description line
 * slides in from the margin edge with a staggered offset (line-by-line-slide).
 * Exit: the whole block fades + drifts back toward its margin edge.
 */
export const PlaybookCaption: React.FC<PlaybookCaptionProps> = ({
  label,
  description,
  side,
  top,
  durationInFrames,
  width = 300,
}) => {
  const frame = useCurrentFrame();

  // Margin edge direction: left-side captions enter/exit toward the left,
  // right-side captions toward the right. Positive sign points outward.
  const outward = side === 'left' ? -1 : 1;
  const isRight = side === 'right';

  const exitStart = durationInFrames - (EXIT_DUR + (description.length - 1) * EXIT_STAGGER) - 4;

  // Block-level exit fade so label + lines leave together.
  const exitProgress = interpolate(
    frame,
    [exitStart, exitStart + EXIT_DUR],
    [0, 1],
    { easing: SHARP_OUT, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ---- Label: slide + blur in ----
  const labelEnter = interpolate(frame, [0, LABEL_ENTER], [0, 1], {
    easing: SOFT_IN,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelExit = interpolate(
    frame,
    [exitStart, exitStart + EXIT_DUR],
    [0, 1],
    { easing: SHARP_OUT, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const labelOpacity = labelEnter * (1 - labelExit);
  const labelX = (1 - labelEnter) * 48 * outward + labelExit * 32 * outward;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top,
          width,
          ...(side === 'left' ? { left: 56 } : { right: 56 }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: isRight ? 'flex-end' : 'flex-start',
          textAlign: isRight ? 'right' : 'left',
          gap: 18,
        }}
      >
        {/* Eyebrow label */}
        <div
          style={{
            fontFamily: FUNNEL_STACK,
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.15,
            color: PLUM,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            opacity: labelOpacity,
            transform: `translateX(${labelX}px)`,
            filter: `blur(${(1 - labelEnter) * 5}px)`,
            willChange: 'transform, opacity, filter',
          }}
        >
          {label}
        </div>

        {/* Description: line-by-line slide-in from the margin edge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {description.map((line, i) => {
            const enterStart = LABEL_LEAD + i * LINE_STAGGER;
            const enter = interpolate(
              frame,
              [enterStart, enterStart + LINE_ENTER],
              [0, 1],
              { easing: SOFT_IN, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const lineExitStart = exitStart + i * EXIT_STAGGER;
            const exit = interpolate(
              frame,
              [lineExitStart, lineExitStart + EXIT_DUR],
              [0, 1],
              { easing: SHARP_OUT, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const x = (1 - enter) * 56 * outward + exit * 36 * outward;
            return (
              <div
                key={i}
                style={{
                  fontFamily: FUNNEL_STACK,
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.35,
                  color: PLUM,
                  opacity: enter * (1 - exit),
                  transform: `translateX(${x}px)`,
                  willChange: 'transform, opacity',
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default PlaybookCaption;
