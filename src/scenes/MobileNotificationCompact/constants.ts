// ============================================
// Colors
// ============================================

export const COLORS = {
  // Mobile screen
  background: '#f8eedb',
  timeText: '#6e3e3e',
  
  // Notification card
  cardBg: '#ffffff',
  cardBorder: 'rgba(255, 255, 255, 1)',
  
  // Text
  appName: '#665beb',
  timestamp: '#a8a8a8',
  messageText: '#000000',
};

// ============================================
// Timing (in frames at 30 FPS)
// ============================================

export const TIMING = {
  // Staggered notification slide-in timing
  // Each notification slides in ~25 frames after the previous
  notification1SlideStart: 10,
  notification2SlideStart: 35,
  notification3SlideStart: 60,
  
  // Slide duration (spring animation handles this, but ~25 frames each)
  slideDuration: 25,
  
  // Total duration
  totalDuration: 120,
};

// ============================================
// Content
// ============================================

export const CONTENT = {
  time: '12:53',
  date: 'FRIDAY, FEBRUARY 17',
  appName: 'Sundial',
  timestamp: 'now',
  
  // Three different notification messages
  notifications: [
    'Your DAU reduced by 25% this last quarter.',
    'Revenue increased 15% compared to last month.',
    'User retention is down 10% week over week.',
  ],
};

// ============================================
// Layout
// ============================================

export const LAYOUT = {
  // Scene dimensions (reduced height)
  sceneWidth: 360,
  sceneHeight: 550,
  
  // Time display
  timeTop: 35,
  timeFontSize: 90,
  
  // Date display
  dateTop: 145,
  dateFontSize: 16,
  dateLetterSpacing: 1.4,
  
  // Notification card
  notificationWidth: 340,
  notificationLeft: 10, // Centered: (360 - 340) / 2
  notificationTop: 185, // First notification position
  notificationBorderRadius: 12,
  
  // Card height (header + message + bottom padding, no chart/CTA)
  cardHeight: 120,
  
  // Stacking overlap (iOS-style)
  stackOverlap: 18,
  
  // Larger logo size
  logoSize: 24,
  
  // Larger font sizes
  appNameFontSize: 18,
  messageFontSize: 20,
};
