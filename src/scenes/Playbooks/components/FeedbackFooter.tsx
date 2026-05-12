import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { COLORS } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

/**
 * Compact "Was this response useful?" footer that appears below the
 * streamed Phase 6 dashboard description once the agent finishes writing.
 * A thin divider sits above the prompt, with thumb-up / thumb-down
 * icons aligned to the right of the question.
 */
export const FeedbackFooter: React.FC = () => {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          marginBottom: 8,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: COLORS.iconStroke,
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          letterSpacing: '-0.1px',
        }}
      >
        <span>Was this response useful?</span>
        <ThumbsUp size={14} strokeWidth={1.6} color={COLORS.iconStroke} />
        <ThumbsDown size={14} strokeWidth={1.6} color={COLORS.iconStroke} />
      </div>
    </div>
  );
};
