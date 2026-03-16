import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { COLORS, LAYOUT, TIMING, ANIMATION } from '../constants';

function computeSundialPct(frame: number): number {
  const { frames, values } = ANIMATION.sundialKeyframes;

  if (frame <= frames[0]) return values[0];
  if (frame >= frames[frames.length - 1]) return values[values.length - 1];

  if (frame <= frames[1]) {
    return interpolate(frame, [frames[0], frames[1]], [values[0], values[1]], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  if (frame <= frames[2]) {
    return interpolate(frame, [frames[1], frames[2]], [values[1], values[2]], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  if (frame <= frames[3]) {
    return interpolate(frame, [frames[2], frames[3]], [values[2], values[3]], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return interpolate(frame, [frames[3], frames[4]], [values[3], values[4]], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function computeDiyPct(frame: number): number {
  const { frames, values } = ANIMATION.diyKeyframes;

  if (frame <= frames[0]) return values[0];
  if (frame >= frames[frames.length - 1]) return values[values.length - 1];

  // Phase 1: matches Sundial's initial sprint
  if (frame <= frames[1]) {
    return interpolate(frame, [frames[0], frames[1]], [values[0], values[1]], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // Phase 2: single smooth deceleration — no phase breaks, no jitter
  return interpolate(frame, [frames[1], frames[2]], [values[1], values[2]], {
    easing: Easing.out(Easing.sin),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export const ProgressBars: React.FC = () => {
  const frame = useCurrentFrame();

  const sundialPct = computeSundialPct(frame);
  const diyPct = computeDiyPct(frame);

  const sundialWidth = (sundialPct / 100) * LAYOUT.trackWidth;
  const diyWidth = (diyPct / 100) * LAYOUT.trackWidth;

  const annotationOpacity = interpolate(
    frame,
    [TIMING.annotationFadeInStart, TIMING.annotationFadeInEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const fadeOut = interpolate(
    frame,
    [TIMING.exitBarsStart, TIMING.exitBarsEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const barLeft = LAYOUT.chartLeft + LAYOUT.trackStartX;

  return (
    <>
      {/* Sundial bar (purple) */}
      <div
        style={{
          position: 'absolute',
          left: barLeft,
          top: LAYOUT.chartTop + LAYOUT.sundialBarY,
          width: Math.max(0, sundialWidth),
          height: LAYOUT.barHeight,
          backgroundColor: COLORS.sundial,
          borderTopRightRadius: LAYOUT.barBorderRadius,
          borderBottomRightRadius: LAYOUT.barBorderRadius,
          opacity: fadeOut,
          overflow: 'hidden',
        }}
      >
        {annotationOpacity > 0 && (
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: LAYOUT.annotationFontSize,
              fontWeight: 500,
              color: COLORS.annotationText,
              whiteSpace: 'nowrap',
              opacity: annotationOpacity,
            }}
          >
            Production-ready from day one
          </span>
        )}
      </div>

      {/* DIY bar (teal) */}
      <div
        style={{
          position: 'absolute',
          left: barLeft,
          top: LAYOUT.chartTop + LAYOUT.diyBarY,
          width: Math.max(0, diyWidth),
          height: LAYOUT.barHeight,
          backgroundColor: COLORS.diy,
          borderTopRightRadius: LAYOUT.barBorderRadius,
          borderBottomRightRadius: LAYOUT.barBorderRadius,
          opacity: fadeOut,
        }}
      />
    </>
  );
};

export { computeSundialPct };
