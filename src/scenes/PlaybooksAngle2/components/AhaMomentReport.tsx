import React from 'react';
import { REPORT_PALETTE } from '../../Playbooks/constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// ============================================
// Aha Moment Analysis: Workspace D7 Activation
//
// Mirror of the Long-Term report layout (same chrome, typography, and
// REPORT_PALETTE tokens) but themed for the second artifact the cursor
// opens in this scene. Content is composed from local string constants
// -- the HTML file in public/ is a visual reference only.
// ============================================

type StatTile = {
  value: string;
  label: string;
  delta: string;
  color: string;
};

const ACTIVATION_STATS: StatTile[] = [
  {
    value: '47.2%',
    label: 'D7 Activation Rate',
    delta: '+8.4pp QoQ',
    color: REPORT_PALETTE.brandTeal,
  },
  {
    value: '2.6 days',
    label: 'Median Time-to-Aha',
    delta: '−1.1 days QoQ',
    color: REPORT_PALETTE.brandPurple,
  },
  {
    value: '3,184',
    label: 'Activated Workspaces',
    delta: '+22.0% QoQ',
    color: REPORT_PALETTE.brandBlue,
  },
  {
    value: '11',
    label: 'Activation Events Tracked',
    delta: 'Across onboarding funnel',
    color: REPORT_PALETTE.brandPurple,
  },
  {
    value: '6,742',
    label: 'Baseline Cohort (Jul–Sep)',
    delta: 'New workspaces, Jul 1 – Sep 30',
    color: REPORT_PALETTE.brandOrange,
  },
];

type DriverCard = {
  rank: string;
  title: string;
  borderColor: string;
  body: string;
  impacts: { value: string; label: string }[];
};

const ACTIVATION_DRIVERS: DriverCard[] = [
  {
    rank: '#1 Top Driver',
    title: 'Onboarding Checklist Completion',
    borderColor: REPORT_PALETTE.brandTeal,
    body: 'Workspaces that finish the 4-step onboarding checklist activate at 71% by day 7 vs 28% for those that abandon. Completion rate is currently 38%.',
    impacts: [
      { value: '+2.4x', label: 'D7 lift vs non-completers' },
      { value: '+12pp', label: 'D7 if completion rises to 55%' },
    ],
  },
  {
    rank: '#2 Strong Driver',
    title: 'First Collaborator Invite',
    borderColor: REPORT_PALETTE.brandPurple,
    body: 'Inviting a teammate within 48h correlates with a +18pp lift in D7 activation. Only 31% of new workspaces invite a collaborator in that window.',
    impacts: [
      { value: '+18pp', label: 'D7 lift when invite sent by 48h' },
      { value: '+5.6pp', label: 'D7 if invite rate rises to 45%' },
    ],
  },
  {
    rank: '#3 Supporting Driver',
    title: 'Sample Data Import',
    borderColor: REPORT_PALETTE.brandBlue,
    body: 'Workspaces that import sample data on day 0 are 1.7x more likely to reach the aha moment by day 7. Adoption sits at 22% today.',
    impacts: [
      { value: '+1.7x', label: 'D7 lift vs no sample import' },
      { value: '+3.2pp', label: 'D7 if import rate doubles to 44%' },
    ],
  },
];

export const AhaMomentReport: React.FC = () => {
  return (
    <div
      style={{
        padding: '32px 28px 40px',
        fontFamily: FONT_FAMILY,
        color: REPORT_PALETTE.bodyText,
      }}
    >
      <SummarySection />
      <ActivationCompositionCard />
      <DriversSection />
    </div>
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
      Workspace D7 Activation: Aha Moment Drivers
    </h1>
    <p
      style={{
        margin: '6px 0 18px',
        fontSize: 13,
        color: REPORT_PALETTE.mutedText,
        lineHeight: '20px',
      }}
    >
      Cohort retention by activation event — Jul–Sep 2025
    </p>

    <p
      style={{
        margin: 0,
        fontSize: 14,
        lineHeight: '24px',
        color: REPORT_PALETTE.bodyText,
      }}
    >
      D7 activation has lifted to{' '}
      <span style={{ color: REPORT_PALETTE.brandTeal, fontWeight: 600 }}>
        47.2%
      </span>{' '}
      this quarter, an{' '}
      <span style={{ fontWeight: 600 }}>+8.4pp gain</span> over the prior cohort.
      The single biggest predictor of activation remains{' '}
      <span style={{ fontWeight: 600 }}>onboarding checklist completion</span>:
      workspaces that finish all four steps activate at 71%, more than 2x the
      28% rate seen in workspaces that abandon the checklist. Median
      time-to-aha has also{' '}
      <span style={{ color: REPORT_PALETTE.brandPurple, fontWeight: 600 }}>
        compressed by 1.1 days
      </span>
      , suggesting the friction we removed in the empty-state flow is paying
      off.
    </p>
  </section>
);

const ActivationCompositionCard: React.FC = () => (
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
        D7 Activation Composition (Jul – Sep 2025)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          rowGap: 22,
          columnGap: 18,
        }}
      >
        {ACTIVATION_STATS.map((stat) => (
          <StatTileView key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  </section>
);

const StatTileView: React.FC<{ stat: StatTile }> = ({ stat }) => (
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
      {stat.delta}
    </div>
  </div>
);

const DriversSection: React.FC = () => (
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
      Activation Drivers, Ranked by Lift
    </h2>
    <p
      style={{
        margin: '0 0 16px',
        fontSize: 13,
        color: REPORT_PALETTE.mutedText,
        lineHeight: '20px',
      }}
    >
      Each driver is scored by its D7 activation lift relative to the
      non-completing baseline cohort over the same window.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ACTIVATION_DRIVERS.map((driver) => (
        <DriverCardView key={driver.title} driver={driver} />
      ))}
    </div>
  </section>
);

const DriverCardView: React.FC<{ driver: DriverCard }> = ({ driver }) => (
  <div
    style={{
      borderLeft: `3px solid ${driver.borderColor}`,
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
        color: driver.borderColor,
        marginBottom: 4,
      }}
    >
      {driver.rank}
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
      {driver.title}
    </div>
    <div
      style={{
        fontSize: 13,
        lineHeight: '20px',
        color: REPORT_PALETTE.bodyText,
        marginBottom: 10,
      }}
    >
      {driver.body}
    </div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
      }}
    >
      {driver.impacts.map((impact) => (
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

export const AHA_MOMENT_ARTIFACT_TITLE =
  'Aha Moment Analysis: Workspace D7 Activation';
