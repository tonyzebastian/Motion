import React from 'react';
import { FileText } from 'lucide-react';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ArtifactCardProps = {
  /** Title shown inside the card. */
  title: string;
  /**
   * 0..1 progress for the "selected" (open in side panel) state. At 0 the
   * card reads as a quiet inline reference -- transparent background and
   * a neutral grey border. At 1 it picks up the brand-purple tint, border,
   * icon, and text color to signal that its artifact is currently open in
   * the right-hand viewer.
   */
  selectionProgress?: number;
  style?: React.CSSProperties;
};

// Resting (unselected) palette.
const REST_BG: [number, number, number, number] = [0, 0, 0, 0];
const REST_BORDER: [number, number, number, number] = [0, 0, 0, 0.12];
const REST_ICON: [number, number, number] = [115, 115, 115]; // COLORS.iconStroke
const REST_TEXT: [number, number, number] = [0, 0, 0]; // COLORS.text

// Selected (artifact open) palette. Brand purple is #A43DF5 = (164, 61, 245).
// The background is a very light wash, the border a more confident purple,
// and the icon + text adopt the full brand purple.
const SEL_BG: [number, number, number, number] = [164, 61, 245, 0.08];
const SEL_BORDER: [number, number, number, number] = [164, 61, 245, 0.45];
const SEL_ICON: [number, number, number] = [164, 61, 245];
const SEL_TEXT: [number, number, number] = [164, 61, 245];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpRgba = (
  from: [number, number, number, number],
  to: [number, number, number, number],
  t: number,
): string => {
  const r = Math.round(lerp(from[0], to[0], t));
  const g = Math.round(lerp(from[1], to[1], t));
  const b = Math.round(lerp(from[2], to[2], t));
  const a = lerp(from[3], to[3], t);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const lerpRgb = (
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): string => {
  const r = Math.round(lerp(from[0], to[0], t));
  const g = Math.round(lerp(from[1], to[1], t));
  const b = Math.round(lerp(from[2], to[2], t));
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Compact pill-style preview card for an artifact the agent just
 * produced. A thin-bordered rectangle on the body background with a
 * document icon on the left and the artifact title to its right; no
 * trailing chevron and no drop shadow -- the row reads as a quiet
 * inline reference rather than an interactive control. Sits inline in
 * the conversation column below the "Created artifact ..." tool row.
 *
 * Once the artifact is opened in the right-hand viewer, the card swaps
 * to a purple-tinted "selected" state (see `selectionProgress`).
 */
export const ArtifactCard: React.FC<ArtifactCardProps> = ({
  title,
  selectionProgress = 0,
  style,
}) => {
  const t = Math.max(0, Math.min(1, selectionProgress));
  const background = lerpRgba(REST_BG, SEL_BG, t);
  const borderColor = lerpRgba(REST_BORDER, SEL_BORDER, t);
  const iconColor = lerpRgb(REST_ICON, SEL_ICON, t);
  const textColor = lerpRgb(REST_TEXT, SEL_TEXT, t);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        // Bleed past the conversation column's left/right padding so the
        // card reads as wide as the chat bubble at the top of the
        // conversation. Matches LAYOUT.responseColumn padding (16 left,
        // 12 right) -- update both together if that padding changes.
        marginLeft: -16,
        marginRight: -12,
        boxSizing: 'border-box',
        background,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        ...style,
      }}
    >
      <FileText
        size={16}
        strokeWidth={1.6}
        color={iconColor}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: FONT_FAMILY,
          fontWeight: 400,
          fontSize: 14,
          lineHeight: '20px',
          letterSpacing: '-0.2px',
          color: textColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>
    </div>
  );
};
