// ============================================
// Colors
// ============================================

export const COLORS = {
  white: '#ffffff',
  black: '#000000',

  // Brand
  purple: '#A43DF5',
  purpleLight: 'rgba(164, 61, 245, 0.1)',

  // Pulsing dot variants (status colors). Each pairs with the slight white
  // outline applied in PulsingDot to make the core dot pop on any backdrop.
  dotPurple: '#A43DF5',
  dotGreen: '#2BC68C',
  dotRed: '#EF4444',

  // Browser chrome
  chrome: '#f2f2f2',
  iconStroke: '#737373',
  addressText: '#4c4c4c',
  headerBorder: 'rgba(0, 0, 0, 0.06)',

  // Text
  text: '#000000',
  textMuted: 'rgba(0, 0, 0, 0.5)',
};

// ============================================
// Shared backgrounds
// ============================================

// Approximation of the Figma body gradient (node 563:494):
// - Peach radial anchored top-left, fading to a soft blue across the canvas
// - Light pink-lavender radial anchored top-right, fading to transparent
// - 20% white wash on top to soften the whole thing
//
// The fallback solid color (BODY_BACKGROUND_FALLBACK) matches the
// pink-lavender corner so any unpainted area reads as part of the same
// surface.
export const BODY_BACKGROUND = [
  'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))',
  'radial-gradient(ellipse 90% 80% at top right, rgba(255, 244, 254, 1) 0%, rgba(255, 244, 254, 0) 70%)',
  'radial-gradient(ellipse 130% 100% at top left, rgba(255, 235, 221, 1) 0%, rgba(232, 241, 255, 1) 100%)',
].join(', ');

export const BODY_BACKGROUND_FALLBACK = '#fdf4fe';

// Corner-focused white wash for the artifact panel. A radial scrim
// anchored at the TOP LEFT lets just that one corner read as cool-tinted
// and keeps the rest of the panel as a near-white "page" surface. The
// top-left stop is partially transparent (not 0) so even the visible
// corner color stays soft and muted -- the cool tint reads as a hint,
// not a saturated wash.
export const ARTIFACT_PANEL_WHITE_WASH =
  'radial-gradient(ellipse 85% 75% at top left, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.78) 45%, rgba(255, 255, 255, 0.96) 85%)';

// Cool-only variant of BODY_BACKGROUND for the right (artifact) panel.
// Same gradient structure as the chat side (radial at the inner corner,
// large radial sweeping in from the outer corner) but the warm peach +
// pink-lavender stops are replaced with cool periwinkle/sky-blue stops
// so the panel reads as a quieter, more "analytical" surface next to the
// warmer chat column.
export const ARTIFACT_PANEL_BACKGROUND = [
  'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))',
  'radial-gradient(ellipse 90% 80% at top left, rgba(228, 232, 255, 1) 0%, rgba(228, 232, 255, 0) 70%)',
  'radial-gradient(ellipse 130% 100% at top right, rgba(216, 226, 252, 1) 0%, rgba(232, 241, 255, 1) 100%)',
].join(', ');

// ============================================
// Layout
// ============================================

