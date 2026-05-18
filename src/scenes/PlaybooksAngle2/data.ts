// ============================================
// Artifacts list data for the Playbooks Angle 2 scene.
//
// First row is the artifact that's currently open in the right-hand
// viewer (so the highlighted row visually links to the report content).
// Subsequent rows mirror the screenshot reference and exist primarily
// as flavor: realistic-looking entries that fill the column.
// ============================================

import { ARTIFACT_TITLE } from '../Playbooks/constants';

/**
 * Avatar styling for a row's author.
 *
 * - `initial` paints a solid-colored circle with the first letter of the
 *   author's name in white. `color` is the circle fill.
 * - `sundial` paints the Sundial brand glyph on a dark teal background;
 *   used for system-generated artifacts.
 * - `photo` is a placeholder for "this author has a profile photo we
 *   don't have access to": renders a neutral grey circle with no glyph,
 *   matching how the dim photo reads in the source screenshot.
 */
export type AvatarSpec =
  | { kind: 'initial'; color: string }
  | { kind: 'sundial' }
  | { kind: 'photo' };

export type ArtifactRowData = {
  title: string;
  /** Optional internal playbook this artifact was produced by. */
  playbook?: string;
  author: {
    name: string;
    avatar: AvatarSpec;
  };
};

// Author avatar palette. Approximates the source screenshot:
//   Sean Dy        -> soft mauve  (light)
//   Pin            -> brand purple
//   Long Yin Luk   -> deep teal   (dark)
//   David Wang     -> photo placeholder (neutral grey)
//   Sundial        -> sundial brand glyph
const SEAN: AvatarSpec = { kind: 'initial', color: '#C18BC4' };
const PIN: AvatarSpec = { kind: 'initial', color: '#A871EB' };
const LONG_YIN_LUK: AvatarSpec = { kind: 'initial', color: '#1F6B5C' };
const DAVID: AvatarSpec = { kind: 'photo' };
const SUNDIAL: AvatarSpec = { kind: 'sundial' };

export const ARTIFACTS_ANGLE2: ArtifactRowData[] = [
  // Top row links to the right-hand viewer (selected).
  {
    title: ARTIFACT_TITLE,
    playbook: 'Long Term Metric Change',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'GMV Data Quality: Missing Miles Currency Misattribution',
    playbook: 'Data Quality Assessment',
    author: { name: 'Sean Dy', avatar: SEAN },
  },
  {
    title: 'SG New User Mile Transaction Analysis (Mar–Apr 2026)',
    playbook: 'Long Term Metric Change',
    author: { name: 'David Wang', avatar: DAVID },
  },
  {
    title: 'Full Upstream Lineage — user_entity_dimensions',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title:
      'Shop with Max — April Softness Analysis: Agoda vs Travel OTAs vs All Shop',
    playbook: 'change anomalies',
    author: { name: 'Pin', avatar: PIN },
  },
  {
    title: 'Aha Moment Analysis: Workspace D7 Activation',
    playbook: 'Aha Moment',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'User Deletion Consistency Analysis – dim_users',
    playbook: 'Data Quality Assessment',
    author: { name: 'Sean Dy', avatar: SEAN },
  },
  {
    title: 'HK Bill Payment Campaign Dashboard',
    author: { name: 'Long Yin Luk', avatar: LONG_YIN_LUK },
  },
  {
    title: 'dim_redemptions vs dim_redemptions_v3 — Data Quality Comparison',
    playbook: 'Data Quality Assessment',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'CF Returns for Miles — Analysis (BD Ref: BDR-recaWptP1CdxvJ6WM)',
    author: { name: 'Sean Dy', avatar: SEAN },
  },
  {
    title: 'Marketing Funnel Analysis by Merchant (Last 84 Days)',
    playbook: 'Funnel Analysis',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'Top 3 Accounts: Product Health Deep Dive',
    playbook: 'Aha Moment',
    author: { name: 'Long Yin Luk', avatar: LONG_YIN_LUK },
  },
  {
    title: 'Flight Search Patterns Around Iran War (Feb 28, 2026)',
    playbook: 'change anomalies',
    author: { name: 'Long Yin Luk', avatar: LONG_YIN_LUK },
  },
  {
    title: 'Flight Search Behaviour Analysis: Impact of Iran War (Feb 28, 2026)',
    playbook: 'Funnel Analysis',
    author: { name: 'Long Yin Luk', avatar: LONG_YIN_LUK },
  },
  {
    title: 'MAU Dip Root Cause: page:view Events Collapsed Sep 15–25',
    playbook: 'change anomalies',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'Redemption Spike Analysis — March 25, 2026',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
  {
    title: 'WTU/MTU Ratio Decline Analysis',
    playbook: 'Long Term Metric Change',
    author: { name: 'Sundial', avatar: SUNDIAL },
  },
];
