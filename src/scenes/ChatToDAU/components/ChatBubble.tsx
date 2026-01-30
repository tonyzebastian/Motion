import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { COLORS, TIMING, CHAT_PROMPT, LAYOUT } from '../constants';

// ============================================
// ChatBubble Component
// ============================================
// Simplified bubble that starts visible and moves up
// No typing animation - starts with full text visible

export const ChatBubble: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Move up animation (center → top)
  const moveProgress = frame >= TIMING.bubbleMoveStart
    ? spring({
        frame: frame - TIMING.bubbleMoveStart,
        fps,
        config: { damping: 200 },
      })
    : 0;

  // ============================================
  // Position Calculations
  // ============================================

  // Center position
  const centerX = (LAYOUT.sceneWidth - LAYOUT.chatBubbleWidth) / 2;
  
  // X position: starts centered, moves to left
  const posX = interpolate(moveProgress, [0, 1], [centerX, LAYOUT.chatBubbleLeft]);
  
  // Y position: center → top
  const posY = interpolate(
    moveProgress,
    [0, 1],
    [LAYOUT.chatBubbleCenterY, LAYOUT.chatBubbleTopY]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        width: LAYOUT.chatBubbleWidth,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 20,
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0px 27px 136px 0px rgba(0, 0, 0, 0.05), 0px 6px 30px 0px rgba(0, 0, 0, 0.03), 0px 2px 9px 0px rgba(0, 0, 0, 0.02)',
          padding: '16px 17px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {/* Text */}
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: COLORS.text,
            fontFamily: "'Work Sans', system-ui, sans-serif",
            letterSpacing: -0.5,
            lineHeight: '24px',
            whiteSpace: 'nowrap',
          }}
        >
          {CHAT_PROMPT}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;
