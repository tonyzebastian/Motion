import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import {
  ARTIFACT_PANEL_BACKGROUND,
  ARTIFACT_PANEL_WHITE_WASH,
  ARTIFACT_VIEW_TOOLBAR,
  BODY_BACKGROUND_FALLBACK,
  COLORS,
  LAYOUT,
} from '../../Playbooks/constants';
import {
  AHA_MOMENT_ARTIFACT_TITLE,
  AhaMomentReport,
} from './AhaMomentReport';
import { LongTermReport } from './LongTermReport';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

/**
 * Right-panel artifact viewer for the Angle 2 scene. Same chrome as
 * `Playbooks/ArtifactViewer` (sticky toolbar with close X, title, HTML
 * badge, Download, Shared toggle, scrollable body, scoped scrollbar
 * CSS, body-gradient + white-wash background) but supports two reports
 * that cross-fade based on `swapProgress`:
 *
 *   activeArtifact = 'longTerm'   -> Long-Term User Growth Opportunities
 *   activeArtifact = 'ahaMoment'  -> Aha Moment Analysis: D7 Activation
 *
 * Both titles render in the toolbar and both report bodies render in
 * the scroll body, opacity-driven by swapProgress so swap is a soft
 * cross-fade rather than a hard cut.
 */
export type ActiveArtifact = 'longTerm' | 'ahaMoment';

type ArtifactPanelProps = {
  activeArtifact: ActiveArtifact;
  /**
   * 0 = no swap in progress (activeArtifact rendered solo).
   * 0..1 mid-swap = previous artifact fades out, target artifact fades in.
   * 1 = swap complete.
   *
   * The scene resets swapProgress to 0 after the cross-fade window
   * finishes -- once `activeArtifact` flips to the new value and the
   * swap window ends, `swapProgress` can stay at 0 with the new
   * artifact rendered solo. We compute the visible opacities here from
   * the combination of activeArtifact + swapProgress; both report
   * components stay mounted across the swap so layout doesn't reflow.
   */
  swapProgress: number;
  /**
   * 0..1 opacity of the loading overlay shown over the report body
   * after the second artifact is clicked but before the new report
   * fades in. Both report bodies are dimmed by `1 - loadingOpacity` so
   * the spinner reads on a clean surface.
   */
  loadingOpacity?: number;
};

const SCROLL_STYLES = `
.angle2-artifact-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.angle2-artifact-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.angle2-artifact-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.angle2-artifact-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}
.angle2-artifact-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.14);
}
.angle2-artifact-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
`;

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  activeArtifact,
  swapProgress,
  loadingOpacity = 0,
}) => {
  // When activeArtifact is 'longTerm' AND swapProgress is 0, the
  // Long-Term report shows at 100% opacity. During the cross-fade,
  // swapProgress eases from 0 -> 1 *while activeArtifact is already
  // the target value*, so the target opacity is `swapProgress` and the
  // outgoing opacity is `1 - swapProgress`. Once the swap window ends,
  // the scene clamps swapProgress to 1 and the new artifact is fully
  // visible.
  //
  // For activeArtifact === 'ahaMoment':
  //   longTerm  opacity = 1 - swapProgress
  //   ahaMoment opacity = swapProgress
  // For activeArtifact === 'longTerm':
  //   longTerm  opacity = 1
  //   ahaMoment opacity = 0
  //
  // Both opacities are then attenuated by (1 - loadingOpacity) so the
  // body dims behind the loading overlay during the second-artifact
  // load.
  const dim = 1 - loadingOpacity;
  const longTermOpacity =
    (activeArtifact === 'longTerm' ? 1 : 1 - swapProgress) * dim;
  const ahaOpacity =
    (activeArtifact === 'ahaMoment' ? swapProgress : 0) * dim;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: `${ARTIFACT_PANEL_WHITE_WASH}, ${ARTIFACT_PANEL_BACKGROUND}`,
        backgroundColor: BODY_BACKGROUND_FALLBACK,
        overflow: 'hidden',
      }}
    >
      <style>{SCROLL_STYLES}</style>
      {/* Toolbar dims along with the body during the loading beat so
          the spinner reads against a clean surface. */}
      <div style={{ flexShrink: 0, opacity: 1 - loadingOpacity }}>
        <Toolbar
          activeArtifact={activeArtifact}
          swapProgress={swapProgress}
        />
      </div>
      <div
        className="angle2-artifact-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/*
          Both reports stack absolutely inside the scroll body so the
          cross-fade reads as a single body swap (no layout reflow,
          identical scroll positions). The active report sits on top via
          opacity rather than z-index swapping.
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: longTermOpacity,
            pointerEvents: 'none',
          }}
        >
          <LongTermReport />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: ahaOpacity,
            pointerEvents: 'none',
          }}
        >
          <AhaMomentReport />
        </div>

        {/* Loading overlay (rendered above both report bodies). */}
        {loadingOpacity > 0 && <LoadingOverlay opacity={loadingOpacity} />}
      </div>
    </div>
  );
};

