import React from 'react';
import { COLORS } from '../../Playbooks/constants';
import { ArtifactRowData } from '../data';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ArtifactRowProps = {
  row: ArtifactRowData;
  /** Whether this row is currently active in the right-hand viewer. */
  selected?: boolean;
  /**
   * Whether the cursor is currently hovering over this row. Used to
   * paint a subtle hover wash (lighter than the selected wash) so the
   * cursor's path across the list reads as deliberate.
   */
  hovered?: boolean;
  /** Whether to draw the bottom divider line. Set false on the final row. */
  showDivider?: boolean;
};

/**
 * Single artifacts-list row. Two regions on a single line:
 *
 *   - Title (flex 1): just the artifact name.
 *   - Playbook slot (fixed): plain text when present, empty otherwise.
 *
 * Selected rows pick up a subtle near-black wash. A 1px bottom border
 * separates rows so the column reads as a table.
 */
export const ArtifactRow: React.FC<ArtifactRowProps> = ({
  row,
  selected = false,
  hovered = false,
  showDivider = true,
}) => {
  // Selected wins over hover so a selected row never loses its wash
  // when the cursor passes back over it.
  const backgroundColor = selected
    ? 'rgba(0, 0, 0, 0.07)'
    : hovered
      ? 'rgba(0, 0, 0, 0.025)'
      : 'transparent';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        // Bleed past the column's outer padding so the selected-state
        // wash AND the bottom divider read as full-width row bands.
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
        height: 60,
        backgroundColor,
        borderBottom: showDivider
          ? '1px solid rgba(0, 0, 0, 0.06)'
          : '1px solid transparent',
        boxSizing: 'border-box',
      }}
    >
      {/* Title (single line). */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: FONT_FAMILY,
          fontWeight: 400,
          fontSize: 13.5,
          lineHeight: '18px',
          letterSpacing: '-0.2px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.title}
      </span>

      {/* Playbook column: plain text in the body color, no chip. */}
      <span
        style={{
          width: 220,
          flexShrink: 0,
          fontFamily: FONT_FAMILY,
          fontWeight: 500,
          fontSize: 12.5,
          lineHeight: '16px',
          letterSpacing: '-0.1px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.playbook ?? ''}
      </span>
    </div>
  );
};