export const LAYOUT = {
  // Composition
  sceneWidth: 1280,
  sceneHeight: 900,

  // Window padding (Screen-Studio style inset, vertically centered)
  windowPaddingX: 80,
  windowPaddingTop: 90,
  windowPaddingBottom: 90,

  // Browser chrome
  headerHeight: 52,
  windowRadius: 14,

  // Address bar
  addressBarHeight: 30,
  addressBarRadius: 7,

  // Agenda screen body
  agendaWidth: 800,
  agendaCardRadius: 16,
  agendaCardPadding: 16,

  // Phase 2 (conversation view) positions, relative to body container.
  // Header sits 20px from the top of the body; the chat bubble follows
  // ~24px below the header text (tight, like a chat thread) so the
  // conversation block reads as a single composition rather than two
  // separated rows. Shifting these shifts responseColumnTop in lockstep.
  bubbleWidth: 800,
  conversationHeaderTop: 20,
  conversationBubbleTop: 72,
  // Top of the column that holds the agent response + thinking block
  // (sits just below the chat bubble). The thinking block is pushed down
  // by the response text as it streams in.
  responseColumnTop: 138,
  responseColumnGap: 16,
  // The conversation column is wrapped in a fixed-height viewport so
  // Phase 5 content can scroll within it. This is the inset between the
  // viewport's bottom edge and the body's bottom edge -- chosen so the
  // viewport ends ~16px above the follow-up input docked at the bottom.
  conversationViewportBottom: 94,

  // Follow-up input docked at the bottom of the body
  followUpWidth: 600,
  followUpBottom: 24, // distance from body bottom edge

  // Phase 4: playbook search reel
  reelRowPitch: 28, // px between consecutive row centers
  reelVisibleRows: 3, // focus row + 2 upcoming peeks below
  reelViewportHeight: 84, // reelRowPitch * reelVisibleRows
  reelTopGap: 2, // gap between the "Searching..." label and the reel

  // Phase 7: split-screen artifact viewer. The browser body splits into
  // a contracted left (chat) column and a new right (artifact) panel.
  // bodyContentWidth = sceneWidth - windowPaddingX*2 = 1120.
  //
  // splitGap is the 1px divider line BETWEEN the two columns -- there's
  // no breathing room around it; the divider itself is the separation.
  // Within the left column, leftColPaddingSplit reserves horizontal
  // breathing room so the chat content doesn't touch the column edges.
  bodyContentWidth: 1120,
  splitGap: 1,
  // 55:45 split (chat : artifact). 1119px usable after the 1px divider.
  leftColWidthSplit: 615,
  leftColPaddingSplit: 20, // inset for the chat content inside the col
  rightPanelWidth: 504, // bodyContentWidth - leftColWidthSplit - splitGap
  artifactToolbarHeight: 48,
};

// ============================================
// Timing (in frames at 30 FPS)
// ============================================

