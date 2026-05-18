import React from 'react';
import { REPORT_PALETTE } from '../../Playbooks/constants';
import { PlaybookDetailSection } from './PlaybookDetailSection';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// ============================================
// Long Term Metric Change - playbook detail body.
//
// Themed as a documentation/preview view (not a live form): two
// PlaybookDetailSection cards stacked vertically, each containing the
// authored content for that section.
// ============================================

export const LONG_TERM_PLAYBOOK_NAME = 'Long Term Metric Change';

export const LongTermMetricChangeDetail: React.FC = () => (
  <div
    style={{
      padding: '32px 28px 40px',
      fontFamily: FONT_FAMILY,
      color: REPORT_PALETTE.bodyText,
    }}
  >
    <PlaybookDetailSection
      heading="LLM description"
      subtitle="This description helps the agent decide when to pick this playbook."
    >
      <p style={proseStyle}>
        Pick this playbook when the user asks why a long-running metric
        — MAU, revenue, retention, total active accounts — moved across
        a quarter or a year. It decomposes the metric into four flows
        ({' '}
        <strong>retained</strong>, <strong>resurrected</strong>,{' '}
        <strong>new</strong>, <strong>churned</strong> ) and ranks the
        levers that contributed most to the delta so the agent can
        recommend where to invest.
      </p>
    </PlaybookDetailSection>

    <PlaybookDetailSection heading="Content">
      <SubHeading>Overview</SubHeading>
      <p style={proseStyle}>
        This playbook performs growth-accounting decomposition on any
        long-running aggregate metric. It compares the most recent
        period's value to a prior baseline, attributes the delta to
        four user-flow components, and surfaces the largest
        contributing flow as the primary lever. Use it for narrative
        explanations of <em>why</em> a metric moved, not for raw
        anomaly detection.
      </p>

      <SubHeading>Required inputs</SubHeading>
      <InputsGrid
        rows={[
          {
            name: 'metric',
            required: 'Yes',
            description:
              'The aggregate metric to decompose (e.g. monthly_active_users, weekly_revenue).',
          },
          {
            name: 'time window',
            required: 'Yes',
            description:
              'Current period and baseline (e.g. last 12 months vs. prior 12 months).',
          },
          {
            name: 'dimension filter',
            required: 'No',
            description:
              'Optional dimension/value pair to scope the decomposition (e.g. country = "United States").',
          },
        ]}
      />

      <SubHeading>Steps</SubHeading>
      <ol style={listStyle}>
        <li>
          Compute current and baseline values for the metric, scoped by
          any provided dimension filter.
        </li>
        <li>
          Classify each contributing entity (user, account, session)
          into retained, resurrected, new, or churned for the current
          period.
        </li>
        <li>
          Compute the period-over-period delta for each flow and
          identify the largest single contributor.
        </li>
        <li>
          Rank the four flows by absolute contribution and tag the top
          flow as the primary lever; cite supporting historical
          benchmarks where available.
        </li>
        <li>
          Build supporting visuals: a stacked-flow chart over time and
          a single-period contribution breakdown.
        </li>
      </ol>

      <SubHeading>Output</SubHeading>
      <p style={proseStyle}>
        A one-paragraph summary naming the largest contributing flow,
        followed by a numbered list of recommended levers ranked by
        realistic upside, and a stat card surfacing the four
        component values for the most recent period.
      </p>
    </PlaybookDetailSection>
  </div>
);

// ============================================
// Local helpers
// ============================================

const proseStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  lineHeight: '22px',
  color: REPORT_PALETTE.bodyText,
};

const listStyle: React.CSSProperties = {
  margin: '0 0 12px',
  paddingLeft: 20,
  fontSize: 13.5,
  lineHeight: '22px',
  color: REPORT_PALETTE.bodyText,
};

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3
    style={{
      margin: '0 0 6px',
      fontSize: 13,
      fontWeight: 600,
      color: '#000000',
      letterSpacing: '-0.1px',
    }}
  >
    {children}
  </h3>
);

const InputsGrid: React.FC<{
  rows: { name: string; required: string; description: string }[];
}> = ({ rows }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '120px 80px 1fr',
      rowGap: 8,
      columnGap: 12,
      alignItems: 'baseline',
      fontSize: 13,
      lineHeight: '20px',
      marginBottom: 16,
    }}
  >
    <div style={gridHeaderStyle}>Input</div>
    <div style={gridHeaderStyle}>Required</div>
    <div style={gridHeaderStyle}>Description</div>
    {rows.map((r) => (
      <React.Fragment key={r.name}>
        <div style={{ fontWeight: 500, color: '#000000' }}>{r.name}</div>
        <div style={{ color: REPORT_PALETTE.bodyText }}>{r.required}</div>
        <div style={{ color: REPORT_PALETTE.bodyText }}>{r.description}</div>
      </React.Fragment>
    ))}
  </div>
);

const gridHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: REPORT_PALETTE.mutedText,
  paddingBottom: 2,
  borderBottom: `1px solid ${REPORT_PALETTE.cardBorder}`,
};
