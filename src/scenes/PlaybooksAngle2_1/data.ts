// ============================================
// Playbooks list data for the Playbooks Angle 2.1 scene.
//
// Order is meaningful: the scene's cursor waypoints in
// PlaybooksAngle2/timing.ts click row index 0 first and row index 5
// second. So Long Term Metric Change must be at index 0, and Aha
// Moment must be at index 5; these are the two playbooks whose
// detail bodies render in the right-hand panel.
// ============================================

export type PlaybookRowData = {
  name: string;
  /**
   * One-word domain tag rendered in the right-hand column. Acts as a
   * lightweight taxonomy hint so the list reads as a curated library.
   */
  category: string;
};

export const PLAYBOOKS_ANGLE_2_1: PlaybookRowData[] = [
  // Click target 1 (cursor row 0).
  { name: 'Long Term Metric Change', category: 'Growth' },
  { name: 'Data Quality Assessment', category: 'Quality' },
  { name: 'Funnel Analysis', category: 'Conversion' },
  { name: 'Trend Shift', category: 'Trends' },
  { name: 'Engagement Cohort Analysis', category: 'Engagement' },
  // Click target 2 (cursor row 5).
  { name: 'Aha Moment', category: 'Activation' },
  { name: 'Change Anomalies', category: 'Trends' },
  { name: 'Retention Curve Analysis', category: 'Retention' },
  { name: 'Conversion Drop-off', category: 'Conversion' },
  { name: 'Segment Performance Comparison', category: 'Segmentation' },
  { name: 'Revenue Driver Breakdown', category: 'Revenue' },
  { name: 'Activation Path Discovery', category: 'Activation' },
  { name: 'Churn Risk Profiling', category: 'Retention' },
  { name: 'Trend Audit', category: 'Trends' },
];

export const LONG_TERM_ROW_INDEX = 0;
export const AHA_MOMENT_ROW_INDEX = 5;
