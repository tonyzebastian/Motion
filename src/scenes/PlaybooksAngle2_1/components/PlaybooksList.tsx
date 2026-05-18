import React from 'react';
import {
  BODY_BACKGROUND,
  BODY_BACKGROUND_FALLBACK,
  COLORS,
} from '../../Playbooks/constants';
import { PLAYBOOKS_ANGLE_2_1 } from '../data';
import { PlaybookRow } from './PlaybookRow';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// Scoped scrollbar styles -- mirrors the trick used in the artifacts
// list / artifact viewer so all three panels share the same minimal
// scrollbar vocabulary.
const SCROLL_STYLES = `
.playbook-list-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.playbook-list-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.playbook-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.playbook-list-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}
.playbook-list-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.14);
}
.playbook-list-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
`;

type PlaybooksListProps = {
  /**
   * Index of the playbook currently open in the right-hand panel, or
   * `null` for no selection.
   */
  selectedIndex?: number | null;
  /**
   * Index of the row the cursor is currently hovering over, or
   * `null`.
   */
  hoveredIndex?: number | null;
};

/**
 * Left-panel playbooks list. Static layout: heading + single-column
 * `Name` header + the mapped rows in a scrollable column. Same
 * gradient backdrop + maxWidth-880 inner cap as the artifacts list so
 * the two scenes feel like siblings.
 */
export const PlaybooksList: React.FC<PlaybooksListProps> = ({
  selectedIndex = null,
  hoveredIndex = null,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: BODY_BACKGROUND,
        backgroundColor: BODY_BACKGROUND_FALLBACK,
      }}
    >
      <style>{SCROLL_STYLES}</style>

      <div
        className="playbook-list-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: 36,
          paddingRight: 36,
          paddingTop: 14,
          paddingBottom: 24,
        }}
      >
        <div
          style={{
            maxWidth: 880,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h1
            style={{
              margin: 0,
              marginBottom: 22,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              fontSize: 22,
              lineHeight: '28px',
              letterSpacing: '-0.5px',
              color: COLORS.text,
            }}
          >
            Playbooks
          </h1>

          <ColumnHeader />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {PLAYBOOKS_ANGLE_2_1.map((row, idx) => (
              <PlaybookRow
                key={`${row.name}-${idx}`}
                row={row}
                selected={selectedIndex === idx}
                hovered={hoveredIndex === idx}
                showDivider={idx < PLAYBOOKS_ANGLE_2_1.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ColumnHeader: React.FC = () => {
  const headerStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontWeight: 500,
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '-0.1px',
    color: COLORS.iconStroke,
    whiteSpace: 'nowrap',
  };

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
        paddingTop: 4,
        paddingBottom: 10,
        marginBottom: 0,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxSizing: 'border-box',
      }}
    >
      <span style={{ ...headerStyle, flex: 1 }}>Name</span>
      <span style={{ ...headerStyle, width: 180, flexShrink: 0 }}>
        Category
      </span>
    </div>
  );
};
