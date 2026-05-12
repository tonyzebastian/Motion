import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS } from '../constants';

export type PulsingDotVariant = 'purple' | 'green' | 'red';

type PulsingDotProps = {
  /** Color variant for the dot + halo. Defaults to purple. */
  variant?: PulsingDotVariant;
  /** Outer box (halo travel area). Defaults to 10. */
  size?: number;
  /** Core dot size (the solid inner circle). Defaults to 6. */
  coreSize?: number;
  /** Width of the white outline ring around the core dot. Defaults to 1. */
  outlineWidth?: number;
  /**
   * When false, render just the solid core dot + white outline (no pulsing
   * halo). Useful for static row decorators next to settled tool calls.
   * Defaults to true.
   */
  animated?: boolean;
  style?: React.CSSProperties;
};

const VARIANT_COLOR: Record<PulsingDotVariant, string> = {
  purple: COLORS.dotPurple,
  green: COLORS.dotGreen,
  red: COLORS.dotRed,
};

/**
 * Animated status dot used in the "Thinking..." pill (and any other status
 * surface). Renders three layers stacked at the same center:
 *
 *   1. A soft pulsing halo (same color as the core, scales out and fades).
 *   2. A slight white outline ring drawn via box-shadow on the core, which
 *      makes the colored dot pop on light/colored backdrops without
 *      affecting layout.
 *   3. The core solid-colored dot.
 *
 * The pulse runs on a 30-frame loop driven directly from `useCurrentFrame`,
 * so any caller that mounts this component participates in the same global
 * cadence.
 */
export const PulsingDot: React.FC<PulsingDotProps> = ({
  variant = 'purple',
  size = 10,
  coreSize = 6,
  outlineWidth = 1,
  animated = true,
  style,
}) => {
  const frame = useCurrentFrame();

  const pulsePeriod = 30;
  const pulseT = (frame % pulsePeriod) / pulsePeriod;
  const ringScale = 0.85 + pulseT * 0.6;
  const ringOpacity = animated ? (1 - pulseT) * 0.55 : 0;

  const color = VARIANT_COLOR[variant];

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {animated && (
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: ringOpacity,
            transform: `scale(${ringScale})`,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: coreSize,
          height: coreSize,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 0 ${outlineWidth}px #ffffff`,
        }}
      />
    </div>
  );
};
