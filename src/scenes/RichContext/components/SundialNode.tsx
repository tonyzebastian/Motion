import React from 'react';
import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { COLORS, LAYOUT, TIMING } from '../constants';

export const SundialNode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, mass: 1, stiffness: 120 },
  });

  // Pulse at scene transition: shrink then overshoot to ~1.05, spring back
  const pulseFrame = frame - TIMING.sundialPulseStart;
  const pulse = pulseFrame > 0
    ? spring({
        frame: pulseFrame,
        fps,
        config: { damping: 10, mass: 0.8, stiffness: 200 },
      })
    : 0;
  const pulseScale = pulse > 0
    ? interpolate(pulse, [0, 0.5, 1], [1, 0.92, 1])
    : 1;
  // Overshoot via the spring's natural bounce gives the 1.05 peak

  const glowCycleDuration = 3 * fps;
  const glowPhase = (frame % glowCycleDuration) / glowCycleDuration;
  const glowScale = interpolate(
    Math.sin(glowPhase * Math.PI * 2),
    [-1, 1],
    [1.0, 1.15],
  );

  const fadeOut = interpolate(
    frame,
    [TIMING.finalFadeStart, TIMING.finalFadeEnd],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    },
  );

  const scale = entrance * pulseScale;
  const half = LAYOUT.sundialCardSize / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.center - half,
        top: LAYOUT.center - half,
        width: LAYOUT.sundialCardSize,
        height: LAYOUT.sundialCardSize,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        opacity: fadeOut,
      }}
    >
      {/* Blur glow layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.glowBg,
          borderRadius: LAYOUT.sundialBorderRadius,
          filter: `blur(${LAYOUT.glowBlur}px)`,
          transform: `scale(${glowScale})`,
          transformOrigin: 'center center',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: LAYOUT.sundialCardSize,
          height: LAYOUT.sundialCardSize,
          backgroundColor: COLORS.cardBg,
          border: `2px solid ${COLORS.cardBorder}`,
          borderRadius: LAYOUT.sundialBorderRadius,
          boxShadow: LAYOUT.cardShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile('sundial.svg')}
          style={{
            width: LAYOUT.sundialCardSize - LAYOUT.sundialLogoInset * 2,
            height: LAYOUT.sundialCardSize - LAYOUT.sundialLogoInset * 2,
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
