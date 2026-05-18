import React from 'react';
import { COLORS } from '../../Playbooks/constants';
import { PlaybookRowData } from '../data';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type PlaybookRowProps = {
  row: PlaybookRowData;
  /** Whether this row is currently active in the right-hand panel. */
  selected?: boolean;
  /** Whether the cursor is currently hovering over this row. */
  hovered?: boolean;
  /** Whether to draw the bottom divider line. Set false on the final row. */
  showDivider?: boolean;
};

/**
 * Single playbooks-list row. Two regions on a single line:
 *
 *   - Name (flex 1): the playbook name.
 *   - Category (fixed): one-word domain tag.
 *
 * Selected wins over hovered so a selected row never loses its wash
 * when the cursor passes back over it.
 */
export const PlaybookRow: React.FC<PlaybookRowProps> = ({
  row,
  selected = false,
  hovered = false,
  showDivider = true,
}) => {
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
        {row.name}
      </span>

      {/* Category column: quiet text in the body color, no chip. */}
      <span
        style={{
          width: 180,
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
        {row.category}
      </span>
    </div>
  );
};
