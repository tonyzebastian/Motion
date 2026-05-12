import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  AGENT_FOLLOWUP,
  AGENT_RESPONSE,
  ARTIFACT_TITLE,
  BODY_BACKGROUND,
  BODY_BACKGROUND_FALLBACK,
  COLLAPSED_GROUP_LABEL,
  COLORS,
  DASHBOARD_RESPONSE,
  DASHBOARD_RESPONSE_BOLD,
  HEADER_TITLES,
  LAYOUT,
  MATCHED_PLAYBOOK_INDEX,
  PHASE5_STEPS,
  PLAYBOOKS,
  SEARCH_LABEL,
  TIMING,
  TYPED_QUESTION,
} from '../constants';
import {
  getRevealedDashboardChars,
  getRevealedFollowupChars,
  getRevealedPhase5Chars,
  getRevealedResponseChars,
} from '../responseSchedule';
import { ArtifactCard } from './ArtifactCard';
import { useChatColumnWidth } from './ChatColumnWidth';
import { FeedbackFooter } from './FeedbackFooter';
import { BlinkingCursor } from './BlinkingCursor';
import { ChatBubble } from './ChatBubble';
import { ConversationHeader } from './ConversationHeader';
import { FlippingPlaceholder } from './FlippingPlaceholder';
import { FollowUpInput } from './FollowUpInput';
import { NarrationParagraph } from './NarrationParagraph';
import { PlaybookChip } from './PlaybookChip';
import { PlaybookReel } from './PlaybookReel';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallRow } from './ToolCallRow';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";


const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColorChannel = (
  fromRgb: [number, number, number],
  toRgb: [number, number, number],
  t: number,
): string => {
  const r = Math.round(lerp(fromRgb[0], toRgb[0], t));
  const g = Math.round(lerp(fromRgb[1], toRgb[1], t));
  const b = Math.round(lerp(fromRgb[2], toRgb[2], t));
  return `rgb(${r}, ${g}, ${b})`;
};

const PURPLE_LIGHT_RGB: [number, number, number] = [251, 240, 254];
const PURPLE_RGB: [number, number, number] = [164, 61, 245];
const ICON_PURPLE_RGB: [number, number, number] = [164, 61, 245];
const ICON_WHITE_RGB: [number, number, number] = [255, 255, 255];

// Phase 1 group is vertically centered in the body.
// Body height = browser window height - browser header height = 720 - 52 = 668.
// Phase 1 inner stack height: title 36 + gap 32 + input card ~56 = 124.
const BODY_HEIGHT =
  LAYOUT.sceneHeight -
  LAYOUT.windowPaddingTop -
  LAYOUT.windowPaddingBottom -
  LAYOUT.headerHeight;
const PHASE1_GROUP_HEIGHT = 36 + 32 + 56;
const PHASE1_GROUP_TOP = (BODY_HEIGHT - PHASE1_GROUP_HEIGHT) / 2;
const INPUT_CARD_TOP = PHASE1_GROUP_TOP + 36 + 32; // ~340

