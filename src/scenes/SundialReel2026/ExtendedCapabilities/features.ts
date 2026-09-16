export interface Feature {
  id: string;
  title: string;
  description: string;
  // CSS grid-area name (see BENTO_AREAS in index.tsx).
  area: string;
}

// Reveal order = array order; the "And much more" card renders separately and
// reveals last. The bento is a balanced 4-col x 4-row ring around the centered
// brand block: wide bars top (Connectors) + bottom (And much more), tall cards
// on the sides, small cards in the corners.
//
//   dashboards    [     Connectors      ]   artifacts
//   observability [      Sundial AI     ]   applied
//   observability [    Also ships with  ]   applied
//   evals         [    And much more    ]   git
export const FEATURES: Feature[] = [
  {
    id: 'integrations',
    title: 'Connectors',
    description:
      'Meet your team where they work — Slack, Teams, or any AI agent like Claude or Codex via MCP.',
    area: 'mcp',
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    description: 'Replicate your past dashboards with ease.',
    area: 'dashboards',
  },
  {
    id: 'artifacts',
    title: 'Artifacts',
    description: 'Rich HTML reports, refreshable on a cadence.',
    area: 'artifacts',
  },
  {
    id: 'observability',
    title: 'Observability',
    description: 'See what your org is asking and how trusted the answers are.',
    area: 'observability',
  },
  {
    id: 'applied-ai-team',
    title: 'Applied AI Team',
    description:
      'Former data leaders who set up your metrics, playbooks, and context in your first 30 days.',
    area: 'applied',
  },
  {
    id: 'evals',
    title: 'Evals',
    description: 'Test context changes without breaking what works.',
    area: 'evals',
  },
  {
    id: 'git-context',
    title: 'Git-backed context',
    description: 'Playbooks and metrics version-controlled like code.',
    area: 'git',
  },
];