export const TIMING = {
  cursorBlinkFrames: 16,

  // Phase 1: mouse enters, clicks the input, types the question
  mouseEnterStart: 6,
  mouseEnterEnd: 36, // cursor reaches target
  mouseClickFrame: 38, // visual "click" pulse
  inputFocusStart: 38, // input adopts focused styles
  inputFocusDuration: 6, // frames over which focus styles fade in
  typingStart: 46,
  typingEnd: 110, // 64-frame typing window for the 61-char question

  // Screen-Studio-style zoom around the click point
  zoomInStart: 38,
  zoomInEnd: 56, // ~18 frames, snappy ease-out
  zoomOutStart: 128, // hold ~18 frames after typing ends
  zoomOutEnd: 146,

  // Phase 2: morph agenda view into conversation view.
  // The chat bubble is stacked on top of the input at the same Y from the
  // start. Both translate up together at the same speed; a quick cross-fade
  // at the midpoint swaps the input out for the bubble. This makes the
  // morph feel seamless (no pause between text-field and bubble motion).
  phase2Start: 160, // ~0.5s hold after zoom-out completes (146)
  titleFadeStart: 160,
  titleFadeEnd: 168, // fast title slide-up
  morphStart: 160, // input + bubble start translating together
  morphEnd: 172, // both arrive at the bubble's final Y (12 frames, fast)
  inputFadeOutStart: 163, // cross-fade right around the midpoint of motion
  inputFadeOutEnd: 169,
  bubbleAppearStart: 163,
  bubbleAppearEnd: 169,
  headerFadeStart: 172, // header arrives right after the bubble settles
  headerFadeEnd: 180,
  thinkingFadeStart: 180,
  thinkingFadeEnd: 194,
  // Follow-up input docks at the bottom of the body, fading in around the
  // same time as the thinking block so the conversation chrome assembles
  // together.
  followUpFadeStart: 180,
  followUpFadeEnd: 196,

  // Phase 3: agent response streams in as typed text above the thinking block.
  // Wait ~0.5s after thinking is in place, then stream the ~173-char response
  // over ~1.9s (57 frames, ~3 chars/frame average).
  responseTypingStart: 209,
  responseTypingEnd: 266,
  // Mid-response, animate the header title from "New conversation" to the
  // generated topic title.
  headerTitleRenameStart: 232,
  headerTitleRenameEnd: 248,

  // Phase 4: agent searches a library of playbooks (skills). The thinking
  // label morphs from "Thinking..." to "Searching for relevant playbook", a
  // 3-row reel opens beneath it and scrolls through 8 playbooks, pausing on
  // each one with a shimmer. When the match settles in the focus slot it
  // gets highlighted, then lifts out as a chip while the reel collapses.
  // Finally a follow-up agent line is typed in below.
  phase4Start: 280, // ~14f hold after the response finishes at 266
  // Card flip from "Thinking..." to "Searching for relevant playbook".
  // 20 frames lets the rotation read as a physical motion (vs the previous
  // 14f cross-fade) without feeling slow.
  searchLabelStart: 280,
  searchLabelEnd: 300,
  // Small beat between the flip landing and the reel unfurling so the
  // viewer registers "Searching..." before the list appears.
  reelOpenStart: 310,
  reelOpenEnd: 324,
  reelCycleStart: 324, // first playbook enters the focus slot
  reelPlaybookInterval: 16, // frames between consecutive playbooks centering
  reelHoldFrames: 10, // how long each miss stays centered before scrolling on
  // matchHoldStart = reelCycleStart + (PLAYBOOKS.length - 1) * reelPlaybookInterval
  matchHoldStart: 436, // match playbook reaches the focus slot
  matchHoldEnd: 469, // ~33f hold so the audience reads the matched name
  matchAcquiredStart: 469, // chip fades in + reel collapses + label fades out
  matchAcquiredEnd: 486,
  followupTypingStart: 496, // beat after the chip settles, then type the reply
  // ~170-char reply typed at roughly the same cadence as the main response
  // (~3 chars/frame). 496 -> 554 = 58 frames.
  followupTypingEnd: 554,
  // After the follow-up text finishes typing, the "Thinking..." state
  // returns BELOW the typed text -- the agent has confirmed the load,
  // delivered its reply, and is now thinking about the next step.
  thinkingReturnStart: 562,
  thinkingReturnEnd: 576,

  // Phase 4 camera move: zoom in right when "Searching for relevant
  // playbook" appears, hold zoomed through the reel cycle until the match
  // is acquired, then zoom back out as the chip lifts up. This frames the
  // "selection moment" as the climax of the search and pulls back to show
  // the next reply being composed. Same focus point and easing as Phase 1.
  searchZoomInStart: 280,
  searchZoomInEnd: 298,
  searchZoomOutStart: 469, // matches matchAcquiredStart (chip lift)
  searchZoomOutEnd: 487,

  // Phase 5: agent "works the playbook" -- alternating narration paragraphs
  // and tool-call rows inside an auto-scrolling viewport. Step 1 begins ~12
  // frames after the Phase 4 returning "Thinking..." (at 576) appears.
  //
  // Each running sub-row in a grouped tool step finishes its shimmer pass
  // BEFORE the next sub-row appears, with a brief hold after the last
  // sub-row settles. Then the group collapses INSTANTLY to a single
  // done-state row -- no slide-up or cross-fade.
  //   subCount=2 (Searched context): 70-frame window
  //   subCount=3 (Queried measures, Ran calculation): 95-frame window
  //   Single-shot Step 8 (Created artifact): 30-frame window -- fades in
  //   "Creating artifact" with a shimmer sweep, then flips to the done
  //   label `Created artifact '...'` for the remainder of the window.
  phase5Start: 580,
  phase5Step1TypingStart: 588,
  phase5Step1TypingEnd: 620,
  phase5Step2ToolStart: 624,
  phase5Step2ToolEnd: 694, // grouped (Searched context, 2 sub-rows, 70f)
  phase5Step3TypingStart: 706,
  phase5Step3TypingEnd: 772,
  phase5Step4ToolStart: 780,
  phase5Step4ToolEnd: 875, // grouped (Queried measures, 3 sub-rows, 95f)
  phase5Step5TypingStart: 887,
  phase5Step5TypingEnd: 927,
  phase5Step6ToolStart: 935,
  phase5Step6ToolEnd: 1030, // grouped (Ran calculation, 3 sub-rows, 95f)
  phase5Step7TypingStart: 1042,
  phase5Step7TypingEnd: 1064,
  phase5Step8ToolStart: 1072,
  phase5Step8ToolEnd: 1102, // single-shot w/ running shimmer (30f window)
  // After the row flips to its done label we linger briefly, then fade in
  // the actual artifact card just below.
  phase5Step8CardStart: 1118,
  phase5Step8CardEnd: 1134,
  phase5End: 1160,

  // Phase 7: split-screen artifact viewer. Fires as soon as the artifact
  // card finishes fading in. The right panel slides in from the right
  // edge while the left column contracts to LAYOUT.leftColWidthSplit.
  // Phase 6 (collapse + bubble re-fade + streamed response + footer)
  // is delayed by 4f so it starts AFTER the split has fully settled.
  phase7Start: 1134,            // split opens (== phase5Step8CardEnd)
  phase7SplitOpenEnd: 1158,     // right panel finished sliding in

  // Phase 6: artifact handoff. The card has surfaced; the "Thinking..."
  // dot returns underneath it (we re-open the Step 8 hide window early
  // for this). After a brief linger, everything ABOVE the card collapses
  // INSTANTLY into a single grouped tool row, the chat bubble fades back
  // in at the top, and the agent streams a fresh dashboard description
  // below the card. A feedback footer fades in once the stream lands.
  // All Phase 6 timings are +4f vs. the pre-Phase-7 plan to give the
  // split a 4-frame breather before the collapse fires.
  phase6Start: 1162,            // instant collapse + bubble re-fade begins
  phase6BubbleFadeEnd: 1174,    // chat bubble fully back at opacity 1
  phase6StreamStart: 1176,      // dashboard response begins typing
  phase6StreamEnd: 1256,        // dashboard response finishes streaming
  phase6FooterFadeStart: 1262,  // "Was this response useful?" fades in
  phase6FooterFadeEnd: 1274,    // footer fully visible
  phase6End: 1294,              // scene endpoint (with a small tail)
};

