import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  ARTIFACT_TITLE,
  BODY_BACKGROUND,
  BODY_BACKGROUND_FALLBACK,
  COLLAPSED_GROUP_LABEL,
  HEADER_TITLES,
  LAYOUT,
  TYPED_QUESTION,
} from '../../Playbooks/constants';
import { ArtifactCard } from '../../Playbooks/components/ArtifactCard';
import { useChatColumnWidth } from '../../Playbooks/components/ChatColumnWidth';
import { ChatBubble } from '../../Playbooks/components/ChatBubble';
import { ConversationHeader } from '../../Playbooks/components/ConversationHeader';
import { FeedbackFooter } from '../../Playbooks/components/FeedbackFooter';
import { FollowUpInput } from '../../Playbooks/components/FollowUpInput';
import { NarrationParagraph } from '../../Playbooks/components/NarrationParagraph';
import { ToolCallRow } from '../../Playbooks/components/ToolCallRow';
import {
  buildSchedule,
  getRevealedCharsForSchedule,
  type Token,
} from '../../Playbooks/responseSchedule';
import { TIMING } from '../timing';
import { ConfidencePopover } from './ConfidencePopover';
import { ConfidenceTag } from './ConfidenceTag';

const easeOut = Easing.out(Easing.cubic);

// ---- Local dashboard response ----
//
// Same intro + 5 numbered items as the original Phase 6
// `DASHBOARD_RESPONSE`, but with the trailing "pre-filtered to your
// top 3 markets" closing sentence dropped so the High Confidence
// tag and the FeedbackFooter (with thumbs) stay inside the
// conversation viewport.
const DASHBOARD_RESPONSE = `Here's the analysis of your biggest long-term user growth opportunities, Tony. Here are the key takeaways:
1. New User Acquisition — Trends in signups across channels and cohorts
2. Early Retention — Cohort retention curves over the first 30 days
3. Mature Cohort Leakage — Where long-tenured users are dropping off
4. Churned User Resurrection — Reactivation rates of dormant users
5. Growth Levers Impact — Modeled MAU lift per scenario`;

const DASHBOARD_BOLD_TERMS = [
  'New User Acquisition',
  'Early Retention',
  'Mature Cohort Leakage',
  'Churned User Resurrection',
  'Growth Levers Impact',
];

const DASHBOARD_RESPONSE_BOLD = DASHBOARD_BOLD_TERMS.flatMap((term) => {
  const from = DASHBOARD_RESPONSE.indexOf(term);
  if (from === -1) return [];
  return [{ from, to: from + term.length }];
});

// ---- Local Phase 6+ dashboard typing schedule ----
//
// We can't reuse `DASHBOARD_SCHEDULE` from `Playbooks/responseSchedule`
// because that schedule is anchored at the original scene's
// `phase6StreamStart` (frame 1176). Build a fresh schedule against
// this scene's trimmed copy + stream window so the typing cadence
// still feels organic (variable bursts + punctuation pauses) but
// fits inside 0..streamEnd.
const DASHBOARD_SCHEDULE: Token[] = buildSchedule(
  DASHBOARD_RESPONSE,
  TIMING.streamStart,
  TIMING.streamEnd,
  211,
);

/**
 * Slim Phase-6+ chat column for the trust-signal scene. Renders only
 * the post-split state: header, original chat bubble, collapsed
 * grouped tool-call row, the (selected) artifact card, the streamed
 * dashboard response, the new High Confidence tag (with sibling
 * popover), and the feedback footer.
 *
 * Mirrors `AgendaScreen` Phase 6 layout one-for-one (same
 * positioning / spacing / `useChatColumnWidth` reflow) but skips all
 * Phase 1-5 machinery (mouse-typed input, conversation morph,
 * playbook reel, narration scroll, etc.).
 */
