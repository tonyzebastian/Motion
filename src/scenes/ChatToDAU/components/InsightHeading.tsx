import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS, TIMING, LAYOUT, INSIGHT_HEADING } from '../constants';

// ============================================
// InsightHeading Component
// ============================================
// Displays the insight summary with highlighted text
// Format: "[Android App] contributed the most to decline in DAU this month"

export const InsightHeading: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Don't show before heading should appear
  if (frame < TIMING.headingStart) {
    return null;
  }

  // Fade in animation
  const fadeProgress = spring({
    frame: frame - TIMING.headingStart,
    fps,
    config: { damping: 200 },
  });

  // Slide up animation
  const translateY = interpolate(fadeProgress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.headingLeft,
        top: LAYOUT.headingTop,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity: fadeProgress,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Highlighted text (e.g., "Android App") */}
      <div
        style={{
          backgroundColor: COLORS.highlightBg,
          borderRadius: 6,
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 500,
            fontFamily: "'Work Sans', system-ui, sans-serif",
            color: COLORS.text,
            letterSpacing: -0.5,
            lineHeight: '28px',
            whiteSpace: 'nowrap',
          }}
        >
          {INSIGHT_HEADING.highlight}
        </span>
      </div>

      {/* Regular text */}
      <span
        style={{
          fontSize: 20,
          fontWeight: 500,
          fontFamily: "'Work Sans', system-ui, sans-serif",
          color: COLORS.textMuted,
          letterSpacing: -0.5,
          lineHeight: '28px',
          whiteSpace: 'nowrap',
        }}
      >
        {INSIGHT_HEADING.text}
      </span>
    </div>
  );
};

export default InsightHeading;
