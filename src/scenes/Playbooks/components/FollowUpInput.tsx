import React from 'react';
import { ArrowRight } from 'lucide-react';
import { COLORS } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// Inactive (empty-input) submit button styling. Matches the primary input
// card's resting state in AgendaScreen: a light-purple chip with a
// brand-purple arrow. The streaming/stop state continues to use the
// solid-purple active styling below.
const INACTIVE_BG = 'rgb(251, 240, 254)';
const INACTIVE_ICON = COLORS.purple;

type FollowUpInputProps = {
  placeholder?: string;
  disclaimer?: string;
  /** When true, the send button shows a stop glyph (used while the agent
   *  is generating a response). */
  isStreaming?: boolean;
  style?: React.CSSProperties;
};

const StopGlyph: React.FC = () => (
  <div
    style={{
      width: 10,
      height: 10,
      borderRadius: 2,
      backgroundColor: '#ffffff',
    }}
  />
);

/**
 * Bottom-of-screen input for asking follow-up questions. Mirrors the
 * agenda card's look (white rounded card + purple submit button) but in
 * its always-on / solid-purple state and with a quieter disclaimer line
 * below it.
 */
export const FollowUpInput: React.FC<FollowUpInputProps> = ({
  placeholder = 'Follow up...',
  disclaimer = 'Sundial AI can make mistakes. Please double-check responses.',
  isStreaming = false,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 12,
          boxShadow: [
            '0 -1px 8px rgba(0, 0, 0, 0.06)',
            '0 8px 24px -12px rgba(0, 0, 0, 0.12)',
          ].join(', '),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: FONT_FAMILY,
            fontWeight: 400,
            fontSize: 16,
            lineHeight: '24px',
            letterSpacing: '-0.3px',
            color: COLORS.text,
            opacity: 0.45,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingLeft: 4,
          }}
        >
          {placeholder}
        </span>
        <button
          type="button"
          aria-label={isStreaming ? 'Stop' : 'Send follow-up'}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: isStreaming ? COLORS.purple : INACTIVE_BG,
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {isStreaming ? (
            <StopGlyph />
          ) : (
            <ArrowRight size={16} strokeWidth={2} color={INACTIVE_ICON} />
          )}
        </button>
      </div>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 400,
          fontSize: 12,
          lineHeight: '16px',
          letterSpacing: '-0.1px',
          color: COLORS.iconStroke,
          opacity: 0.55,
        }}
      >
        {disclaimer}
      </span>
    </div>
  );
};
