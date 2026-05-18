import React from 'react';
import {
  BODY_BACKGROUND,
  BODY_BACKGROUND_FALLBACK,
  COLORS,
} from '../../Playbooks/constants';
import { ARTIFACTS_ANGLE2 } from '../data';
import { ArtifactRow } from './ArtifactRow';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// Scoped scrollbar styles -- mirrors the trick used in
// ArtifactViewer so both panels share the same minimal scrollbar
// vocabulary. The `artifact-list-scroll` class scopes the styles to
// this list only.
const SCROLL_STYLES = `
.artifact-list-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.artifact-list-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.artifact-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.artifact-list-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}
.artifact-list-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.14);
}
.artifact-list-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
`;

type ArtifactsListProps = {
  /**
   * Index of the row currently highlighted as "open in the viewer", or
   * `null` for no selection. Driven by the scene's animation state.
   */
  selectedIndex?: number | null;
  /**
   * Index of the row the cursor is currently hovering over, or `null`.
   * Paints a subtle hover wash on that row.
   */
  hoveredIndex?: number | null;
};

/**
 * Left-panel artifacts list. Static layout: a heading, a column-header
 * row, and the mapped rows in a scrollable column. The scene owns all
 * motion (cursor, panel slide, swap) -- the list itself just renders
 * the current selection state.
 *
 * The list is centered horizontally inside its parent column via 20px
 * padding on each side; rows can bleed past that padding for the
 * full-width selected-row wash (see ArtifactRow).
 */
export const ArtifactsList: React.FC<ArtifactsListProps> = ({
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
        // Apply the shared body gradient as the panel backdrop so the
        // list reads on the same warm canvas as the rest of the scene
        // instead of on the browser window's flat white.
        background: BODY_BACKGROUND,
        backgroundColor: BODY_BACKGROUND_FALLBACK,
      }}
    >
      <style>{SCROLL_STYLES}</style>

      <div
        className="artifact-list-scroll"
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
        {/*
          Inner content wrapper. In full-width mode the BrowserWindow
          body is 1120px wide -- letting the table stretch the full
          span makes the rows feel uncomfortably wide and the playbook
          column drifts far from the title column. Capping at 880px and
          centering keeps the table compact while still leaving room
          for the heading. In split-mode the parent column is already
          narrower than this cap (615px), so the maxWidth is a no-op
          and the list fills the column as before.
        */}
        <div
          style={{
            maxWidth: 880,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {/* Page heading */}
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
            Artifacts
          </h1>

          {/* Column header row */}
          <ColumnHeader />

          {/* Rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {ARTIFACTS_ANGLE2.map((row, idx) => (
              <ArtifactRow
                key={`${row.title}-${idx}`}
                row={row}
                selected={selectedIndex === idx}
                hovered={hoveredIndex === idx}
                showDivider={idx < ARTIFACTS_ANGLE2.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ColumnHeader: React.FC = () => {
  // Sentence-case labels, not uppercased -- read as quiet column
  // headers rather than shouty all-caps. Left-aligned across the board
  // so the Created-by column matches the row content beneath.
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
        // Bleed past the column padding the same ±16 the data rows do
        // so the header underline runs the full row width instead of
        // sitting inset.
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
      <span style={{ ...headerStyle, width: 220, flexShrink: 0 }}>
        Playbooks used
      </span>
    </div>
  );
};
