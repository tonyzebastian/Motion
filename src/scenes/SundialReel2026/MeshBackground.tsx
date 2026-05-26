import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { MeshGradient } from '@paper-design/shaders-react';

// Per-section drift speed. Values are linearly interpolated between keyframes
// and then INTEGRATED over time to produce the shader's `frame` input.
// Integrating (rather than changing the `speed` prop directly) keeps the
// shader phase continuous — no visible jumps when the rate changes.
//
// Reference values:
//   0.05 ≈ barely moving (great for calm holds)
//   0.20 ≈ the previous "subtle drift" baseline
//   0.45 ≈ noticeable swirl, good for high-energy beats
//   0.80+ = aggressive
//
// Edit these freely to retime the energy of the gradient.
const SPEED_KEYFRAMES: ReadonlyArray<{ frame: number; speed: number }> = [
  { frame: 0, speed: 0.08 },    // calm intro under line 1 stagger
  { frame: 40, speed: 0.12 },   // tiny pickup approaching Phase B
  { frame: 50, speed: 0.5 },    // surge as "Judgment does." lands
  { frame: 90, speed: 0.5 },    // sustain through start of headline hold
  { frame: 140, speed: 0.18 },  // ease down as headline fades / logo appears
  { frame: 220, speed: 0.08 },  // calm brand moment (logo solo)
  { frame: 380, speed: 0.08 },  // hold slow through tagline + customer logos
  { frame: 600, speed: 0.25 },  // gentle pickup in the long tail
];

// Pre-compute cumulative integral (in "frame × speed" units) at each keyframe
// boundary using the trapezoid rule. O(K) once, then O(K) per frame to look up.
const CUMULATIVE_AT_KEYFRAME: number[] = (() => {
  const result: number[] = [0];
  for (let i = 1; i < SPEED_KEYFRAMES.length; i++) {
    const a = SPEED_KEYFRAMES[i - 1];
    const b = SPEED_KEYFRAMES[i];
    const avg = (a.speed + b.speed) / 2;
    const dFrames = b.frame - a.frame;
    result.push(result[i - 1] + avg * dFrames);
  }
  return result;
})();

const warpedTimeMs = (currentFrame: number, fps: number): number => {
  const dtMs = 1000 / fps;
  const first = SPEED_KEYFRAMES[0];
  const last = SPEED_KEYFRAMES[SPEED_KEYFRAMES.length - 1];

  if (currentFrame <= first.frame) {
    return first.speed * (currentFrame - first.frame) * dtMs;
  }
  if (currentFrame >= last.frame) {
    const tail = last.speed * (currentFrame - last.frame);
    return (CUMULATIVE_AT_KEYFRAME[CUMULATIVE_AT_KEYFRAME.length - 1] + tail) * dtMs;
  }

  for (let i = 0; i < SPEED_KEYFRAMES.length - 1; i++) {
    const a = SPEED_KEYFRAMES[i];
    const b = SPEED_KEYFRAMES[i + 1];
    if (currentFrame >= a.frame && currentFrame <= b.frame) {
      const dFrames = currentFrame - a.frame;
      const segLen = b.frame - a.frame;
      const tNorm = segLen === 0 ? 0 : dFrames / segLen;
      // Analytic integral of a linearly-interpolated speed from a → currentFrame.
      const segIntegral =
        dFrames * (a.speed + ((b.speed - a.speed) * tNorm) / 2);
      return (CUMULATIVE_AT_KEYFRAME[i] + segIntegral) * dtMs;
    }
  }
  return 0;
};

export const MeshBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // `timeMs` already encodes the variable rate, so the shader's own `speed`
  // is set to 1 — the curve above is the single source of truth.
  const timeMs = warpedTimeMs(frame, fps);

  return (
    <AbsoluteFill>
      <MeshGradient
        style={{ width: '100%', height: '100%' }}
        colors={[
          '#FFF4EC',
          '#FBE9E4',
          '#FFC8AE',
          '#E9C4DD',
          '#C4A8E2',
          '#B79AD9',
          '#A8B5DE',
        ]}
        distortion={0.95}
        swirl={0.05}
        speed={1}
        frame={timeMs}
        grainMixer={0.35}
        grainOverlay={0.3}
      />
      {/* Soft radial wash so the center reads near-white and the saturated
          mesh colors only show through toward the edges. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(255,250,245,0.85) 0%, rgba(255,250,245,0.55) 35%, rgba(255,250,245,0) 75%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
