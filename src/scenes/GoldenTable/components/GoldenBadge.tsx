import React from 'react';
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { TIMING } from '../constants';

const GoldenStarIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="#C88E00"
    />
  </svg>
);

export const GoldenTag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < TIMING.tagAppearFrame) return null;

  const scaleRaw = spring({
    frame: frame - TIMING.tagAppearFrame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 18,
        background:
          'linear-gradient(94.5deg, rgba(232, 172, 19, 0.14) 0%, rgba(198, 142, 0, 0.14) 100%)',
        transform: `scale(${scaleRaw})`,
        transformOrigin: 'center center',
      }}
    >
      <GoldenStarIcon size={16} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: -0.5,
          textTransform: 'uppercase',
          opacity: 0.8,
          background:
            'linear-gradient(85.7deg, rgb(170, 127, 15) 0.3%, rgb(126, 91, 1) 99.7%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          whiteSpace: 'nowrap',
          lineHeight: '16px',
        }}
      >
        GOLDEN TABLE
      </span>
    </div>
  );
};
