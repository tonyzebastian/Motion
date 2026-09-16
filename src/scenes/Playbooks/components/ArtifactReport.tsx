import React from 'react';
import {
  LeverCard,
  MAU_COMPOSITION_STATS,
  REPORT_INTRO_PROSE,
  REPORT_LEVERS,
  REPORT_PALETTE,
} from '../constants';
import { CitationMarker } from '../../PlaybooksCitations/components/CitationMarker';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// ---- Citation rendering config (threaded via context) ----
//
// ArtifactReport is rendered by three scenes (Playbooks, TrustSignal,
// Citations). Only the Citations scene passes citation props; the
// others get the defaults (gate 0 -> no markers render), so their
// output is unchanged.
type CitationRenderConfig = {
  /** Effective 0..1 opacity for a given citation index (0 = hidden). */
  getOpacity: (index: number) => number;
  /** Index of the citation whose popover is currently shown, if any. */
  hoveredIndex?: number;
  /** Popover element anchored next to the hovered marker. */
  popoverNode?: React.ReactNode;
};

const CitationContext = React.createContext<CitationRenderConfig | null>(null);

/**
 * Inline `[N]` marker for a cited value. Renders nothing unless the
 * Citations scene has activated the citation layer. When this marker is
 * the hovered one, it wraps itself in a positioning context and renders
 * the popover as a sibling.
 */
const InlineCitation: React.FC<{ index?: number }> = ({ index }) => {
  const cfg = React.useContext(CitationContext);
  if (!cfg || index === undefined) return null;
  const opacity = cfg.getOpacity(index);
  if (opacity <= 0) return null;
  const highlighted = cfg.hoveredIndex === index;

  if (highlighted && cfg.popoverNode) {
    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <CitationMarker index={index} opacity={opacity} highlighted />
        {cfg.popoverNode}
      </span>
    );
  }
  return (
    <CitationMarker index={index} opacity={opacity} highlighted={highlighted} />
  );
};

type ArtifactReportProps = {
  /** Global gate / opacity applied to every marker (default 0 = off). */
  citationsOpacity?: number;
  /** Per-index opacity override (for staggered fade-in). */
  citationOpacities?: Record<number, number>;
  /** Index whose popover is currently shown. */
  hoveredCitationIndex?: number;
  /** Popover element rendered next to the hovered marker. */
  popoverNode?: React.ReactNode;
};

/**
 * React reconstruction of the visible portion of the HTML artifact
 * report (see public/product-video/Long-Term User Growth Opportunities
 * Analysis.html for the source). Renders the title + subtitle, the
 * colored-callout summary prose, the "Current MAU Composition" 5-stat
 * grid, and trimmed-down "Growth Levers" cards below so the scrollable
 * area has real depth.
 *
 * No animation lives here; the panel is mounted once Phase 7 opens and
 * stays static for the rest of the scene. The optional citation props
 * drive the inline `[N]` annotation layer used by the Citations scene.
 */
export const ArtifactReport: React.FC<ArtifactReportProps> = ({
  citationsOpacity = 0,
  citationOpacities,
  hoveredCitationIndex,
  popoverNode,
}) => {
  const citationConfig = React.useMemo<CitationRenderConfig>(
    () => ({
      getOpacity: (index: number) =>
        citationOpacities?.[index] ?? citationsOpacity,
      hoveredIndex: hoveredCitationIndex,
      popoverNode,
    }),
    [citationsOpacity, citationOpacities, hoveredCitationIndex, popoverNode],
  );

  return (
    <CitationContext.Provider value={citationConfig}>
      <div
        style={{
          padding: '32px 28px 40px',
          fontFamily: FONT_FAMILY,
          color: REPORT_PALETTE.bodyText,
        }}
      >
        <SummarySection />
        <MauCompositionCard />
        <LeversSection />
      </div>
    </CitationContext.Provider>
  );
};