// ============================================
// Zoom (matches BrowserWindow's zoom/focusX/focusY API)
// ============================================

export const ZOOM = {
  level: 1.4,
  // Minimum gap (in scene-space px) between the zoomed window's top/left
  // edge and the scene's top/left edge. Keeps some background visible.
  minEdgeMargin: 40,
};

// ============================================
// Phase 1 content
// ============================================

export const TYPED_QUESTION =
  'What are the biggest opportunities for long term user growth?';

// ============================================
// Phase 3 content
// ============================================

export const AGENT_RESPONSE =
  "I'll investigate what drove the changes in Weekly Active Users this week. Let me start by loading the relevant playbook and searching for the right measures and dimensions.";

export const HEADER_TITLES = {
  initial: 'New conversation',
  final: 'Long-term user growth opportunities',
};

// ============================================
// Phase 4 content: library of playbooks the agent "searches" through.
// Order matters: it's the order they appear in the reel. The last entry is
// the one the agent picks, so the audience watches a few misses scroll past
// before the match settles in.
// ============================================

export const PLAYBOOKS: string[] = [
  'Marketing Weekly',
  'Funnel Analysis',
  'Engagement Analysis',
  'Cohort Retention',
  'Trend Shift',
  'Activation Drop',
  'Metric Change',
  'Long Term Metric Change',
];

export const MATCHED_PLAYBOOK_INDEX = PLAYBOOKS.length - 1;