const LoadingOverlay: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  // Spinner does one full revolution per second (30fps * 12deg = 360deg).
  const rotation = (frame * 12) % 360;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Spinner rotation={rotation} />
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: '-0.1px',
            color: 'rgba(0,0,0,0.55)',
          }}
        >
          Loading artifact...
        </span>
      </div>
    </div>
  );
};

const Spinner: React.FC<{ rotation: number }> = ({ rotation }) => (
  // Partial-arc spinner. We draw a full circle in a low-contrast track
  // color, then a quarter-arc in the brand purple that rotates with the
  // frame. SVG strokeDasharray draws ~25% of the circumference.
  <svg
    width={22}
    height={22}
    viewBox="0 0 22 22"
    style={{
      transform: `rotate(${rotation}deg)`,
      transformOrigin: '50% 50%',
    }}
  >
    <circle
      cx={11}
      cy={11}
      r={8.5}
      stroke="rgba(0,0,0,0.10)"
      strokeWidth={2}
      fill="none"
    />
    <circle
      cx={11}
      cy={11}
      r={8.5}
      stroke={COLORS.purple}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray={`${(2 * Math.PI * 8.5) / 4} ${
        (3 * 2 * Math.PI * 8.5) / 4
      }`}
      fill="none"
    />
  </svg>
);

const Toolbar: React.FC<{
  activeArtifact: ActiveArtifact;
  swapProgress: number;
}> = ({ activeArtifact, swapProgress }) => {
  // Title cross-fade uses the same opacity rule as the body so they
  // sync visually. Both titles share the same flex slot via absolute
  // positioning inside a relative wrapper -- whichever is fading in
  // sits on top.
  const longTermTitleOpacity =
    activeArtifact === 'longTerm' ? 1 : 1 - swapProgress;
  const ahaTitleOpacity =
    activeArtifact === 'ahaMoment' ? swapProgress : 0;

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
      {/*
        Stack both titles in the same grid cell so the wrapper sizes
        itself to the larger of the two natural widths (with the 58%
        toolbar cap + ellipsis fallback). Using absolute positioning
        here instead would collapse the wrapper to zero width since
        absolute children don't contribute to layout.
      */}
      <div
        style={{
          display: 'grid',
          flex: '0 1 auto',
          minWidth: 0,
          maxWidth: '58%',
        }}
      >
        <TitleText
          text={ARTIFACT_VIEW_TOOLBAR.title}
          opacity={longTermTitleOpacity}
        />
        <TitleText
          text={AHA_MOMENT_ARTIFACT_TITLE}
          opacity={ahaTitleOpacity}
        />
      </div>

      <HtmlBadge />
      <div style={{ flex: 1, minWidth: 0 }} />
      <DownloadButton />
      <SharedToggle />
      <CloseButton />
    </div>
  );
};

const TitleText: React.FC<{ text: string; opacity: number }> = ({
  text,
  opacity,
}) => (
  <span
    style={{
      // Both titles occupy the same grid cell -- the wider one drives
      // the wrapper's width; the other overlays via opacity for the
      // cross-fade.
      gridArea: '1 / 1',
      minWidth: 0,
      opacity,
      fontWeight: 500,
      fontSize: 13,
      letterSpacing: '-0.2px',
      color: COLORS.text,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: '18px',
    }}
  >
    {text}
  </span>
);

const HtmlBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 20,
      padding: '0 8px',
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
