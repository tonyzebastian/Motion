import React from 'react';
import { MoreHorizontal, Share2 } from 'lucide-react';
import { COLORS } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ConversationHeaderProps = {
  /** The currently displayed title. */
  title?: string;
  /**
   * If provided alongside `transition`, cross-fades from `title` to `nextTitle`
   * as transition goes 0 -> 1. Old slides up + fades; new rises in from below.
   */
  nextTitle?: string;
  /** 0..1 progress of the title rename animation. */
  transition?: number;
  style?: React.CSSProperties;
};

const buttonBaseStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid rgba(0, 0, 0, 0.02)',
  boxShadow: '0 0.5px 0.5px rgba(0, 0, 0, 0.07)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
};

const TITLE_HEIGHT = 28; // matches Work Sans Light 20/28 line-height
const RENAME_TRAVEL = 12; // px of vertical motion for old-out / new-in

// 16px left offset aligns the title's first glyph with the chat bubble's
// inner text (the bubble uses padding-left: 16). The action buttons live in
// the same parent flex row and stay flush to the right edge via
// `justify-content: space-between` -- they don't move when the title shifts.
const TITLE_TEXT_LEFT = 16;

const titleSpanStyle: React.CSSProperties = {
  position: 'absolute',
  left: TITLE_TEXT_LEFT,
  top: 0,
  fontFamily: FONT_FAMILY,
  fontWeight: 300,
  fontSize: 20,
  lineHeight: `${TITLE_HEIGHT}px`,
  letterSpacing: '-1px',
  color: COLORS.black,
  whiteSpace: 'nowrap',
};

/**
 * Top header for the conversation view (matches Figma node 569:1433).
 * Left: title (supports cross-fade rename); Right: Share + More buttons.
 */
export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title = 'New conversation',
  nextTitle,
  transition = 0,
  style,
}) => {
  const t = Math.max(0, Math.min(1, transition));
  const showRename = nextTitle !== undefined && t > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: TITLE_HEIGHT,
          // grow to fit whichever string is widest; nowrap keeps the spans
          // from breaking, the parent flex row supplies the width
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            ...titleSpanStyle,
            opacity: 1 - t,
            transform: showRename
              ? `translateY(${-RENAME_TRAVEL * t}px)`
              : 'none',
          }}
        >
          {title}
        </span>
        {nextTitle !== undefined && (
          <span
            style={{
              ...titleSpanStyle,
              opacity: t,
              transform: `translateY(${RENAME_TRAVEL * (1 - t)}px)`,
            }}
          >
            {nextTitle}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Share"
          style={{
            ...buttonBaseStyle,
            backgroundColor: 'rgba(164, 61, 245, 0.05)',
          }}
        >
          <Share2 size={16} strokeWidth={1.8} color={COLORS.purple} />
        </button>
        <button
          type="button"
          aria-label="More"
          style={{
            ...buttonBaseStyle,
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.8} color={COLORS.iconStroke} />
        </button>
      </div>
    </div>
  );
};