export const SEARCH_LABEL = {
  initial: 'Thinking...',
  final: 'Searching for relevant playbook',
};

export const AGENT_FOLLOWUP =
  'I found a highly relevant playbook "Long term metric change" which is designed exactly for this type of question. Let me load it to follow the proper analysis steps.';

// ============================================
// Phase 5 content: agent "works the playbook" -- alternating narration and
// tool-call rows. `bold` is a list of [from, to) character ranges within
// `text` that should render in bold; the renderer keeps them bold from the
// moment each character is typed (option a). Tool rows are rendered with
// `ToolCallRow` and don't stream -- they fade in as a single unit.
// ============================================

export type Phase5Step =
  | {
      type: 'narration';
      text: string;
      bold?: { from: number; to: number }[];
    }
  | {
      type: 'tool';
      /** Final ("done") label shown after the group collapses. */
      label: string;
      /**
       * Label shown on each sub-row while the call is "in flight". For
       * single-shot tools (subCount=1) this is unused and the row jumps
       * straight to `label`.
       */
      runningLabel?: string;
      /**
       * Number of parallel sub-calls. Grouped (>1) tools stage the
       * sub-rows in then collapse them into one done-state row.
       */
      subCount: number;
      /**
       * Whether to render the trailing `›` chevron on the done-state
       * row. Defaults to true. Set to false for tools whose result is
       * surfaced separately (e.g. the artifact-creation step which
       * shows the result as a dedicated card below).
       */
      showChevron?: boolean;
    };

// Title of the artifact card that appears below Step 8 once Phase 5
// completes. Kept as a top-level constant so the Step 8 row label and
// the artifact card both stay in sync.
export const ARTIFACT_TITLE = 'Long-Term User Growth Opportunities Analysis';

export const PHASE5_STEPS: Phase5Step[] = [
  {
    type: 'narration',
    text: 'Let me start by discovering the relevant measures and understanding the growth accounting data:',
  },
  {
    type: 'tool',
    label: 'Searched context',
    runningLabel: 'Searching context',
    subCount: 2,
  },
  {
    type: 'narration',
    text: 'From the framework I can see four strategic levers driving long-term growth: new user acquisition, early retention, mature cohort leakage, and churned user resurrection. Let me pull the monthly accounting data for each:',
    // Character ranges precomputed for the four bold lever names; see
    // node script in commit history. Ranges are half-open [from, to).
    bold: [
      { from: 77, to: 97 }, // "new user acquisition"
      { from: 99, to: 114 }, // "early retention"
      { from: 116, to: 137 }, // "mature cohort leakage"
      { from: 143, to: 168 }, // "churned user resurrection"
    ],
  },
  {
    type: 'tool',
    label: 'Queried measures',
    runningLabel: 'Querying measures',
    subCount: 3,
  },
  {
    type: 'narration',
    text: 'Now let me compute the key year-over-year comparisons and impact scenarios for each lever:',
  },
  {
    type: 'tool',
    label: 'Ran calculation',
    runningLabel: 'Running calculation',
    subCount: 3,
  },
  {
    type: 'narration',
    text: 'Now let me build the comprehensive analysis artifact:',
  },
  {
    type: 'tool',
    // Single-shot with a running label: the row fades in showing
    // "Creating artifact" with a shimmer sweep, then flips to the full
    // done label once the work completes. No chevron -- the artifact
    // surfaces in the card below.
    label: `Created artifact '${ARTIFACT_TITLE}'`,
    runningLabel: 'Creating artifact',
    subCount: 1,
    showChevron: false,
  },
];

// ============================================
// Phase 6 content: the collapsed group row label and the streamed
// dashboard description that appears below the artifact card.
// ============================================

// One-line label rendered on the single collapsed tool-call row that
// replaces all the Phase 4/5 reasoning rows once Phase 6 begins. The
// trailing "and 2 more ›" hints that more steps are hidden behind the
// chevron.
export const COLLAPSED_GROUP_LABEL =
  'Searched context, Loaded instruction, Queried measures and 2 more';

