import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { MOUSE_START, MOUSE_TARGET, TIMING } from '../constants';

type Point = { x: number; y: number };

type MouseCursorProps = {
  start?: Point;
  target?: Point;
  startFrame?: number;
  endFrame?: number;
  clickFrame?: number;
  /** When typing begins; the cursor fades out just before this frame. */
  hideFrame?: number;
  size?: number;
};

/**
 * Animated macOS-style mouse cursor. Eases from `start` to `target`, briefly
 * pulses at `clickFrame` to indicate a click, then fades out at `hideFrame`.
 */
export const MouseCursor: React.FC<MouseCursorProps> = ({
  start = MOUSE_START,
  target = MOUSE_TARGET,
  startFrame = TIMING.mouseEnterStart,
  endFrame = TIMING.mouseEnterEnd,
  clickFrame = TIMING.mouseClickFrame,
  hideFrame = TIMING.typingStart,
  size = 22,
}) => {
  const frame = useCurrentFrame();

  const moveProgress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = start.x + (target.x - start.x) * moveProgress;
  const y = start.y + (target.y - start.y) * moveProgress;

  // Click pulse: scale dips down ~0.85 and bounces back over ~6 frames
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

  const fadeIn = interpolate(frame, [startFrame, startFrame + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [hideFrame - 4, hideFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
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
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
      }}
    >
      {/* macOS-style filled cursor: black fill, white outline */}
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
