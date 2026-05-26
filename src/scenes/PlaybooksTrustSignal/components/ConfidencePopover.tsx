import React from 'react';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

const BULLET_TEXT = 'rgba(15, 23, 42, 0.78)';
// Outlined circle-check tick, color-matched to the tag chrome so the
// popover and the trigger pill read as one trust-signal motif.
const BULLET_STROKE = '#128902';

type ConfidencePopoverProps = {
  /** 0..1 fade-in / fade-out controlled by the parent scene. */
  opacity?: number;
  /**
   * Whether to apply a small upward translate as the popover appears.
   * The parent passes the same value as `opacity`; we map it to a
   * 4px slide so the popover lifts as it fades in (and drops as it
   * fades out).
   */
  liftProgress?: number;
  style?: React.CSSProperties;
};

/**
 * Hover popover anchored above the High Confidence tag. Just the
 * trust-signal bullets -- no redundant heading (the tag itself is
 * already labeled "High confidence").
 *
 * Positioning is handled by the caller (the popover sits inside a
 * `position: relative` wrapper around the tag in the chat column);
 * this component just owns its own card chrome + content.
 */
export const ConfidencePopover: React.FC<ConfidencePopoverProps> = ({
  opacity = 1,
  liftProgress = 1,
  style,
}) => {
  const translateY = (1 - Math.max(0, Math.min(1, liftProgress))) * 4;

  return (
    <div
      style={{
        position: 'absolute',
        // Anchor above the sibling tag; the tag sits flush left in the
        // conversation column so the popover's left edge lines up
        // with the tag's left edge.
        bottom: 'calc(100% + 8px)',
        left: 0,
        // No maxWidth -- with `whiteSpace: nowrap` on the bullets the
        // card sizes itself to the longest bullet so neither line
        // wraps mid-phrase.
        padding: '14px 22px 14px 16px',
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: [
          '0 12px 32px rgba(15, 23, 42, 0.12)',
          '0 2px 6px rgba(15, 23, 42, 0.06)',
        ].join(', '),
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <PopoverBullet>Playbook used: Long Term Metric Change</PopoverBullet>
        <PopoverBullet>Metric from trusted semantic layer</PopoverBullet>
      </ul>
    </div>
  );
};

// Outlined circle-check tick: a green stroked circle with a single
// green check stroked inside (no fill). Inline SVG so the circle's
// stroke width can be tuned independently of the check's stroke.
const CircleTick: React.FC = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 16 16"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <circle
      cx={8}
      cy={8}
      r={7}
      fill="none"
      stroke={BULLET_STROKE}
      strokeWidth={1.6}
    />
    <path
      d="M4.8 8.3 L7.0 10.4 L11.3 6"
      stroke={BULLET_STROKE}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const PopoverBullet: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <li
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: FONT_FAMILY,
      fontWeight: 400,
      fontSize: 12.5,
      lineHeight: '18px',
      letterSpacing: '-0.1px',
      color: BULLET_TEXT,
      whiteSpace: 'nowrap',
    }}
  >
    <CircleTick />
    <span>{children}</span>
  </li>
);