const SummarySection: React.FC = () => (
  <section style={{ marginBottom: 28 }}>
    <h1
      style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.4px',
        color: '#000000',
        lineHeight: '28px',
      }}
    >
      Long-Term User Growth: Biggest Opportunities
    </h1>
    <p
      style={{
        margin: '6px 0 18px',
        fontSize: 13,
        color: REPORT_PALETTE.mutedText,
        lineHeight: '20px',
      }}
    >
      Growth accounting analysis of MAU components — Apr 2025 to Apr 2026
    </p>

    <p
      style={{
        margin: 0,
        fontSize: 14,
        lineHeight: '24px',
        color: REPORT_PALETTE.bodyText,
      }}
    >
      {REPORT_INTRO_PROSE.map((seg, i) => (
        <React.Fragment key={i}>
          <span
            style={{
              color: seg.color,
              fontWeight: seg.bold ? 600 : 400,
            }}
          >
            {seg.text}
          </span>
          <InlineCitation index={seg.citation} />
        </React.Fragment>
      ))}
    </p>
  </section>
);

const MauCompositionCard: React.FC = () => (
  <section style={{ marginBottom: 28 }}>
    <div
      style={{
        border: `1px solid ${REPORT_PALETTE.cardBorder}`,
        borderRadius: 14,
        padding: '20px 22px 24px',
        backgroundColor: REPORT_PALETTE.sectionBackground,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#000000',
          marginBottom: 18,
          letterSpacing: '-0.1px',
        }}
      >
        Current MAU Composition (Apr 22, 2026)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          rowGap: 22,
          columnGap: 18,
        }}
      >
        {MAU_COMPOSITION_STATS.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  </section>
);

const StatTile: React.FC<{ stat: (typeof MAU_COMPOSITION_STATS)[number] }> = ({
  stat,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.4px',
        color: stat.color,
        lineHeight: '32px',
      }}
    >
      {stat.value}
      <InlineCitation index={stat.citation} />
    </div>
    <div
      style={{
        fontSize: 12,
        color: REPORT_PALETTE.mutedText,
        lineHeight: '16px',
      }}
    >
      {stat.label}
    </div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: REPORT_PALETTE.brandTeal,
        lineHeight: '16px',
      }}
    >
      {stat.change}
    </div>
  </div>
);

const LeversSection: React.FC = () => (
  <section style={{ marginBottom: 28 }}>
    <h2
      style={{
        margin: '12px 0 6px',
        fontSize: 17,
        fontWeight: 600,
        color: '#000000',
        letterSpacing: '-0.3px',
      }}
    >
      Growth Levers, Ranked by Impact Potential
    </h2>
    <p
      style={{
        margin: '0 0 16px',
        fontSize: 13,
        color: REPORT_PALETTE.mutedText,
        lineHeight: '20px',
      }}
    >
      Each lever is scored by the realistic number of additional MAU it could
      deliver based on historical performance benchmarks.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {REPORT_LEVERS.map((lever) => (
        <LeverCardView key={lever.title} lever={lever} />
      ))}
    </div>
  </section>
);

const LeverCardView: React.FC<{ lever: LeverCard }> = ({ lever }) => (
  <div
    style={{
      borderLeft: `3px solid ${lever.borderColor}`,
      borderTop: `1px solid ${REPORT_PALETTE.cardBorder}`,
      borderRight: `1px solid ${REPORT_PALETTE.cardBorder}`,
      borderBottom: `1px solid ${REPORT_PALETTE.cardBorder}`,
      borderRadius: 10,
      padding: '14px 16px 16px',
      backgroundColor: REPORT_PALETTE.sectionBackground,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        color: lever.borderColor,
        marginBottom: 4,
      }}
    >
      {lever.rank}
    </div>
    <div
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: '#000000',
        marginBottom: 6,
        letterSpacing: '-0.2px',
      }}
    >
      {lever.title}
    </div>
    <div
      style={{
        fontSize: 13,
        lineHeight: '20px',
        color: REPORT_PALETTE.bodyText,
        marginBottom: 10,
      }}
    >
      {lever.body}
    </div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
      }}
    >
      {lever.impacts.map((impact) => (
        <div key={impact.label} style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: REPORT_PALETTE.brandTeal,
              lineHeight: '20px',
            }}
          >
            {impact.value}
            <InlineCitation index={impact.citation} />
          </div>
          <div
            style={{
              fontSize: 11,
              color: REPORT_PALETTE.mutedText,
              lineHeight: '14px',
              maxWidth: 160,
            }}
          >
            {impact.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);
