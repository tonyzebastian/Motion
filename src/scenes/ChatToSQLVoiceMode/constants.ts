// ============================================
// Colors
// ============================================

export const COLORS = {
  background: '#fdf6f0',
  cardBg: '#ffffff',
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#999999',
  border: 'rgba(0, 0, 0, 0.08)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  purple: '#a43df5',
  purpleLight: 'rgba(164, 61, 245, 0.1)',
  
  // SQL syntax highlighting (from Figma)
  sqlBg: '#f8f8fa',
  sqlKeyword: '#2372e9',      // Blue for SELECT, FROM, WHERE, etc.
  sqlIdentifier: '#fd2b68',   // Pink for timestamp, country, etc.
  sqlText: 'rgba(0, 0, 0, 0.7)',
  sqlComment: '#6a737d',
  sqlString: '#22863a',
  
  // Data preview colors (from Figma)
  dataPreviewBg: '#fdf8fa',
  dataHeaderBg: '#f9f4f4',
  dataRowBg: '#faf7f7',
  
  // Heading highlight (from ChatToDAU)
  highlightBg: 'rgba(0, 0, 0, 0.04)',
};

// ============================================
// Timing (in frames at 30 FPS)
// ============================================

export const TIMING = {
  // Phase 1: Cursor blink before typing
  cursorBlinkStart: 0,
  cursorBlinkEnd: 30,
  
  // Phase 2: Typing animation (faster now)
  typingStart: 30,
  typingEnd: 90,
  charsPerFrame: 1.0, // Faster typing
  
  // Post-typing pause before transition
  postTypingDelay: 3,
  
  // Phase 3: Transition - chat input morphs to bubble
  transitionStart: 93,
  transitionEnd: 133,
  
  // Phase 4: Status indicators (after bubble transition completes)
  indicatorStart: 133,        // First indicator appears with jumping dots
  indicator1CompleteAt: 170,  // First indicator shows checkmark (slower - ~1.2s)
  indicator2Start: 170,       // Second indicator appears when first completes
  indicator2CompleteAt: 210,  // Second indicator shows checkmark (slower - ~1.3s)
  indicatorFadeEnd: 225,      // Both indicators fade out
  
  // Phase 5: SQL card entrance (when status indicators complete)
  sqlEntranceStart: 210,
  sqlEntranceEnd: 250,
  
  // Phase 6: SQL streaming (starts slightly after card begins to appear)
  sqlStreamStart: 220,
  sqlStreamEnd: 300,
  sqlCharsPerFrame: 3,  // Fast streaming
  
  // Phase 7: Brief pause, then Table reveals FIRST, then SQL collapses
  tableRevealStart: 320,
  tableRevealEnd: 345,
  collapseStart: 325,
  collapseEnd: 335,
  
  // Phase 8: Snapshot message appears during SQL collapse
  snapshotStart: 325,
  
  // Cursor blink rate
  cursorBlinkFrames: 16,
};

// ============================================
// Content
// ============================================

export const CHAT_PROMPT = 'How many power users care about voice mode?';

// Status indicator messages (different text for active vs complete states)
export const STATUS_MESSAGES = {
  step1Active: 'Identifying the correct table',
  step1Complete: 'Identified the correct tables',
  step2Active: 'Reading SQL documentation',
  step2Complete: 'Read SQL documentation (3 docs)',
};

export const SQL_CONTENT = `SELECT 
    user_segment,
    COUNT(DISTINCT user_id) AS users,
    ROUND(
        COUNT(DISTINCT user_id) * 100.0 / 
        total_users, 1
    ) AS pct_of_segment
FROM feature_usage f
JOIN user_segments u ON f.user_id = u.user_id
JOIN segment_totals t ON u.segment = t.segment
WHERE feature = 'voice_mode'
  AND used_at >= CURRENT_DATE - 30
GROUP BY user_segment
ORDER BY pct_of_segment DESC`;

// ============================================
// Snapshot Message
// ============================================

export const SNAPSHOT_MESSAGE = {
  highlight: '12.8k',
  text: ' power users which is 34% of the segment',
};

// ============================================
// Table Data (matches SQL output - voice mode usage by segment)
// ============================================

export const TABLE_DATA = {
  headers: ['user_segment', 'users', '% of segment'],
  rows: [
    { user_segment: 'Power Users', users: '12,847', '% of segment': '34%' },
    { user_segment: 'Pro Users', users: '9,234', '% of segment': '28%' },
    { user_segment: 'Regular Users', users: '28,412', '% of segment': '18%' },
    { user_segment: 'Free Tier', users: '15,678', '% of segment': '12%' },
    { user_segment: 'New Users', users: '5,203', '% of segment': '9%' },
    { user_segment: 'Churned', users: '892', '% of segment': '4%' },
  ],
};

// ============================================
// Layout
// ============================================

export const LAYOUT = {
  sceneWidth: 1200,
  sceneHeight: 900,
  chatInputWidth: 600,
  chatBubbleWidth: 400,   // Final bubble width (wider for longer text)
  chatBubbleLeft: 80,     // Left margin for chat bubble (same as SQL card)
  chatBubbleY1: 350,      // First position (after first transition)
  chatBubbleY2: 225,      // Second position (when SQL card appears below)
  statusIndicatorTop: 310, // Position for status indicators (below bubble with more spacing)
  sqlCardWidth: 804,      // Card width
  sqlCardLeft: 80,        // Left margin for SQL card
  sqlCardTop: 300,        // SQL card Y position
  padding: 40,
};
