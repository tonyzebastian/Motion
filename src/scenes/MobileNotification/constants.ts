// ============================================
// Colors
// ============================================

export const COLORS = {
  // Mobile screen
  background: '#f8eedb',
  timeText: '#6e3e3e',
  
  // Notification card
  cardBg: 'rgba(255, 255, 255, 0.88)',
  cardBorder: 'rgba(255, 255, 255, 1)',
  
  // Text
  appName: '#665beb',
  timestamp: '#a8a8a8',
  messageText: '#000000',
  
  // CTA
  ctaText: '#a43df5',
  
  // Chart (matching ChatToDAU scene)
  chartBg: '#fff6f6',
  chartLine: '#ff5d39',           // Red for decline
  chartLineShadow: 'rgba(255, 93, 57, 0.3)',
  chartGridLine: 'rgba(0, 0, 0, 0.1)',
  chartAxisText: 'rgba(0, 0, 0, 0.5)',
};

// ============================================
// Timing (in frames at 30 FPS)
// ============================================

export const TIMING = {
  // Phase 1: Notification slides in (collapsed)
  notificationSlideStart: 10,
  notificationSlideEnd: 35,
  
  // Phase 2: Notification expands
  expandStart: 45,
  expandEnd: 75,
  
  // Phase 3: Chart grid and numbers animate first
  chartGridStart: 70,
  chartGridEnd: 100,
  
  // Phase 4: Chart trendline animates after grid
  chartLineStart: 95,
  chartLineEnd: 140,
  
  // Phase 5: CTA appears after chart line is almost done
  ctaStart: 130,
  
  // Total duration
  totalDuration: 160,
};

// ============================================
// Content
// ============================================

export const CONTENT = {
  time: '12:53',
  date: 'FRIDAY, FEBRUARY 17',
  appName: 'Sundial',
  timestamp: 'now',
  message: 'Your DAU reduced by 25% this last quarter.',
  ctaText: 'Understand The Cause',
};

// ============================================
// Chart Data
// ============================================

export const CHART_DATA = {
  points: [
    { month: 'Jan', value: 52.5 },
    { month: 'Feb', value: 51.2 },
    { month: 'Mar', value: 49.8 },
    { month: 'Apr', value: 48.5 },
    { month: 'May', value: 46.2 },
    { month: 'Jun', value: 45.8 },
    { month: 'Jul', value: 44.1 },
    { month: 'Aug', value: 42.5 },
    { month: 'Sep', value: 41.8 },
    { month: 'Oct', value: 40.5 },
    { month: 'Nov', value: 39.8 },
    { month: 'Dec', value: 39.4 },
  ],
  yAxisMax: 55,
  yAxisMin: 35,
  yAxisSteps: [35, 40, 45, 50, 55],
};

// ============================================
// Layout
// ============================================

export const LAYOUT = {
  // Scene is now mobile-sized
  sceneWidth: 360,
  sceneHeight: 780,
  
  // Time display
  timeTop: 65,
  timeFontSize: 90,
  
  // Date display (more spacing from time)
  dateTop: 175,
  dateFontSize: 16,
  dateLetterSpacing: 1.4,
  
  // Notification card
  notificationWidth: 340,
  notificationLeft: 10, // Centered: (360 - 340) / 2
  notificationTop: 220,
  notificationBorderRadius: 12,
  
  // Collapsed notification height (header + message text + bottom padding)
  collapsedHeight: 110,
  
  // Expanded notification height (header + message + chart + CTA)
  expandedHeight: 285,
  
  // Chart dimensions (inside notification)
  chartWidth: 308,
  chartHeight: 130,
  chartPadding: 16,
};