export const AgendaScreen: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic chat column width: full LAYOUT.bubbleWidth pre-Phase-7,
  // lerps down to LAYOUT.leftColWidthSplit while the split opens. The
  // Phase 1 agenda card stays at LAYOUT.agendaWidth since the split
  // fires far after Phase 1 has completed.
  const chatColumnWidth = useChatColumnWidth();
  // Follow-up input keeps its preferred width until the column gets
  // narrower than that; then it shrinks with the column.
  const followUpWidth = Math.min(LAYOUT.followUpWidth, chatColumnWidth);

  // ============================================
  // Phase 1: focus + typing
  // ============================================

  const focusProgress = interpolate(
    frame,
    [TIMING.inputFocusStart, TIMING.inputFocusStart + TIMING.inputFocusDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const charsTyped = Math.max(
    0,
    Math.floor(
      interpolate(
        frame,
        [TIMING.typingStart, TIMING.typingEnd],
        [0, TYPED_QUESTION.length],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      ),
    ),
  );
  const visibleText = TYPED_QUESTION.slice(0, charsTyped);
  const showPlaceholder = charsTyped === 0;

  const baseShadow = [
    '0 -1px 8px rgba(0,0,0,0.12)',
    '5px -10px 30px -15px rgba(0,0,0,0.09)',
    '5px 10px 30px -15px rgba(0,0,0,0.09)',
  ].join(', ');
  const focusedShadow = [
    `0 0 0 4px rgba(164, 61, 245, ${0.2 * focusProgress})`,
    '0 -1px 8px rgba(0,0,0,0.12)',
    '5px -10px 30px -15px rgba(0,0,0,0.09)',
    '5px 10px 30px -15px rgba(0,0,0,0.09)',
  ].join(', ');
  const cardShadow = focusProgress === 0 ? baseShadow : focusedShadow;
  const buttonBg = lerpColorChannel(PURPLE_LIGHT_RGB, PURPLE_RGB, focusProgress);
  const iconColor = lerpColorChannel(ICON_PURPLE_RGB, ICON_WHITE_RGB, focusProgress);
  const cursorColor = focusProgress > 0.5 ? COLORS.purple : COLORS.black;

  // ============================================
  // Phase 2: morph to conversation view
  // ============================================
  //
  // Seamless morph: the input card and chat bubble are stacked at the
  // same Y from morphStart. Both translate up together at the same speed,
  // ending at the bubble's final top-anchored position. A quick cross-fade
  // at the midpoint of the motion swaps one for the other -- no pause.

  const easeOut = Easing.out(Easing.cubic);

  // Title slides up + fades
  const titleProgress = interpolate(
    frame,
    [TIMING.titleFadeStart, TIMING.titleFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const titleTranslateY = -20 * titleProgress;
  const titleOpacity = 1 - titleProgress;

  // Shared upward translation for input + bubble. Both start at INPUT_CARD_TOP
  // and end at LAYOUT.conversationBubbleTop.
  const morphDistance = INPUT_CARD_TOP - LAYOUT.conversationBubbleTop;
  const morphProgress = interpolate(
    frame,
    [TIMING.morphStart, TIMING.morphEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const morphTranslateY = -morphDistance * morphProgress;

  // Cross-fade at the midpoint of the motion
  const inputOpacity =
    1 -
    interpolate(
      frame,
      [TIMING.inputFadeOutStart, TIMING.inputFadeOutEnd],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  const bubbleOpacity = interpolate(
    frame,
    [TIMING.bubbleAppearStart, TIMING.bubbleAppearEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const bubbleScale = lerp(
    0.98,
    1,
    interpolate(
      frame,
      [TIMING.bubbleAppearStart, TIMING.bubbleAppearEnd],
      [0, 1],
      {
        easing: easeOut,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    ),
  );

  // Header fades in + slides down 8px
  const headerProgress = interpolate(
    frame,
    [TIMING.headerFadeStart, TIMING.headerFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const headerOpacity = headerProgress;
  const headerTranslateY = -8 * (1 - headerProgress);

  // Thinking block fades in + slides up 8px
  const thinkingProgress = interpolate(
    frame,
    [TIMING.thinkingFadeStart, TIMING.thinkingFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const thinkingOpacity = thinkingProgress;
  const thinkingTranslateY = 8 * (1 - thinkingProgress);

  // ============================================
  // Phase 3: agent response streams in above the thinking block
  // ============================================

  // Organic, schedule-driven streaming reveal (variable-size chunks + pauses
  // at punctuation) instead of a uniform char-per-frame rate.
  const responseCharsTyped = getRevealedResponseChars(frame);
  const responseVisibleText = AGENT_RESPONSE.slice(0, responseCharsTyped);
  const responseIsTyping =
    frame >= TIMING.responseTypingStart &&
    responseCharsTyped < AGENT_RESPONSE.length;

  // Header title rename: cross-fade from "New conversation" to the topic title
  // mid-response.
  const headerTitleTransition = interpolate(
    frame,
    [TIMING.headerTitleRenameStart, TIMING.headerTitleRenameEnd],
    [0, 1],
    {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  // Follow-up input fades + rises into the bottom of the body
  const followUpProgress = interpolate(
    frame,
    [TIMING.followUpFadeStart, TIMING.followUpFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const followUpOpacity = followUpProgress;
  const followUpTranslateY = 12 * (1 - followUpProgress);
  const mountFollowUp = frame >= TIMING.followUpFadeStart;

  // ============================================
  // Phase 4: search for relevant playbook
  // ============================================

  // Label morphs from "Thinking..." -> "Searching for relevant playbook".
  const searchLabelTransition = interpolate(
    frame,
    [TIMING.searchLabelStart, TIMING.searchLabelEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Reel unfurls below the label.
  const reelOpenProgress = interpolate(
    frame,
    [TIMING.reelOpenStart, TIMING.reelOpenEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Once the match is locked, the chip fades in (replacing the search label)
  // and the reel collapses out of frame at the same time.
  const matchAcquiredProgress = interpolate(
    frame,
    [TIMING.matchAcquiredStart, TIMING.matchAcquiredEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // As the match resolves the whole search block recedes upward: the
  // search label and the reel both slide up + fade. The matched playbook
  // text itself rises from the reel's focus slot (one row below the
  // label) to where the label used to sit, morphing its content to the
  // loaded confirmation as it goes. This reads as a single physical
  // motion rather than a chip fading in over a faded label.
  const searchLabelOpacity = 1 - matchAcquiredProgress;
  // Slide the search label up by 10px so it doesn't sit statically while
  // the chip moves up into its slot.
  const searchLabelTranslateY = -10 * matchAcquiredProgress;
  // Reel slides up alongside its height collapse for the same smooth
  // recession.
  const reelTranslateY = -12 * matchAcquiredProgress;
  // Chip starts in the reel's focus-slot position (one row pitch below
  // the search label, +2px reelTopGap) and rises to the search label's
  // y as matchAcquired goes 0 -> 1.
  const CHIP_START_OFFSET = LAYOUT.reelRowPitch + LAYOUT.reelTopGap;
  const chipTranslateY = CHIP_START_OFFSET * (1 - matchAcquiredProgress);
  // Chip is opaque throughout (its own component handles the swap dip).
  // We fade it in over the first sliver of the window so the duplicate
  // text (chip + reel's matched row) reads as the same element, then
  // the reel fades and only the chip remains.
  const chipOpacity = interpolate(
    matchAcquiredProgress,
    [0, 0.25],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Once the chip has landed, the "Thinking..." state returns below it --
  // the agent is now processing the loaded playbook before replying.
  const thinkingReturnProgress = interpolate(
    frame,
    [TIMING.thinkingReturnStart, TIMING.thinkingReturnEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  // The returning "Thinking..." persists past its initial fade-in: it
  // stays visible through Phase 5 narrations and is only hidden when
  // the agent is performing a tool call. See `phase5ThinkingHide` below.
  const thinkingReturnTranslateY = 8 * (1 - thinkingReturnProgress);
  const mountThinkingReturn = frame >= TIMING.thinkingReturnStart;

  // Follow-up agent line ("Found a matching playbook -- starting Step 0...")
  // streams in below the search section using the same organic typing
  // schedule as the main response.
  const followupCharsTyped = getRevealedFollowupChars(frame);
  const followupVisibleText = AGENT_FOLLOWUP.slice(0, followupCharsTyped);
  const followupIsTyping =
    frame >= TIMING.followupTypingStart &&
    followupCharsTyped < AGENT_FOLLOWUP.length;

  const mountReel = frame >= TIMING.reelOpenStart;
  const mountChip = frame >= TIMING.matchAcquiredStart;

  // ============================================
  // Phase 5: agent works the playbook
  // ============================================
  //
  // Each step is either a `narration` (streamed text with optional bold
  // ranges) or a `tool` (inert row fading in over a short window). Steps
  // mount at their start frame and stay mounted; the inner column scrolls
  // upward as the stack grows past the viewport.

  type Phase5StepRender =
    | {
        type: 'narration';
        text: string;
        bold?: { from: number; to: number }[];
        revealedChars: number;
        showCursor: boolean;
        mounted: boolean;
      }
    | {
        type: 'tool';
        label: string;
        runningLabel?: string;
        subCount: number;
        showChevron: boolean;
        progress: number;
        mounted: boolean;
      };

  const PHASE5_STEP_WINDOWS: Array<{ start: number; end: number }> = [
    {
      start: TIMING.phase5Step1TypingStart,
      end: TIMING.phase5Step1TypingEnd,
    },
    { start: TIMING.phase5Step2ToolStart, end: TIMING.phase5Step2ToolEnd },
    {
      start: TIMING.phase5Step3TypingStart,
      end: TIMING.phase5Step3TypingEnd,
    },
    { start: TIMING.phase5Step4ToolStart, end: TIMING.phase5Step4ToolEnd },
    {
      start: TIMING.phase5Step5TypingStart,
      end: TIMING.phase5Step5TypingEnd,
    },
    { start: TIMING.phase5Step6ToolStart, end: TIMING.phase5Step6ToolEnd },
    {
      start: TIMING.phase5Step7TypingStart,
      end: TIMING.phase5Step7TypingEnd,
    },
    { start: TIMING.phase5Step8ToolStart, end: TIMING.phase5Step8ToolEnd },
  ];

  const phase5Renders: Phase5StepRender[] = PHASE5_STEPS.map((step, idx) => {
    const { start, end } = PHASE5_STEP_WINDOWS[idx];
    const mounted = frame >= start;
    if (step.type === 'narration') {
      const revealedChars = getRevealedPhase5Chars(idx, frame);
      const showCursor = frame >= start && revealedChars < step.text.length;
      return {
        type: 'narration',
        text: step.text,
        bold: step.bold,
        revealedChars,
        showCursor,
        mounted,
      };
    }
    const progress = interpolate(frame, [start, end], [0, 1], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      type: 'tool',
      label: step.label,
      runningLabel: step.runningLabel,
      subCount: step.subCount,
      showChevron: step.showChevron ?? true,
      progress,
      mounted,
    };
  });

  // Artifact card: fades in below the Step 8 row after the row's
  // linger window has elapsed and the label has truncated.
  const artifactCardProgress = interpolate(
    frame,
    [TIMING.phase5Step8CardStart, TIMING.phase5Step8CardEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const artifactCardOpacity = artifactCardProgress;
  const artifactCardTranslateY = 8 * (1 - artifactCardProgress);
  const mountArtifactCard = frame >= TIMING.phase5Step8CardStart;

  // Artifact card "selected" tint. Animates from 0 to 1 in lockstep with
  // the Phase 7 split opening (the right-hand artifact viewer sliding in),
  // so the card visually picks up the brand-purple wash exactly while the
  // panel that owns its content reveals.
  const artifactSelectionProgress = interpolate(
    frame,
    [TIMING.phase7Start, TIMING.phase7SplitOpenEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Hide the bottom "Thinking..." indicator whenever the agent is
  // performing a tool call. Each tool window contributes a 0->1 hide
  // ramp with 4-frame fades at the edges; we take the max across all
  // four tool windows so any one being active hides the dot. Outside
  // any window the value is 0 (thinking visible).
  const computeToolHide = (start: number, end: number): number =>
    interpolate(
      frame,
      [start - 4, start, end, end + 4],
      [0, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  const phase5ThinkingHide = Math.max(
    computeToolHide(TIMING.phase5Step2ToolStart, TIMING.phase5Step2ToolEnd),
    computeToolHide(TIMING.phase5Step4ToolStart, TIMING.phase5Step4ToolEnd),
    computeToolHide(TIMING.phase5Step6ToolStart, TIMING.phase5Step6ToolEnd),
    // Step 8 (Created artifact) hides the dot through the row's running
    // window AND while the artifact card is fading in beneath it; the
    // hide releases once the card has landed so the dot can return to
    // sit underneath the card during the linger before Phase 6's
    // collapse.
    computeToolHide(TIMING.phase5Step8ToolStart, TIMING.phase5Step8CardEnd),
  );
  const phase5ThinkingOpacity = 1 - phase5ThinkingHide;

  // Scroll keyframes for the inner column. Values are hand-tuned from the
  // estimated cumulative content height vs the viewport height: scroll
  // only kicks in once the stack would overflow the visible area, and
  // grows in lockstep with each step's typing window so the latest line
  // stays anchored near the bottom of the viewport.
  const SCROLL_FRAMES = [
    TIMING.phase5Start,
    TIMING.phase5Step1TypingEnd,
    TIMING.phase5Step3TypingStart,
    TIMING.phase5Step3TypingEnd,
    TIMING.phase5Step5TypingStart,
    TIMING.phase5Step5TypingEnd,
    TIMING.phase5Step7TypingStart,
    TIMING.phase5Step7TypingEnd,
    TIMING.phase5Step8ToolStart,
    TIMING.phase5Step8CardStart,
    TIMING.phase5Step8CardEnd,
    TIMING.phase5End,
  ];
  // After the artifact card appears we scroll up another ~70px so the
  // card sits within the visible viewport area; the previous lines
  // drift further off the top.
  const SCROLL_VALUES = [0, 0, 0, 24, 24, 88, 124, 164, 200, 200, 270, 270];
  const scrollY = interpolate(frame, SCROLL_FRAMES, SCROLL_VALUES, {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The chat bubble lives OUTSIDE the auto-scroll viewport (so the
  // Phase 2 morph from INPUT_CARD_TOP keeps its existing geometry),
  // but visually it should scroll up alongside the conversation column
  // during Phase 5. We layer a second translateY equal to -scrollY on
  // top of the existing morphTranslateY, and fade the bubble out as
  // scroll begins so it doesn't crash into the pinned header instead
  // of merging into the top fade region. Both values are zero outside
  // Phase 5 because scrollY is held at 0 until phase5Step3TypingStart,
  // so Phase 2/3/4 behavior is unchanged.
  // Phase 6 takes the auto-scroll machinery and snaps it back to its
  // resting state for the artifact handoff: scrollY -> 0, viewport top
  // -> 138, bubble -> visible. Outside Phase 6 the original Phase 5
  // auto-scroll behaviour is untouched.
  const phase6Active = frame >= TIMING.phase6Start;
  const effectiveScrollY = phase6Active ? 0 : scrollY;

  // Top fade mask only kicks in once content is actually scrolling past
  // the top edge, so the response paragraph's first line isn't faded out
  // at the very start of the conversation.
  const maskActive = effectiveScrollY > 0.5;

  const bubbleScrollTranslateY = -effectiveScrollY;
  const bubbleScrollOpacity = interpolate(effectiveScrollY, [4, 40], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // As the bubble fades out, the conversation viewport rises to fill the
  // space it vacated, so the first visible Phase 5 row sits just under
  // the pinned header instead of leaving a tall empty gap. We lerp from
  // the original top (which left room for the bubble) up to a tight gap
  // below the header, driven by the same scroll window that fades the
  // bubble. Outside Phase 5 scrollY is 0 so the viewport sits at its
  // original position and Phase 2/3/4 layout is unchanged.
  const VIEWPORT_TOP_MIN = 72; // matches the original bubble top: viewport
  // rises into the space the bubble vacates, leaving a comfortable gap
  // below the pinned header.
  const viewportTop =
    LAYOUT.responseColumnTop -
    (LAYOUT.responseColumnTop - VIEWPORT_TOP_MIN) * (1 - bubbleScrollOpacity);

  // Phase 6 chat-bubble re-fade. At phase6Start the snapping scrollY -> 0
  // would also snap bubbleScrollOpacity back to 1, which is too abrupt.
  // We instead fade the bubble in smoothly over 12f via a separate ramp
  // that takes over during Phase 6.
  const phase6BubbleReturnOpacity = phase6Active
    ? interpolate(
        frame,
        [TIMING.phase6Start, TIMING.phase6BubbleFadeEnd],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 1;

  // Phase 6 streamed dashboard description below the artifact card.
  const dashboardCharsTyped = phase6Active
    ? getRevealedDashboardChars(frame)
    : 0;
  const dashboardIsTyping =
    phase6Active &&
    frame >= TIMING.phase6StreamStart &&
    frame < TIMING.phase6StreamEnd &&
    dashboardCharsTyped < DASHBOARD_RESPONSE.length;

  // Feedback footer fades in after the dashboard response lands.
  const feedbackFooterOpacity = interpolate(
    frame,
    [TIMING.phase6FooterFadeStart, TIMING.phase6FooterFadeEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const mountFeedbackFooter = frame >= TIMING.phase6FooterFadeStart;

  // Thinking dot visibility during Phase 6: shown while the agent is
  // streaming (and during the pre-stream linger), hidden once the
  // feedback footer surfaces -- the agent has "finished".
  const phase6ThinkingOpacity = phase6Active
    ? interpolate(
        frame,
        [TIMING.phase6FooterFadeStart - 4, TIMING.phase6FooterFadeStart],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 1;

  // Mount toggles. The bubble mounts at morphStart (invisible) so it shares
  // the upward motion with the input. The input unmounts once it is fully
  // faded out so it can't cover the bubble.
  const mountTitle = frame < TIMING.titleFadeEnd;
  const mountInput = frame < TIMING.inputFadeOutEnd;
  const mountBubble = frame >= TIMING.morphStart;
  const mountHeader = frame >= TIMING.headerFadeStart;
  const mountThinking = frame >= TIMING.thinkingFadeStart;

  // Body horizontal centering line for 800-wide content
  const contentLeft = '50%';
  const contentTranslateX = '-50%';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: BODY_BACKGROUND,
        backgroundColor: BODY_BACKGROUND_FALLBACK,
        overflow: 'hidden',
      }}
    >
      {/* Title (lives above the input row, fades out independently) */}
      {mountTitle && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            top: PHASE1_GROUP_TOP,
            width: LAYOUT.agendaWidth,
            transform: `translateX(${contentTranslateX}) translateY(${titleTranslateY}px)`,
            opacity: titleOpacity,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: FONT_FAMILY,
              fontWeight: 400,
              fontSize: 28,
              lineHeight: '36px',
              letterSpacing: '-0.5px',
              color: COLORS.text,
              textAlign: 'center',
            }}
          >
            What&rsquo;s on the agenda today?
          </h1>
        </div>
      )}

      {/* Input card (rides the shared morph translation up; cross-fades at midpoint) */}
      {mountInput && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            top: INPUT_CARD_TOP,
            width: LAYOUT.agendaWidth,
            transform: `translateX(${contentTranslateX}) translateY(${morphTranslateY}px)`,
            opacity: inputOpacity,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: COLORS.white,
              borderRadius: LAYOUT.agendaCardRadius,
              padding: LAYOUT.agendaCardPadding,
              boxShadow: cardShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 24,
                minWidth: 0,
              }}
            >
              {showPlaceholder ? (
                <>
                  <BlinkingCursor
                    width={1}
                    height={focusProgress > 0.5 ? 20 : 18}
                    color={cursorColor}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <FlippingPlaceholder opacity={0.5 * (1 - focusProgress)} />
                  </div>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontWeight: 400,
                      fontSize: 16,
                      lineHeight: '24px',
                      letterSpacing: '-0.5px',
                      color: COLORS.text,
                      whiteSpace: 'pre',
                    }}
                  >
                    {visibleText}
                  </span>
                  <BlinkingCursor width={1} height={20} color={COLORS.purple} />
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Submit"
              style={{
                width: 32,
                height: 32,
                borderRadius: 40,
                backgroundColor: buttonBg,
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <ArrowRight size={16} strokeWidth={2} color={iconColor} />
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: conversation header */}
      {mountHeader && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            top: LAYOUT.conversationHeaderTop,
            width: chatColumnWidth,
            transform: `translateX(${contentTranslateX}) translateY(${headerTranslateY}px)`,
            opacity: headerOpacity,
          }}
        >
          <ConversationHeader
            title={HEADER_TITLES.initial}
            nextTitle={HEADER_TITLES.final}
            transition={headerTitleTransition}
          />
        </div>
      )}

      {/* Phase 2: chat bubble. Stacked on top of the input at the same Y
          and rides the same upward translation. Cross-fades in at the
          midpoint of the motion. From Phase 5 onward it additionally
          rides the viewport's scrollY upward and fades out as it
          approaches the pinned header, so only the header stays
          visible while the conversation column scrolls. */}
      {mountBubble && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            top: INPUT_CARD_TOP,
            width: chatColumnWidth,
            transform: `translateX(${contentTranslateX}) translateY(${morphTranslateY + bubbleScrollTranslateY}px) scale(${bubbleScale})`,
            transformOrigin: '50% 50%',
            opacity:
              bubbleOpacity *
              (phase6Active ? phase6BubbleReturnOpacity : bubbleScrollOpacity),
          }}
        >
          <ChatBubble text={TYPED_QUESTION} />
        </div>
      )}

      {/* Conversation viewport. Fixed height; the inner stack scrolls
          upward as Phase 5 content fills the column past the visible area.
          A top-fade mask softens the upper edge whenever scroll is
          active so older content drifts out gracefully. The chat bubble
          and follow-up input stay OUTSIDE this viewport so they don't
          scroll. */}
      {mountThinking && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            top: viewportTop,
            width: chatColumnWidth,
            bottom: LAYOUT.conversationViewportBottom,
            transform: `translateX(${contentTranslateX})`,
            overflow: 'hidden',
            WebkitMaskImage: maskActive
              ? 'linear-gradient(to bottom, transparent 0px, black 40px, black 100%)'
              : 'none',
            maskImage: maskActive
              ? 'linear-gradient(to bottom, transparent 0px, black 40px, black 100%)'
              : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: LAYOUT.responseColumnGap,
              paddingLeft: 16,
              paddingRight: 12,
              boxSizing: 'border-box',
              transform: `translateY(${-effectiveScrollY}px)`,
            }}
          >
            {/* ====================================================
                 Phase 2-5 stack. Replaced wholesale by the Phase 6
                 stack below once phase6Active is true (instant swap
                 -- the user picked this collapse motion).
                 ==================================================== */}
            {!phase6Active && (
              <>
            {/* Agent response (Phase 3). Always rendered so the column
                reserves no extra space when empty; once typing starts it
                grows naturally. */}
            {responseCharsTyped > 0 && (
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: '28px',
                  letterSpacing: '-0.2px',
                  color: COLORS.text,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {responseVisibleText}
                {responseIsTyping && (
                  <BlinkingCursor width={1} height={18} color={COLORS.text} />
                )}
              </p>
            )}

            {/* Search section (Phase 2 + Phase 4).
                - Phase 2: just shows ThinkingBlock with "Thinking..." label.
                - Phase 4: label flips to "Searching for relevant playbook",
                  the reel unfurls, the matched playbook centers, then the
                  label fades into a "Loaded ... playbook" chip while the
                  reel collapses. */}
            <div
              style={{
                transform: `translateY(${thinkingTranslateY}px)`,
                opacity: thinkingOpacity,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  minHeight: 26,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    opacity: searchLabelOpacity,
                    transform: `translateY(${searchLabelTranslateY}px)`,
                  }}
                >
                  <ThinkingBlock
                    label={SEARCH_LABEL.initial}
                    nextLabel={SEARCH_LABEL.final}
                    transition={searchLabelTransition}
                    nextLabelShimmer={false}
                  />
                </div>
                {mountChip && (
                  <div
                    style={{
                      position: 'absolute',
                      // Chip sits on the same left rail as the response
                      // paragraphs and Phase 5 narration / tool-call rows.
                      left: 0,
                      top: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: chipOpacity,
                      transform: `translateY(${chipTranslateY}px)`,
                    }}
                  >
                    <PlaybookChip
                      name={PLAYBOOKS[MATCHED_PLAYBOOK_INDEX]}
                      morphProgress={matchAcquiredProgress}
                    />
                  </div>
                )}
              </div>

              {mountReel && (
                <div
                  style={{
                    marginTop:
                      LAYOUT.reelTopGap *
                      Math.max(0, reelOpenProgress - matchAcquiredProgress),
                    transform: `translateY(${reelTranslateY}px)`,
                  }}
                >
                  <PlaybookReel
                    openProgress={reelOpenProgress}
                    collapseProgress={matchAcquiredProgress}
                  />
                </div>
              )}
            </div>

            {/* Phase 4 follow-up agent line. */}
            {followupCharsTyped > 0 && (
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT_FAMILY,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: '28px',
                  letterSpacing: '-0.2px',
                  color: COLORS.text,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {followupVisibleText}
                {followupIsTyping && (
                  <BlinkingCursor width={1} height={18} color={COLORS.text} />
                )}
              </p>
            )}

            {/* Phase 5 steps: alternating narration and tool-call rows.
                Each step mounts at its start frame and stays mounted; the
                viewport scrolls up to keep the latest line in view. */}
            {phase5Renders.map((step, idx) => {
              if (!step.mounted) return null;
              if (step.type === 'narration') {
                return (
                  <NarrationParagraph
                    key={`p5-${idx}`}
                    text={step.text}
                    bold={step.bold}
                    revealedChars={step.revealedChars}
                    showCursor={step.showCursor}
                  />
                );
              }
              return (
                <ToolCallRow
                  key={`p5-${idx}`}
                  label={step.label}
                  runningLabel={step.runningLabel}
                  subCount={step.subCount}
                  showChevron={step.showChevron}
                  progress={step.progress}
                />
              );
            })}

            {/* Artifact card: fades in below the Step 8 "Created
                artifact ..." row once the row's linger window has
                elapsed and its label has truncated. */}
            {mountArtifactCard && (
              <div
                style={{
                  opacity: artifactCardOpacity,
                  transform: `translateY(${artifactCardTranslateY}px)`,
                }}
              >
                <ArtifactCard
                  title={ARTIFACT_TITLE}
                  selectionProgress={artifactSelectionProgress}
                />
              </div>
            )}

            {/* "Thinking..." indicator -- always present at the BOTTOM of
                the inner stack as soon as the agent transitions out of
                the Phase 4 follow-up reply. Visibility tracks streaming:
                shown while the agent is narrating, hidden during tool
                calls. Initial fade-in is the Phase 4 thinkingReturn
                ramp; from Phase 5 onward, opacity is gated by tool
                windows so the dot disappears during each tool call and
                returns for the next narration. */}
            {mountThinkingReturn && (
              <div
                style={{
                  opacity:
                    thinkingReturnProgress *
                    (frame >= TIMING.phase5Start ? phase5ThinkingOpacity : 1),
                  transform: `translateY(${thinkingReturnTranslateY}px)`,
                }}
              >
                <ThinkingBlock label="Thinking..." />
              </div>
            )}
              </>
            )}

            {/* ====================================================
                 Phase 6 stack. Mounts on the instant-swap frame: the
                 collapsed group row, a fresh ArtifactCard, the streamed
                 dashboard description, the thinking dot (visible while
                 the agent writes, hidden as the footer surfaces), and
                 finally the "Was this response useful?" footer.
                 ==================================================== */}
            {phase6Active && (
              <>
                <ToolCallRow
                  label={COLLAPSED_GROUP_LABEL}
                  subCount={1}
                  progress={1}
                  showChevron
                />

                <ArtifactCard
                  title={ARTIFACT_TITLE}
                  selectionProgress={artifactSelectionProgress}
                />

                {dashboardCharsTyped > 0 && (
                  <NarrationParagraph
                    text={DASHBOARD_RESPONSE}
                    bold={DASHBOARD_RESPONSE_BOLD}
                    revealedChars={dashboardCharsTyped}
                    showCursor={dashboardIsTyping}
                  />
                )}

                {/* Thinking dot sits below the streamed text while the
                    agent writes; once the feedback footer starts to
                    surface we unmount the dot entirely so its row
                    doesn't leave a gap above the footer. */}
                {frame < TIMING.phase6FooterFadeStart && (
                  <div style={{ opacity: phase6ThinkingOpacity }}>
                    <ThinkingBlock label="Thinking..." />
                  </div>
                )}

                {mountFeedbackFooter && (
                  <div style={{ opacity: feedbackFooterOpacity }}>
                    <FeedbackFooter />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Follow-up input docked at the bottom of the body */}
      {mountFollowUp && (
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            bottom: LAYOUT.followUpBottom,
            width: followUpWidth,
            transform: `translateX(${contentTranslateX}) translateY(${followUpTranslateY}px)`,
            opacity: followUpOpacity,
          }}
        >
          <FollowUpInput
            isStreaming={frame < TIMING.followupTypingEnd}
          />
        </div>
      )}
    </div>
  );
};
