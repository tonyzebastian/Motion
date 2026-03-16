import React from 'react';
import { COLORS, LAYOUT } from '../constants';

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: LAYOUT.cardTop,
        transform: 'translateX(-50%)',
        width: LAYOUT.cardWidth,
        backgroundColor: COLORS.cardBg,
        borderRadius: LAYOUT.cardBorderRadius,
        border: '0.6px solid white',
        boxShadow: '0px 2.4px 48px -1.8px rgba(0, 0, 0, 0.05)',
        padding: LAYOUT.cardPadding,
      }}
    >
      <div
        style={{
          width: LAYOUT.contentWidth,
          height: LAYOUT.contentHeight,
          backgroundColor: COLORS.contentBg,
          borderRadius: LAYOUT.contentBorderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};
