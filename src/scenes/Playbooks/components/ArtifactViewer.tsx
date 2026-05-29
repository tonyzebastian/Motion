import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  ARTIFACT_PANEL_BACKGROUND,
  ARTIFACT_PANEL_WHITE_WASH,
  ARTIFACT_VIEW_TOOLBAR,
  BODY_BACKGROUND_FALLBACK,
  COLORS,
  LAYOUT,
} from '../constants';
import { ArtifactReport } from './ArtifactReport';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

/**
 * Right-panel artifact viewer: a sticky top toolbar (close X, title,
 * "HTML" badge pill, "Download" menu trigger, "Shared" toggle) above
 * an independently-scrollable body that renders the React-reconstructed
 * report. Everything here is static -- no interactions are animated.
 */
/**
 * Scoped CSS for the artifact viewer's scrollable body. WebKit and
 * Firefox each need their own scrollbar styling. We render this once
 * (it's idempotent so re-mounting is safe) so the inline style on the
 * scroll container can opt-in via the `artifact-scroll` class.
 */
const SCROLL_STYLES = `
.artifact-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.artifact-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.artifact-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.artifact-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}
.artifact-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.14);
}
.artifact-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
`;

type ArtifactViewerProps = {
  /** Global gate / opacity for the inline citation markers (default 0). */
  citationsOpacity?: number;
  /** Per-index opacity override (for staggered fade-in). */
  citationOpacities?: Record<number, number>;
  /** Index whose citation popover is currently shown. */
  hoveredCitationIndex?: number;
  /** Popover element rendered next to the hovered marker. */
  popoverNode?: React.ReactNode;
};

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  citationsOpacity,
  citationOpacities,
  hoveredCitationIndex,
  popoverNode,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        // Background is layered top-down (CSS paints first listed first):
        //   1. white wash that fades from ~opaque at the bottom to fully
        //      transparent at the top, giving the report area a clean
        //      neutral surface while still letting the body gradient
        //      bleed in near the toolbar.
        //   2. a horizontally-mirrored copy of the body gradient, so the
        //      warm peach corner lands on the far-right edge of the scene
        //      and bookends the chat side's top-left peach. The panel
        //      reads as cut from the same canvas as the chat column.
        background: `${ARTIFACT_PANEL_WHITE_WASH}, ${ARTIFACT_PANEL_BACKGROUND}`,
        backgroundColor: BODY_BACKGROUND_FALLBACK,
        overflow: 'hidden',
      }}
    >
      <style>{SCROLL_STYLES}</style>
      <Toolbar />
      <div
        className="artifact-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <ArtifactReport
          citationsOpacity={citationsOpacity}
          citationOpacities={citationOpacities}
          hoveredCitationIndex={hoveredCitationIndex}
          popoverNode={popoverNode}
        />
      </div>
    </div>
  );
};

const Toolbar: React.FC = () => {
  return (
    <div
      style={{
        height: LAYOUT.artifactToolbarHeight,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 12,
        paddingRight: 12,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxSizing: 'border-box',
        fontFamily: FONT_FAMILY,
      }}
    >
      <span
        style={{
          // Hug the title text instead of stretching across the toolbar.
          // The badge naturally sits next to it; a flex spacer below pushes
          // the trailing actions to the right edge. maxWidth caps the
          // title at ~58% of the toolbar so longer titles truncate via
          // ellipsis instead of crowding the badge/actions.
          flex: '0 1 auto',
          minWidth: 0,
          maxWidth: '58%',
          fontWeight: 500,
          fontSize: 13,
          letterSpacing: '-0.2px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {ARTIFACT_VIEW_TOOLBAR.title}
      </span>

      <HtmlBadge />
      <div style={{ flex: 1, minWidth: 0 }} />
      <DownloadButton />
      <SharedToggle />
      <CloseButton />
    </div>
  );
};

const HtmlBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 20,
      padding: '0 8px',
      // Pull closer to the title text. The toolbar's flex `gap: 10` is
      // sized for the trailing action cluster (Download / Shared / X);
      // the badge reads as part of the title group, so we tighten the
      // spacing on its leading edge.
      marginLeft: -4,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      color: 'rgba(0, 0, 0, 0.55)',
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.2px',
      textTransform: 'uppercase',
      flexShrink: 0,
    }}
  >
    {ARTIFACT_VIEW_TOOLBAR.badge}
  </span>
);

const DownloadButton: React.FC = () => (
  <button
    type="button"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      height: 26,
      padding: '0 8px',
      borderRadius: 6,
      border: 'none',
      background: 'transparent',
      color: COLORS.text,
      cursor: 'default',
      fontFamily: FONT_FAMILY,
      fontSize: 13,
      fontWeight: 400,
    }}
  >
    {ARTIFACT_VIEW_TOOLBAR.downloadLabel}
    <ChevronDown size={14} strokeWidth={1.8} color={COLORS.iconStroke} />
  </button>
);

const SharedToggle: React.FC = () => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: COLORS.text,
      }}
    >
      {ARTIFACT_VIEW_TOOLBAR.sharedLabel}
    </span>
    {/* Off-state pill toggle. The thumb sits on the left edge. */}
    <div
      style={{
        position: 'relative',
        width: 22,
        height: 13,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 1.5,
          left: 1.5,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
        }}
      />
    </div>
  </div>
);

const CloseButton: React.FC = () => (
  <button
    type="button"
    aria-label="Close artifact viewer"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 26,
      height: 26,
      borderRadius: 6,
      border: 'none',
      background: 'transparent',
      cursor: 'default',
      padding: 0,
    }}
  >
    <X size={16} strokeWidth={1.8} color={COLORS.iconStroke} />
  </button>
);
