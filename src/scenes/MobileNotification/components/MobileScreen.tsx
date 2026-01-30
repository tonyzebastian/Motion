import React from 'react';
import { COLORS, LAYOUT, CONTENT } from '../constants';

// ============================================
// MobileScreen Component
// ============================================
// Displays the time and date - always visible (no fade-in)

export const MobileScreen: React.FC = () => {
  return (
    <>
      {/* Time display */}
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.timeTop,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Roboto', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: LAYOUT.timeFontSize,
          color: COLORS.timeText,
          letterSpacing: -0.1,
        }}
      >
        {CONTENT.time}
      </div>

      {/* Date display */}
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.dateTop,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Roboto', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: LAYOUT.dateFontSize,
          color: COLORS.timeText,
          letterSpacing: LAYOUT.dateLetterSpacing,
        }}
      >
        {CONTENT.date}
      </div>
    </>
  );
};

export default MobileScreen;
