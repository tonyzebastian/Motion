// ============================================
// Colors
// ============================================

export const COLORS = {
  background: '#fdf6f0',
  cardBg: '#ffffff',
  text: '#1a1a1a',
  textMuted: 'rgba(0, 0, 0, 0.6)',
  textLight: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(0, 0, 0, 0.08)',
  purple: '#a43df5',
  purpleLight: 'rgba(164, 61, 245, 0.1)',
  
  // Chart colors (from Figma)
  chartBg: '#fff6f6',
  barPurple: '#a43df5',   // Start/End DAU bars
  barRed: '#ff5d39',      // Decline (Android App)
  barTeal: '#119f97',     // Positive contributors
  axisLine: 'rgba(0, 0, 0, 0.1)',
  
  // Heading highlight
  highlightBg: 'rgba(0, 0, 0, 0.04)',
};

// ============================================
// Timing (in frames at 30 FPS)
// ============================================

export const TIMING = {
  // Phase 1: Bubble appears centered
  bubbleAppearStart: 0,
  bubbleAppearEnd: 15,
  
  // Phase 2: Bubble moves up
  bubbleMoveStart: 30,
  bubbleMoveEnd: 70,
  
  // Phase 3: Status indicators
  indicatorStart: 70,           // First indicator appears with jumping dots
  indicator1CompleteAt: 115,    // First indicator shows checkmark
  indicator2Start: 115,         // Second indicator appears when first completes
  indicator2CompleteAt: 160,    // Second indicator shows checkmark
  indicatorFadeStart: 160,
  indicatorFadeEnd: 180,
  
  // Phase 4: Heading appears
  headingStart: 180,
  headingEnd: 210,
  
  // Phase 5: Chart card entrance
  chartEntranceStart: 200,
  chartEntranceEnd: 250,
  
  // Phase 6: Bar animations (staggered)
  barsAnimateStart: 220,
  barsAnimateEnd: 300,
  barStaggerDelay: 8,           // Frames between each bar animation
  
  // Phase 7: Highlight appears (after all bars visible)
  highlightStart: 290,          // After last bar animation completes
};

// ============================================
// Content
// ============================================

export const CHAT_PROMPT = 'What caused the change in DAU this month?';

// Status indicator messages (different text for active vs complete states)
export const STATUS_MESSAGES = {
  step1Active: 'Identifying Daily Active Users to analyze',
  step1Complete: 'Identified Daily Active Users to analyze',
  step2Active: 'Comparing all drivers and generating visualizations',
  step2Complete: 'Compared all drivers and generated visualizations',
};

// Insight heading content
export const INSIGHT_HEADING = {
  highlight: 'Android App',
  text: 'contributed the most to decline in DAU this month',
};

// ============================================
// Chart Data
// ============================================

export const CHART_DATA = {
  bars: [
    { 
      label: 'Daily Active Users\non May 01', 
      value: 52.5, 
      displayValue: '52.5K',
      color: 'purple',
      isTotal: true,
    },
    { 
      label: 'Android App', 
      value: -37.5, 
      displayValue: '-37.5K',
      color: 'red',
      isTotal: false,
    },
    { 
      label: 'iOS App', 
      value: 15.2, 
      displayValue: '+15.2K',
      color: 'teal',
      isTotal: false,
    },
    { 
      label: 'Mobile Website', 
      value: 7.3, 
      displayValue: '+7.3K',
      color: 'teal',
      isTotal: false,
    },
    { 
      label: 'Other Platforms', 
      value: 7.7, 
      displayValue: '+7.7K',
      color: 'teal',
      isTotal: false,
    },
    { 
      label: 'Daily Active Users\non May 31', 
      value: 45.2, 
      displayValue: '45.2K',
      color: 'purple',
      isTotal: true,
    },
  ],
  yAxisMax: 60,
  yAxisSteps: [0, 15, 30, 45, 60],
};

// ============================================
// Layout
// ============================================

export const LAYOUT = {
  sceneWidth: 1200,
  sceneHeight: 900,
  
  // Chat bubble
  chatBubbleWidth: 420,         // Wider for longer text
  chatBubbleCenterY: 400,       // Center position
  chatBubbleTopY: 200,          // Top position after move
  chatBubbleLeft: 80,           // Left margin
  
  // Status indicators
  statusIndicatorTop: 290,      // Below bubble when it's at top
  
  // Heading
  headingTop: 292,              // From Figma design
  headingLeft: 80,
  
  // Chart card
  chartCardWidth: 804,
  chartCardLeft: 80,
  chartCardTop: 344,            // Below heading
  chartHeight: 340,
  
  padding: 40,
};