export const TrustSignalChatColumn: React.FC = () => {
  const frame = useCurrentFrame();
  const chatColumnWidth = useChatColumnWidth();
  const followUpWidth = Math.min(LAYOUT.followUpWidth, chatColumnWidth);

  // ---- Streaming + tag + footer + popover progress ----
  const dashboardCharsTyped = getRevealedCharsForSchedule(
    DASHBOARD_SCHEDULE,
    frame,
  );
  const dashboardIsTyping =
    frame >= TIMING.streamStart &&
    frame < TIMING.streamEnd &&
    dashboardCharsTyped < DASHBOARD_RESPONSE.length;

  const tagOpacity = interpolate(
    frame,
    [TIMING.tagFadeStart, TIMING.tagFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const footerOpacity = interpolate(
    frame,
    [TIMING.footerFadeStart, TIMING.footerFadeEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Popover progress: ramp in over fadeIn window, hold at 1, ramp
  // out over fadeOut window. Two non-overlapping windows means we
  // can compose this as min(rampIn, rampOut) without an extra hold
  // branch.
  const popoverFadeIn = interpolate(
    frame,
    [TIMING.popoverFadeInStart, TIMING.popoverFadeInEnd],
    [0, 1],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const popoverFadeOut = interpolate(
    frame,
    [TIMING.popoverFadeOutStart, TIMING.popoverFadeOutEnd],
    [1, 0],
    { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const popoverOpacity = Math.min(popoverFadeIn, popoverFadeOut);
  const popoverMounted =
    frame >= TIMING.popoverFadeInStart && frame <= TIMING.popoverFadeOutEnd;

  // Body horizontal centering line (mirrors AgendaScreen.contentLeft).
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
      {/* Conversation header */}
      <div
        style={{
          position: 'absolute',
          left: contentLeft,
          top: LAYOUT.conversationHeaderTop,
          width: chatColumnWidth,
          transform: `translateX(${contentTranslateX})`,
        }}
      >
        <ConversationHeader title={HEADER_TITLES.final} />
      </div>

      {/* Chat bubble (the user's original question) */}
      <div
        style={{
          position: 'absolute',
          left: contentLeft,
          top: LAYOUT.conversationBubbleTop,
          width: chatColumnWidth,
          transform: `translateX(${contentTranslateX})`,
        }}
      >
        <ChatBubble text={TYPED_QUESTION} />
      </div>

      {/* Conversation column. Stack of: collapsed group row,
          artifact card, streamed response, confidence tag (with
          sibling popover), feedback footer. */}
      <div
        style={{
          position: 'absolute',
          left: contentLeft,
          top: LAYOUT.responseColumnTop,
          width: chatColumnWidth,
          bottom: LAYOUT.conversationViewportBottom,
          transform: `translateX(${contentTranslateX})`,
          overflow: 'hidden',
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
          }}
        >
          <ToolCallRow
            label={COLLAPSED_GROUP_LABEL}
            subCount={1}
            progress={1}
            showChevron
          />

          <ArtifactCard title={ARTIFACT_TITLE} selectionProgress={1} />

          {dashboardCharsTyped > 0 && (
            <NarrationParagraph
              text={DASHBOARD_RESPONSE}
              bold={DASHBOARD_RESPONSE_BOLD}
              revealedChars={dashboardCharsTyped}
              showCursor={dashboardIsTyping}
            />
          )}

          {/* Confidence tag + popover. The wrapper is the popover's
              positioning context: `position: relative` with
              `align-self: flex-start` so it sizes to the tag and the
              popover can anchor `bottom: 100%` above it. */}
          {frame >= TIMING.tagFadeStart && (
            <div
              style={{
                position: 'relative',
                alignSelf: 'flex-start',
                display: 'inline-flex',
                opacity: tagOpacity,
              }}
            >
              <ConfidenceTag />
              {popoverMounted && (
                <ConfidencePopover
                  opacity={popoverOpacity}
                  liftProgress={popoverOpacity}
                />
              )}
            </div>
          )}

          {frame >= TIMING.footerFadeStart && (
            <div style={{ opacity: footerOpacity }}>
              <FeedbackFooter />
            </div>
          )}
        </div>
      </div>

      {/* Follow-up input docked at the bottom (matches the original
          Phase 6 chrome). Static state -- not streaming. */}
      <div
        style={{
          position: 'absolute',
          left: contentLeft,
          bottom: LAYOUT.followUpBottom,
          width: followUpWidth,
          transform: `translateX(${contentTranslateX})`,
        }}
      >
        <FollowUpInput isStreaming={false} />
      </div>
    </div>
  );
};
