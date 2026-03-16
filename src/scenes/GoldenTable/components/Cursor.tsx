import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { TIMING } from '../constants';

export const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visible =
    frame >= TIMING.cursorEnterStart && frame <= TIMING.cursorFadeEnd;
  if (!visible) return null;

  // Quadratic bezier control points for an organic sweeping arc
  const startX = 650;
  const startY = 420;
  const controlX = 80;
  const controlY = 50;
  const targetX = 280;
  const targetY = 260;

  const t = spring({
    frame: frame - TIMING.cursorEnterStart,
    fps,
    config: { damping: 16, stiffness: 50, mass: 0.9 },
  });

  const tClamped = Math.min(t, 1);
  const omt = 1 - tClamped;
  const x = omt * omt * startX + 2 * omt * tClamped * controlX + tClamped * tClamped * targetX;
  const y = omt * omt * startY + 2 * omt * tClamped * controlY + tClamped * tClamped * targetY;

  // Click pulse
  const isClicking =
    frame >= TIMING.cursorClickFrame && frame < TIMING.cursorClickFrame + 4;
  const clickScale = isClicking ? 0.85 : 1;

  // Fade out after click
  const fadeOpacity = interpolate(
    frame,
    [TIMING.cursorClickFrame + 4, TIMING.cursorFadeEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Fade in as cursor enters
  const enterOpacity = interpolate(
    frame,
    [TIMING.cursorEnterStart, TIMING.cursorEnterStart + 6],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${clickScale})`,
        transformOrigin: 'top left',
        opacity: enterOpacity * fadeOpacity,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 1L1.5 17.5L5.5 13.5L9.5 21L12.5 19.5L8.5 12L14 12L1.5 1Z"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
