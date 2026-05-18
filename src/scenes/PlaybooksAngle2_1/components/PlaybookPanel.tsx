import React from 'react';
import { Download, Pencil, X } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import {
  ARTIFACT_PANEL_BACKGROUND,
  ARTIFACT_PANEL_WHITE_WASH,
  BODY_BACKGROUND_FALLBACK,
  COLORS,
  LAYOUT,
} from '../../Playbooks/constants';
import {
  AHA_MOMENT_PLAYBOOK_NAME,
  AhaMomentDetail,
} from './AhaMomentDetail';
import {
  LONG_TERM_PLAYBOOK_NAME,
  LongTermMetricChangeDetail,
} from './LongTermMetricChangeDetail';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

export type ActivePlaybook = 'longTerm' | 'ahaMoment';

type PlaybookPanelProps = {
  activePlaybook: ActivePlaybook;
  swapProgress: number;
  /**
   * 0..1 opacity of the loading overlay shown over the body after the
   * second playbook is clicked but before the new detail fades in.
   * Toolbar dims along with the body so the spinner reads against a
   * clean surface.
   */
  loadingOpacity?: number;
};

const SCROLL_STYLES = `
.angle21-playbook-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.angle21-playbook-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.angle21-playbook-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.angle21-playbook-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}
.angle21-playbook-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.14);
}
.angle21-playbook-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
`;

/**
 * Right-panel playbook viewer for the Angle 2.1 scene. Same panel
 * background + scrollbar treatment as the artifacts viewer, but the
 * toolbar carries Edit / Download / Close instead of HTML / Download
 * / Shared / Close, and the body renders one of the two playbook
 * detail bodies (cross-faded by swapProgress).
 */
export const PlaybookPanel: React.FC<PlaybookPanelProps> = ({
  activePlaybook,
  swapProgress,
  loadingOpacity = 0,
}) => {
  const dim = 1 - loadingOpacity;
  const longTermOpacity =
    (activePlaybook === 'longTerm' ? 1 : 1 - swapProgress) * dim;
  const ahaOpacity =
    (activePlaybook === 'ahaMoment' ? swapProgress : 0) * dim;

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

      {/* Toolbar dims with the body during loading. */}
      <div style={{ flexShrink: 0, opacity: 1 - loadingOpacity }}>
        <Toolbar
          activePlaybook={activePlaybook}
          swapProgress={swapProgress}
        />
      </div>

      <div
        className="angle21-playbook-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: longTermOpacity,
            pointerEvents: 'none',
          }}
        >
          <LongTermMetricChangeDetail />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: ahaOpacity,
            pointerEvents: 'none',
          }}
        >
          <AhaMomentDetail />
        </div>

        {loadingOpacity > 0 && <LoadingOverlay opacity={loadingOpacity} />}
      </div>
    </div>
  );
};

const LoadingOverlay: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
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
          Loading playbook...
        </span>
      </div>
    </div>
  );
};

const Spinner: React.FC<{ rotation: number }> = ({ rotation }) => (
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
  activePlaybook: ActivePlaybook;
  swapProgress: number;
}> = ({ activePlaybook, swapProgress }) => {
  const longTermTitleOpacity =
    activePlaybook === 'longTerm' ? 1 : 1 - swapProgress;
  const ahaTitleOpacity =
    activePlaybook === 'ahaMoment' ? swapProgress : 0;

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
      {/* Title slot: stack both names in the same grid cell so the
          wrapper sizes itself to the wider one (capped at 58%) and
          the cross-fade reads as a soft title swap. */}
      <div
        style={{
          display: 'grid',
          flex: '0 1 auto',
          minWidth: 0,
          maxWidth: '58%',
        }}
      >
        <TitleText
          text={LONG_TERM_PLAYBOOK_NAME}
          opacity={longTermTitleOpacity}
        />
        <TitleText
          text={AHA_MOMENT_PLAYBOOK_NAME}
          opacity={ahaTitleOpacity}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      <ToolbarButton icon={<Pencil size={14} strokeWidth={1.8} />} label="Edit" />
      <ToolbarButton
        icon={<Download size={14} strokeWidth={1.8} />}
        label="Download"
      />
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

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
}> = ({ icon, label }) => (
  <button
    type="button"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 26,
      padding: '0 10px',
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
    <span style={{ display: 'inline-flex', color: COLORS.iconStroke }}>
      {icon}
    </span>
    {label}
  </button>
);

const CloseButton: React.FC = () => (
  <button
    type="button"
    aria-label="Close playbook viewer"
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
