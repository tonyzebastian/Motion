import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { COLORS, LAYOUT, TIMING } from '../constants';

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: LAYOUT.legendSwatchGap,
    }}
  >
    <div
      style={{
        width: LAYOUT.legendSwatchSize,
        height: LAYOUT.legendSwatchSize,
        backgroundColor: color,
        borderRadius: LAYOUT.legendSwatchRadius,
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontSize: LAYOUT.legendFontSize,
        fontWeight: 500,
        color: COLORS.text,
        letterSpacing: LAYOUT.legendLetterSpacing,
        lineHeight: '16.8px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  </div>
);

export const Legend: React.FC = () => {
  const frame = useCurrentFrame();

  const entranceOpacity = interpolate(
    frame,
    [TIMING.entranceLegendStart, TIMING.entranceLegendEnd],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const exitOpacity = interpolate(
    frame,
    [TIMING.exitLegendStart, TIMING.exitLegendEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.legendTop,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: LAYOUT.legendItemGap,
        opacity: entranceOpacity * exitOpacity,
      }}
    >
      <LegendItem color={COLORS.diy} label="Your Team" />
      <LegendItem color={COLORS.sundial} label="With Sundial's Applied AI team" />
    </div>
  );
};
