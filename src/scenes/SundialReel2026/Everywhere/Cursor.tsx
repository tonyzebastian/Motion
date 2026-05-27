import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

type Point = { x: number; y: number };

type CursorProps = {
  /** Starting position before `enterStart`. */
  start: Point;
  /** Target position the cursor settles into. */
  target: Point;
  /** Frame at which the cursor begins moving in. */
  enterStart: number;
  /** Frame at which the cursor finishes moving (sits at target). */
  enterEnd: number;
  /** Frame at which a click pulse fires (0.85 scale dip). */
  clickFrame: number;
  /** Frame at which the cursor fully disappears (fade-out completes). */
  hideFrame: number;
  /** SVG width in px. Height is auto-derived from the 22:28 aspect ratio. */
  size?: number;
};

/**
 * macOS-style filled arrow cursor for the Everywhere section. Visual
 * language matches MouseCursor in the Playbooks scene so all cursors in
 * the reel look the same. Eases from `start` to `target`, briefly pulses
 * at `clickFrame`, then fades out by `hideFrame`.
 *
 * Coordinates are section-level canvas pixels (the parent `AbsoluteFill`
 * spans the full 1920×1080 frame).
 */
export const Cursor: React.FC<CursorProps> = ({
  start,
  target,
  enterStart,
  enterEnd,
  clickFrame,
  hideFrame,
  size = 22,
}) => {
  const frame = useCurrentFrame();

  const moveProgress = interpolate(frame, [enterStart, enterEnd], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = start.x + (target.x - start.x) * moveProgress;
  const y = start.y + (target.y - start.y) * moveProgress;

  const clickPulse = interpolate(
    frame,
    [clickFrame - 2, clickFrame, clickFrame + 4],
    [1, 0.85, 1],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const fadeIn = interpolate(frame, [enterStart, enterStart + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [hideFrame - 4, hideFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px) scale(${clickPulse})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        opacity,
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))',
        zIndex: 100,
      }}
    >
      <svg
        width={size}
        height={size * (28 / 22)}
        viewBox="0 0 22 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 2 L2 22 L7.5 17.5 L11 25.5 L14.5 24 L11 16 L18.5 16 L2 2 Z"
          fill="#1a1a1a"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
