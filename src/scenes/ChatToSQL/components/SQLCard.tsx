import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { COLORS, TIMING, LAYOUT } from '../constants';
import { SQLContent } from './SQLContent';
import { TablePreview } from './TablePreview';

// ============================================
// Icon Components
// ============================================

const ChevronIcon: React.FC<{ rotation: number }> = ({ rotation }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={COLORS.text}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: `rotate(${rotation}deg)`,
      transition: 'transform 0.15s ease-out',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ============================================
// Main SQLCard Component
// ============================================

export const SQLCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Only show after SQL entrance
  if (frame < TIMING.sqlEntranceStart) {
    return null;
  }

  // Entrance animation (slide up from bottom)
  const entranceProgress = spring({
    frame: frame - TIMING.sqlEntranceStart,
    fps,
    config: { damping: 200 },
  });

  const translateY = interpolate(entranceProgress, [0, 1], [400, 0]);
  const opacity = interpolate(entranceProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // SQL disappear animation (smooth linear interpolation to avoid jitter)
  const collapseDuration = TIMING.collapseEnd - TIMING.collapseStart;
  const collapseProgress = frame >= TIMING.collapseStart
    ? interpolate(
        frame - TIMING.collapseStart,
        [0, collapseDuration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  // SQL section fully disappears (height → 0, opacity → 0)
  const sqlSectionHeight = interpolate(collapseProgress, [0, 1], [250, 0]);
  const sqlSectionOpacity = interpolate(collapseProgress, [0, 0.3], [1, 0], { extrapolateRight: 'clamp' });
  const showSqlSection = collapseProgress < 1;
  
  // Chevron rotation: 90deg (pointing down) when open, 0deg (pointing right) when collapsed
  const chevronRotation = interpolate(collapseProgress, [0, 1], [90, 0]);

  // Table visibility (after collapse)
  const showTable = frame >= TIMING.tableRevealStart;
  const tableProgress = showTable
    ? spring({
        frame: frame - TIMING.tableRevealStart,
        fps,
        config: { damping: 200 },
      })
    : 0;

  // Position the card
  const cardLeft = LAYOUT.sqlCardLeft;
  const cardTop = LAYOUT.sqlCardTop; // 300 - below the chat bubble

  return (
    <div
      style={{
        position: 'absolute',
        left: cardLeft,
        top: cardTop,
        width: LAYOUT.sqlCardWidth,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 16,
          border: '2px solid white',
          boxShadow: '0px 1px 1px 0px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side - Chevron + SQL label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ChevronIcon rotation={chevronRotation} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: COLORS.text,
                fontFamily: "'Work Sans', system-ui, sans-serif",
                letterSpacing: -0.5,
              }}
            >
              SQL
            </span>
          </div>

        </div>

        {/* SQL Content Section with gray background (disappears before table) */}
        {showSqlSection && (
          <div
            style={{
              height: sqlSectionHeight,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: COLORS.sqlBg,
                borderRadius: 12,
                border: '0.5px solid rgba(0, 0, 0, 0.1)',
                padding: 16,
                height: 250,
                overflow: 'hidden',
                opacity: sqlSectionOpacity,
              }}
            >
              <SQLContent />
            </div>
          </div>
        )}

        {/* Table Preview Section */}
        {showTable && (
          <div
            style={{
              opacity: tableProgress,
              transform: `translateY(${interpolate(tableProgress, [0, 1], [20, 0])}px)`,
            }}
          >
            <TablePreview />
          </div>
        )}
      </div>
    </div>
  );
};
