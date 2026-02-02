import React from 'react';
import { interpolate } from 'remotion';
import { COLORS, SNAPSHOT_MESSAGE } from '../constants';

// ============================================
// SnapshotMessage Component
// ============================================
// Displays a snapshot summary with highlighted key metric
// Format: "[12,847 power users], 34% of segment"

interface SnapshotMessageProps {
  progress: number; // Animation progress from 0 to 1
}

export const SnapshotMessage: React.FC<SnapshotMessageProps> = ({ progress }) => {
  // Slide up animation
  const translateY = interpolate(progress, [0, 1], [10, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: progress,
        transform: `translateY(${translateY}px)`,
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      {/* Highlighted text (e.g., "12,847 power users") */}
      <div
        style={{
          backgroundColor: COLORS.highlightBg,
          borderRadius: 6,
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 500,
            fontFamily: "'Work Sans', system-ui, sans-serif",
            color: COLORS.text,
            letterSpacing: -0.5,
            lineHeight: '24px',
            whiteSpace: 'nowrap',
          }}
        >
          {SNAPSHOT_MESSAGE.highlight}
        </span>
      </div>

      {/* Regular text */}
      <span
        style={{
          fontSize: 18,
          fontWeight: 500,
          fontFamily: "'Work Sans', system-ui, sans-serif",
          color: COLORS.textMuted,
          letterSpacing: -0.5,
          lineHeight: '24px',
          whiteSpace: 'nowrap',
        }}
      >
        {SNAPSHOT_MESSAGE.text}
      </span>
    </div>
  );
};

export default SnapshotMessage;
