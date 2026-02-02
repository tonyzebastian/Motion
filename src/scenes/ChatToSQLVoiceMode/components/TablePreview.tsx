import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, TIMING, TABLE_DATA } from '../constants';

// ============================================
// Main TablePreview Component
// ============================================

export const TablePreview: React.FC = () => {
  const frame = useCurrentFrame();

  // Animate rows appearing one by one
  const rowsProgress = Math.max(0, frame - TIMING.tableRevealStart);
  const visibleRows = Math.min(
    Math.floor(rowsProgress / 4) + 1, // One row every 4 frames
    TABLE_DATA.rows.length
  );

  const displayRows = TABLE_DATA.rows.slice(0, visibleRows);

  return (
    <div
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Grid Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            gap: 4,
          }}
        >
          {/* Header cells - dynamically rendered */}
          {TABLE_DATA.headers.map((header, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                backgroundColor: COLORS.dataHeaderBg,
                borderRadius: 4,
                padding: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inconsolata', monospace",
                  fontWeight: 600,
                  fontSize: 15,
                  color: COLORS.text,
                  lineHeight: '20px',
                }}
              >
                {header}
              </span>
            </div>
          ))}
        </div>

        {/* Data Rows - dynamically rendered */}
        {displayRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'flex',
              gap: 4,
              opacity: interpolate(
                rowsProgress - rowIdx * 4,
                [0, 4],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ),
            }}
          >
            {/* Render each cell dynamically based on headers */}
            {TABLE_DATA.headers.map((header, colIdx) => {
              const value = row[header as keyof typeof row];
              const isFirstColumn = colIdx === 0;
              
              return (
                <div
                  key={colIdx}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.dataRowBg,
                    borderRadius: 4,
                    padding: 8,
                    display: 'flex',
                    justifyContent: isFirstColumn ? 'flex-start' : 'flex-end',
                  }}
                >
                  <span
                    style={{
                      fontFamily: isFirstColumn 
                        ? "'Inconsolata', monospace" 
                        : "'Work Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: isFirstColumn ? 15 : 14,
                      color: COLORS.text,
                      lineHeight: '20px',
                      letterSpacing: isFirstColumn ? 0 : -0.5,
                    }}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