// Dashboard description streamed below the artifact card during Phase 6.
// Written without markdown markers; bold ranges are computed below from
// the raw string so any future copy edits don't drift out of sync.
export const DASHBOARD_RESPONSE = `Here's the analysis of your biggest long-term user growth opportunities, Tony. Here are the key takeaways:
1. New User Acquisition — Trends in signups across channels and cohorts
2. Early Retention — Cohort retention curves over the first 30 days
3. Mature Cohort Leakage — Where long-tenured users are dropping off
4. Churned User Resurrection — Reactivation rates of dormant users
5. Growth Levers Impact — Modeled MAU lift per scenario
The analysis is pre-filtered to your top 3 markets, with per-panel filters to drill down further.`;

// Bold terms in DASHBOARD_RESPONSE. Indexed dynamically so the ranges
// match the source string exactly (no manual char counting). Only the
// FIRST occurrence of each term is bolded -- matches the screenshot's
// pattern where the item titles are emphasised. Terms that aren't
// present in the current copy are silently dropped (so copy edits
// don't break the build).
const DASHBOARD_BOLD_TERMS = [
  'New User Acquisition',
  'Early Retention',
  'Mature Cohort Leakage',
  'Churned User Resurrection',
  'Growth Levers Impact',
];

export const DASHBOARD_RESPONSE_BOLD: { from: number; to: number }[] =
  DASHBOARD_BOLD_TERMS.flatMap((term) => {
    const from = DASHBOARD_RESPONSE.indexOf(term);
    if (from === -1) return [];
    return [{ from, to: from + term.length }];
  });

// ============================================
// Phase 7 content: right-panel artifact viewer.
// Static toolbar copy + structured data for the visible portions of the
// reconstructed HTML report.
// ============================================

export const ARTIFACT_VIEW_TOOLBAR = {
  title: ARTIFACT_TITLE, // "Long-Term User Growth Opportunities Analysis"
  badge: 'HTML',
  downloadLabel: 'Download',
  sharedLabel: 'Shared',
} as const;

// Brand palette pulled from the source HTML so the right-panel
// reconstruction matches the report's accent colors exactly.
export const REPORT_PALETTE = {
  brandPurple: '#A43DF5',
  brandTeal: '#119F97',
  brandBlue: '#3E8ED8',
  brandOrange: '#FF5D39',
  bodyText: 'rgba(0,0,0,0.78)',
  mutedText: 'rgba(0,0,0,0.55)',
  cardBorder: 'rgba(0,0,0,0.08)',
  pageBackground: '#ffffff',
  sectionBackground: '#fbfbfd',
} as const;

// "Current MAU Composition" card -- 5 metric tiles. Order, values, and
// per-tile color match lines 287..312 of the source HTML.
export type MauStatTile = {
  value: string;
  label: string;
  change: string;
  color: string;
};

export const MAU_COMPOSITION_STATS: MauStatTile[] = [
  {
    value: '51,955',
    label: 'Total MAU',
    change: '+25.6% YoY',
    color: REPORT_PALETTE.brandPurple,
  },
  {
    value: '39,489',
    label: 'Retained (76.0%)',
    change: '+19.2% YoY',
    color: REPORT_PALETTE.brandTeal,
  },
  {
    value: '7,515',
    label: 'Resurrected (14.5%)',
    change: '+66.6% YoY',
    color: REPORT_PALETTE.brandBlue,
  },
  {
    value: '4,951',
    label: 'New (9.5%)',
    change: '+32.1% YoY',
    color: REPORT_PALETTE.brandPurple,
  },
  {
    value: '12,711',
    label: 'Churned (28-day)',
    change: 'Churn rate down to 24.5% (was 29.7%)',
    color: REPORT_PALETTE.brandOrange,
  },
];

// Intro prose for the report's summary section. We render this as a
// sequence of typed segments so colored callouts (year-over-year, the
// negative net-flow figure) can be styled inline. Mirrors the colored
// spans inside the source HTML's first <p>.
export type ProseSegment = {
  text: string;
  color?: string;
  bold?: boolean;
};

