import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { COLORS, TIMING, LAYOUT } from '../constants';
import { WaterfallChart } from './WaterfallChart';

// ============================================
// ChartCard Component
// ============================================
// Card container that holds the waterfall chart
// Slides up from bottom with spring animation

export const ChartCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Only show after chart entrance starts
  if (frame < TIMING.chartEntranceStart) {
    return null;
  }

  // Entrance animation (slide up from bottom)
  const entranceProgress = spring({
    frame: frame - TIMING.chartEntranceStart,
    fps,
    config: { damping: 200 },
  });

  const translateY = interpolate(entranceProgress, [0, 1], [400, 0]);
  const opacity = interpolate(
    entranceProgress,
    [0, 0.3],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.chartCardLeft,
        top: LAYOUT.chartCardTop,
        width: LAYOUT.chartCardWidth,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 20,
          border: '2px solid white',
          padding: 16,
          boxShadow: '0px 1px 1px 0px rgba(0, 0, 0, 0.05)',
        }}
      >
        <WaterfallChart />
      </div>
    </div>
  );
};

export default ChartCard;
