import React from 'react';
import type { Citation } from '../../Playbooks/constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type CitationPopoverProps = {
  citation: Citation;
  /** 0..1 fade controlled by the parent scene. */
  opacity?: number;
  /**
   * 0..1 lift control. Mapped to a small downward slide so the popover
   * drops into place below the marker as it fades in (mirrors the
   * trust-signal ConfidencePopover, but anchored BELOW the trigger).
   */
  liftProgress?: number;
  /**
   * Horizontal anchoring relative to the marker. `left` (default) opens
   * to the right of the marker; `right` aligns the card's right edge to
   * the marker and opens leftward -- used for markers near the panel's
   * right edge so the card never overflows.
   */
  align?: 'left' | 'right';
  style?: React.CSSProperties;
};

/**
 * Book-style footnote popover. Anchored BELOW its sibling citation
 * marker (the marker sits high in the artifact panel, so the card
 * drops downward into the visible area). Shows the source table name +
 * a TABLE pill, a one-line provenance description, and a decorative
 * "View SQL" button.
 *
 * Positioning context is the caller: the marker is wrapped in a
 * `position: relative` span; this card anchors `top: calc(100% + 8px)`.
 */
export const CitationPopover: React.FC<CitationPopoverProps> = ({
  citation,
  opacity = 1,
  liftProgress = 1,
  align = 'left',
  style,
}) => {
  const translateY = -(1 - Math.max(0, Math.min(1, liftProgress))) * 4;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        ...(align === 'right' ? { right: 0 } : { left: 0 }),
        width: 268,
        padding: '14px 16px 16px',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: [
          '0 16px 40px rgba(15, 23, 42, 0.16)',
          '0 3px 8px rgba(15, 23, 42, 0.08)',
        ].join(', '),
        fontFamily: FONT_FAMILY,
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
        zIndex: 20,
        ...style,
      }}
    >
      {/* Row 1: table name + TABLE pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            color: '#0f172a',
          }}
        >
          {citation.tableName}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 17,
            padding: '0 6px',
            borderRadius: 4,
            backgroundColor: 'rgba(62, 142, 216, 0.14)',
            color: '#3E8ED8',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {citation.badge}
        </span>
      </div>

      {/* Row 2: description */}
      <div
        style={{
          marginTop: 9,
          fontSize: 13,
          lineHeight: '19px',
          color: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        {citation.description}
      </div>

      {/* Row 3: decorative View SQL button */}
      <div
        style={{
          marginTop: 13,
          height: 38,
          borderRadius: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.1px',
          color: '#0f172a',
        }}
      >
        View SQL
      </div>
    </div>
  );
};
