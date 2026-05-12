import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PulsingDot, PulsingDotVariant } from './PulsingDot';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ThinkingBlockProps = {
  /** The currently displayed label. */
  label?: string;
  /**
   * If provided with `transition`, the label flips to `nextLabel` (X-axis
   * card flip) as transition goes 0 -> 1. The pulsing dot keeps running
   * uninterrupted.
   */
  nextLabel?: string;
  /** 0..1 progress of the label rename animation. */
  transition?: number;
  /** Whether to apply the horizontal shimmer to the primary label. */
  shimmer?: boolean;
  /**
   * Whether to apply the horizontal shimmer to `nextLabel`. Useful when the
   * second label is a static status string ("Searching for relevant
   * playbook") that shouldn't animate.
   */
  nextLabelShimmer?: boolean;
  /** Color variant for the pulsing dot. Defaults to purple. */
  dotVariant?: PulsingDotVariant;
  style?: React.CSSProperties;
};

const SHIMMER_PERIOD = 75;

const baseLabelStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '-0.2px',
  whiteSpace: 'nowrap',
  color: 'rgba(115, 115, 115, 1)',
};

// Shimmer style: animated gradient stop position so the highlight crosses
// the full word width every period. Applied only when shimmer is enabled.
const shimmerSpanStyle = (
  shimmerPos: number,
  extra: React.CSSProperties = {},
): React.CSSProperties => ({
  ...baseLabelStyle,
  backgroundImage: `linear-gradient(90deg, rgba(115, 115, 115, 1) 0%, rgba(115, 115, 115, 1) ${shimmerPos - 20}%, rgba(115, 115, 115, 0.3) ${shimmerPos}%, rgba(115, 115, 115, 1) ${shimmerPos + 20}%, rgba(115, 115, 115, 1) 100%)`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  ...extra,
});

const staticSpanStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...baseLabelStyle,
  ...extra,
});

/**
 * "Thinking..." status pill with a pulsing purple dot and a horizontally
 * sweeping shimmer over the label text. When `nextLabel` + `transition`
 * are provided, the label flips to the new text on an X-axis card flip
 * (front face = label, back face pre-rotated 180deg = nextLabel) so the
 * change reads as a single physical motion instead of a cross-fade.
 */
export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  label = 'Thinking...',
  nextLabel,
  transition = 0,
  shimmer = true,
  nextLabelShimmer = true,
  dotVariant = 'purple',
  style,
}) => {
  const frame = useCurrentFrame();

  // Shimmer sweep: 2.5s loop (75 frames). The gradient travels from -50% to
  // 150% so the highlight crosses the full word width.
  const shimmerT = (frame % SHIMMER_PERIOD) / SHIMMER_PERIOD;
  const shimmerPos = interpolate(shimmerT, [0, 1], [-50, 150]);

  const t = Math.max(0, Math.min(1, transition));

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      {/* Pulsing status dot with a slight white outline. The label's faces
          are flex-centered to the row's geometric centerline, so the dot's
          own centerline matches without any margin nudge. */}
      <PulsingDot variant={dotVariant} />

      {/* Label. When no rename is in flight, render a single span so the
          parent flex row can hug it. During the rename, the front face
          (label) and back face (nextLabel, pre-rotated 180deg) share a
          card that flips around the X axis as `transition` goes 0 -> 1.
          backface-visibility: hidden swaps which face is visible at the
          halfway point. */}
      {(() => {
        const primarySpanStyle = shimmer
          ? shimmerSpanStyle(shimmerPos)
          : staticSpanStyle();
        const nextSpanStyle = nextLabelShimmer
          ? shimmerSpanStyle(shimmerPos)
          : staticSpanStyle();

        if (nextLabel === undefined) {
          return <span style={primarySpanStyle}>{label}</span>;
        }

        // Ghost sizes the wrapper to whichever label is widest; both faces
        // are absolutely positioned inside.
        const ghostText =
          nextLabel.length > label.length ? nextLabel : label;

        const faceBase: React.CSSProperties = {
          position: 'absolute',
          left: 0,
          top: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        };

        return (
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              // Intentionally no `perspective` here: an orthographic flip
              // keeps the projected vertical center of the rotated text
              // pinned to the row's centerline, so the dot stays in lock
              // with the label throughout the rotation. A perspective
              // value compresses the y-projection of the rotated text and
              // makes the dot read as drifting away from it mid-flip.
              verticalAlign: 'middle',
            }}
          >
            <span
              aria-hidden
              style={{
                ...staticSpanStyle(),
                display: 'inline-block',
                visibility: 'hidden',
                verticalAlign: 'top',
              }}
            >
              {ghostText}
            </span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
                transform: `rotateX(${180 * t}deg)`,
              }}
            >
              <span
                style={{
                  ...primarySpanStyle,
                  ...faceBase,
                  // Each face is the full card height so its rendered text
                  // line is centered on the card's rotation axis -- same
                  // y as the dot. Without an explicit height, the face's
                  // intrinsic size depends on its content's line metrics
                  // which can land a fraction of a pixel off-axis.
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  ...nextSpanStyle,
                  ...faceBase,
                  transform: 'rotateX(180deg)',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {nextLabel}
              </span>
            </span>
          </span>
        );
      })()}
    </div>
  );
};
