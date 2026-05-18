import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  computeCursorPosition,
  type CursorSegment,
  type Point,
} from '../timing';

export type { CursorSegment };

/**
 * A visibility window: the cursor is rendered between `start` and
 * `end`, with optional fade-in / fade-out ramps at each edge. Outside
 * every window the cursor is hidden entirely.
 */
export type CursorVisibilityWindow = {
  start: number;
  end: number;
  fadeIn?: number;
  fadeOut?: number;
};

type AnimatedCursorProps = {
  /** Resting position before the first segment fires. */
  initialPosition: Point;
  /** Ordered list of move segments. */
  segments: CursorSegment[];
  /** Frames where a click pulse should fire. */
  clickFrames: number[];
  /**
   * Visibility windows. Cursor opacity at any frame is the MAX over
   * all windows of that window's contribution; outside every window
   * the cursor is hidden. Use this to script multiple appear/hide
   * beats (e.g. enter -> click -> hide -> reappear for next click).
   */
  visibilityWindows: CursorVisibilityWindow[];
  size?: number;
};

/**
 * Multi-waypoint cursor. The existing Playbooks `MouseCursor` only
 * supports a single move + click; this scene scripts three click
 * targets (row 0 -> Aha Moment row -> close X) so we need a cursor
 * that walks multiple eased segments and pulses on each click.
 *
 * Renders the same macOS-style filled cursor SVG as MouseCursor so
 * both scenes feel consistent.
 */
export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  initialPosition,
  segments,
  clickFrames,
  visibilityWindows,
  size = 16,
}) => {
  const frame = useCurrentFrame();

  const { x, y } = computeCursorPosition(frame, initialPosition, segments);

  // Click pulse: a soft 0.85 scale dip centered on each click frame.
  // Pulses overlap rarely (clicks are far apart) so summing the dips
  // would be overkill; pick the minimum (most-dipped) value across all
  // active pulses instead.
  let clickPulse = 1;
  for (const clickFrame of clickFrames) {
    const pulse = interpolate(
      frame,
      [clickFrame - 2, clickFrame, clickFrame + 4],
      [1, 0.85, 1],
      {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
    if (pulse < clickPulse) clickPulse = pulse;
  }

  // Visibility: take the MAX over all windows so overlapping windows
  // never dip the opacity. Outside every window the cursor is hidden.
  let opacity = 0;
  for (const win of visibilityWindows) {
    const fadeIn = win.fadeIn ?? 4;
    const fadeOut = win.fadeOut ?? 6;
    if (frame < win.start || frame > win.end) continue;
    const inProgress = interpolate(
      frame,
      [win.start, win.start + fadeIn],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
    const outProgress = interpolate(
      frame,
      [win.end - fadeOut, win.end],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
    const winOpacity = Math.min(inProgress, outProgress);
    if (winOpacity > opacity) opacity = winOpacity;
  }

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
      {/* macOS-style filled arrow cursor. The 0.85 click pulse on the
          wrapper is the entire click affordance now -- the cursor
          shape doesn't change. */}
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