export const REPORT_INTRO_PROSE: ProseSegment[] = [
  { text: 'MAU has grown ' },
  {
    text: '25.6% year-over-year',
    color: REPORT_PALETTE.brandTeal,
    bold: true,
  },
  { text: ' from ~41.4K to ~52.0K. The analysis of four strategic growth levers — new acquisition, retention, churn reduction, and resurrection — reveals that ' },
  {
    text: 'reducing churn is the single largest opportunity',
    bold: true,
  },
  { text: ', followed by sustaining new user acquisition spikes and deepening retention. The net flow (new + resurrected − churned) is currently ' },
  {
    text: '−245 users/day',
    color: REPORT_PALETTE.brandOrange,
    bold: true,
  },
  { text: ', meaning the user base is growing primarily because the retained base is expanding — but that can\u2019t continue indefinitely without fixing the inflow/outflow imbalance.' },
];

// Condensed "Growth Levers" sections rendered below-the-fold so the
// right panel's scrollable area has real depth. Values match the
// source HTML's lever cards but the copy is trimmed to a sentence or
// two each (the scene never scrolls these into view; they're just
// there so the bottom of the panel doesn't feel hollow when the user
// scrolls manually).
export type LeverCard = {
  rank: string;
  title: string;
  borderColor: string;
  body: string;
  impacts: { value: string; label: string }[];
};

export const REPORT_LEVERS: LeverCard[] = [
  {
    rank: '#1 Highest Impact',
    title: 'Reduce Monthly Churn',
    borderColor: REPORT_PALETTE.brandOrange,
    body: 'Currently ~12,711 users churn every 28-day cycle. This is the largest single drain on the user base and exceeds new user acquisition + resurrection combined.',
    impacts: [
      { value: '+1,271', label: 'MAU gain from 10% churn reduction' },
      { value: '+2,542', label: 'MAU gain from 20% churn reduction' },
      { value: '+4,277', label: 'MAU gain if churn returns to Jul 2025 lows' },
    ],
  },
  {
    rank: '#2 High Impact',
    title: 'Scale New User Acquisition',
    borderColor: REPORT_PALETTE.brandPurple,
    body: 'New users currently contribute ~4,951/day to MAU but spiked to 8,691 in early Feb 2026 — proving the channel can scale.',
    impacts: [
      { value: '+3,740', label: 'MAU gain from sustaining peak rate (8,691)' },
      { value: '+990', label: 'MAU gain from 20% increase in new users' },
    ],
  },
  {
    rank: '#3 Foundational',
    title: 'Deepen Retained User Base',
    borderColor: REPORT_PALETTE.brandTeal,
    body: 'Retained users are the backbone at 39,489 (76% of MAU), up from 33,121 a year ago — a solid +19.2% YoY improvement.',
    impacts: [
      { value: '+1,975', label: 'MAU gain from 5% retention improvement' },
    ],
  },
  {
    rank: '#4 Amplifier',
    title: 'Resurrect Churned Users',
    borderColor: REPORT_PALETTE.brandBlue,
    body: 'Resurrected users surged +66.6% YoY to 7,515 — the fastest-growing component. The Oct 2025 spike to ~8,200+ shows reactivation campaigns can be very effective.',
    impacts: [
      { value: '+1,503', label: 'MAU gain from 20% resurrection increase' },
    ],
  },
];

// ============================================
// Mouse cursor target (in scene-space coordinates).
// The text-input click point inside the agenda card. Tuned visually for the
// 1280x900 composition; if LAYOUT changes, re-tune.
// ============================================

export const MOUSE_TARGET = {
  // Click point inside the text field; tuned so the cursor tip lands
  // vertically in the middle of the input row.
  x: 270,
  y: 500,
};

// Where the mouse cursor enters the scene from (just inside bottom-right)
export const MOUSE_START = {
  x: 1240,
  y: 870,
};
