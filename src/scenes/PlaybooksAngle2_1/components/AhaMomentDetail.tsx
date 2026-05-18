import React from 'react';
import { REPORT_PALETTE } from '../../Playbooks/constants';
import { PlaybookDetailSection } from './PlaybookDetailSection';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// ============================================
// Aha Moment - playbook detail body.
//
// Mirror of LongTermMetricChangeDetail with content themed for the
// activation/retention domain.
// ============================================

export const AHA_MOMENT_PLAYBOOK_NAME = 'Aha Moment';

export const AhaMomentDetail: React.FC = () => (
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
        Pick this playbook when the user asks about{' '}
        <strong>activation</strong>, <strong>onboarding effectiveness</strong>,
        or which early behaviors predict long-term retention. It scores
        candidate events by their D7 retention lift relative to a baseline
        cohort and surfaces the strongest activation drivers, ranked.
      </p>
    </PlaybookDetailSection>

    <PlaybookDetailSection heading="Content">
      <SubHeading>Overview</SubHeading>
      <p style={proseStyle}>
        This playbook runs a cohort-retention analysis over a fixed
        onboarding window. For each candidate event (e.g. checklist
        completion, first invite, first import) it computes D7 (or
        configurable D14) retention for the segment that completed the
        event vs. the segment that did not, and ranks the events by
        the size of the retention lift.
      </p>

      <SubHeading>Required inputs</SubHeading>
      <InputsGrid
        rows={[
          {
            name: 'event log',
            required: 'Yes',
            description:
              'Per-user event stream covering the cohort window (event_name, user_id, timestamp).',
          },
          {
            name: 'cohort window',
            required: 'Yes',
            description:
              'Signup-date range used to define the cohort (e.g. 2025-07-01 to 2025-09-30).',
          },
          {
            name: 'retention horizon',
            required: 'No',
            description:
              'Number of days used to measure retention. Defaults to 7; common alternatives: 14, 28.',
          },
        ]}
      />

      <SubHeading>Steps</SubHeading>
      <ol style={listStyle}>
        <li>
          Build the baseline cohort from all signups within the cohort
          window.
        </li>
        <li>
          Enumerate candidate activation events that fire during the
          first 48 hours of a user's lifetime.
        </li>
        <li>
          For each candidate event, partition the cohort into{' '}
          <em>completed</em> and <em>did-not-complete</em> segments and
          compute D-horizon retention for both.
        </li>
        <li>
          Rank candidate events by retention lift (completed minus
          baseline), filtering out events with thin sample size
          (&lt; 200 users).
        </li>
        <li>
          Validate the top driver against an out-of-window cohort to
          guard against seasonal artifacts.
        </li>
      </ol>

      <SubHeading>Output</SubHeading>
      <p style={proseStyle}>
        A table of activation drivers ranked by D7 lift, with sample
        size and confidence per row, plus a short narrative naming the
        top driver and the recommended product investment (e.g.
        increase checklist completion rate from 38 to 55 percent).
      </p>
    </PlaybookDetailSection>
  </div>
);

// ============================================
// Local helpers (kept private to this file; LongTermMetricChangeDetail
// has its own copy so changing the layout of one playbook doesn't
// silently change the other).
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
