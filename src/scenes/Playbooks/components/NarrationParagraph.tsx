import React from 'react';
import { COLORS } from '../constants';
import { BlinkingCursor } from './BlinkingCursor';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type BoldRange = { from: number; to: number };

type NarrationParagraphProps = {
  /** Full source text. The renderer slices `[0, revealedChars)`. */
  text: string;
  /** Half-open character ranges that should render bold. */
  bold?: BoldRange[];
  /** Number of characters of `text` to reveal. */
  revealedChars: number;
  /** Whether to draw a blinking caret at the end of the reveal. */
  showCursor?: boolean;
  style?: React.CSSProperties;
};

/**
 * Splits a partially-revealed string into alternating plain / bold spans
 * based on the source's bold ranges. Bold characters are bold from the
 * frame they appear (no thicken-after delay). Ranges are clipped to the
 * visible prefix so a half-revealed bold word still renders bold for the
 * characters that are showing.
 */
const splitByBold = (
  text: string,
  bold: BoldRange[] | undefined,
  revealedChars: number,
): { text: string; bold: boolean }[] => {
  const segments: { text: string; bold: boolean }[] = [];
  const reveal = Math.max(0, Math.min(revealedChars, text.length));
  if (reveal === 0) return segments;

  if (!bold || bold.length === 0) {
    segments.push({ text: text.slice(0, reveal), bold: false });
    return segments;
  }

  const sorted = [...bold].sort((a, b) => a.from - b.from);
  let cursor = 0;
  for (const range of sorted) {
    const from = Math.min(range.from, reveal);
    const to = Math.min(range.to, reveal);
    if (cursor < from) {
      segments.push({ text: text.slice(cursor, from), bold: false });
    }
    if (from < to) {
      segments.push({ text: text.slice(from, to), bold: true });
    }
    cursor = Math.max(cursor, to);
    if (cursor >= reveal) break;
  }
  if (cursor < reveal) {
    segments.push({ text: text.slice(cursor, reveal), bold: false });
  }
  return segments;
};

/**
 * Streaming narration paragraph for Phase 5. Renders the visible prefix of
 * `text` with bold sub-ranges, and an optional blinking caret while the
 * paragraph is still being typed.
 */
export const NarrationParagraph: React.FC<NarrationParagraphProps> = ({
  text,
  bold,
  revealedChars,
  showCursor = false,
  style,
}) => {
  const segments = splitByBold(text, bold, revealedChars);
  return (
    <p
      style={{
        margin: 0,
        fontFamily: FONT_FAMILY,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: '28px',
        letterSpacing: '-0.2px',
        color: COLORS.text,
        whiteSpace: 'pre-wrap',
        ...style,
      }}
    >
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} style={{ fontWeight: 600 }}>
            {seg.text}
          </strong>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
      {showCursor && (
        <BlinkingCursor width={1} height={18} color={COLORS.text} />
      )}
    </p>
  );
};
