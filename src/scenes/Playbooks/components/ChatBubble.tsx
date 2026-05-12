import React from 'react';
import { COLORS } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ChatBubbleProps = {
  text: string;
  style?: React.CSSProperties;
};

/**
 * Question chat bubble (matches Figma node 569:1382).
 * Renders a translucent white gradient card with a 2px white border.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, style }) => {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.35) 100%)',
        border: '2px solid #ffffff',
        borderRadius: 12,
        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.12)',
        padding: '12px 12px 12px 16px',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 600,
          fontSize: 16,
          lineHeight: '24px',
          letterSpacing: '-1px',
          color: COLORS.black,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {text}
      </span>
    </div>
  );
};
