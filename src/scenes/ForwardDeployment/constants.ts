export const COLORS = {
  background: '#fdf6f0',
  cardBg: '#ffffff',
  contentBg: '#fdf7fa',
  sundial: '#a43df5',
  diy: '#119f97',
  divider: 'rgba(0, 0, 0, 0.08)',
  labelText: 'rgba(0, 0, 0, 0.5)',
  annotationText: 'rgba(255, 255, 255, 0.95)',
  text: '#000000',
};

export const LAYOUT = {
  sceneWidth: 600,
  sceneHeight: 600,

  cardWidth: 532,
  cardTop: 106,
  cardPadding: 24,
  cardBorderRadius: 24,

  contentWidth: 484,
  contentHeight: 337,
  contentBorderRadius: 9.6,

  chartLeft: 21,
  chartTop: 54,
  chartWidth: 448,
  chartHeight: 258,

  barHeight: 32,
  barBorderRadius: 12,
  sundialBarY: 55,
  diyBarY: 138,

  trackStartX: 14,
  trackWidth: 404,

  dividerWidth: 0.9,
  dividerHeight: 240,

  legendTop: 22,
  legendSwatchSize: 12,
  legendSwatchRadius: 2,
  legendSwatchGap: 8,
  legendItemGap: 29,
  legendFontSize: 12.6,
  legendLetterSpacing: -0.5,

  milestoneFontSize: 11.7,
  milestoneLabelY: 243,

  annotationFontSize: 11,
};

export const MILESTONES = [
  { label: 'Start', x: 14, pct: 0 },
  { label: 'Connect', x: 87, pct: 20 },
  { label: 'Model', x: 163, pct: 40 },
  { label: 'Context', x: 238, pct: 60 },
  { label: 'Playbooks', x: 324, pct: 80 },
  { label: 'Self-Serve', x: 418, pct: 100 },
] as const;

export const TIMING = {
  // Entrance
  entranceMilestonesStart: 0,
  entranceMilestonesEnd: 12,
  entranceLegendStart: 5,
  entranceLegendEnd: 15,

  // Bar phases (shifted +15 for entrance)
  phase1Start: 15,
  phase1End: 30,
  phase2Start: 30,
  phase2End: 60,
  phase3Start: 60,
  phase3End: 70,
  phase4Start: 70,
  phase4SundialEnd: 105,
  phase4DiyEnd: 140,

  // Hold + annotation
  holdStart: 105,
  annotationFadeInStart: 108,
  annotationFadeInEnd: 118,

  // Staggered exit (bars first, then legend, then milestones)
  exitBarsStart: 145,
  exitBarsEnd: 155,
  exitLegendStart: 152,
  exitLegendEnd: 160,
  exitMilestonesStart: 158,
  exitMilestonesEnd: 166,

  restEnd: 180,
};

export const ANIMATION = {
  sundialKeyframes: {
    frames: [15, 30, 60, 70, 105],
    values: [0, 20, 60, 75, 100],
  },
  diyKeyframes: {
    frames: [15, 30, 150],
    values: [0, 20, 42],
  },
  checkpointPulseDuration: 8,
};
