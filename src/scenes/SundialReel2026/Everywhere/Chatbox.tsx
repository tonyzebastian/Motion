import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';

loadFunnelSans('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

// Reel plum — used by the caret + native send button arrow only. The MCP tag
// is now blue-on-blue (matches the Slack mention color tokens).
const PLUM = '#531D59';

// Slack mention colors — used inside the chatbox (mention prefix in Slack
// beat), re-used for the blue MCP tag below the Claude writing area, and
// exported so the SlackShell can render matching @mentions in its thread.
export const SLACK_MENTION_TEXT = '#1264A3';
export const SLACK_MENTION_BG = 'rgba(29, 155, 209, 0.12)';
export const SLACK_MENTION_BORDER = 'rgba(29, 155, 209, 0.30)';

// Surface-specific widths. All three center on the same canvas anchor
// (x=960, y=540) via BeatUnit's translate(-50%, -50%), so the chatbox stays
// pixel-locked across every beat — only chrome and (for Claude) height
// change. All three are 880 wide so the persistent query fits comfortably
// alongside the plus + send buttons on every surface and the chatbox truly
// reads as the anchor while only the surrounding UI morphs.
export const NATIVE_CHATBOX_WIDTH = 880;
export const SLACK_CHATBOX_WIDTH = 880;
export const CLAUDE_CHATBOX_WIDTH = 880;

// Backwards-compatible alias for anything that still imports the old name.
export const CHATBOX_WIDTH = NATIVE_CHATBOX_WIDTH;

// Shared typography + caret sizing
const TEXT_SIZE = 24;
const TEXT_LINE_HEIGHT = 32;
// Caret sized to match the text (font-size, not line-height) so it visually
// matches a real composer caret instead of overshooting cap-height.
const CARET_HEIGHT = TEXT_SIZE;

// Composer chrome button (send). Native / Slack / Claude all share the same
// geometry so the affordance reads the same way across surfaces and the
// row height stays consistent during cross-fades.
const CHROME_BUTTON_SIZE = 44;
const CHROME_ICON_SIZE = 22;
const CHROME_BUTTON_BG = 'rgba(83, 29, 89, 0.08)';

// Caret blink — square wave at ~1.67Hz (36 frames per cycle @ 60fps,
// 50% duty). Used during the typewriter lead-in in beat A.
const CARET_BLINK_PERIOD = 36;

// Width reserved for the "@sundial " prefix when fully visible. The mention
// wrapper interpolates its width from 0 → this value as mentionProgress
// goes 0 → 1 in tandem with the typewriter, so the rest of the sentence
// slides smoothly to make room rather than snapping when the prefix appears.
const MENTION_RESERVED_WIDTH = 120;

// Width reserved for the "Sundial MCP" pill prefix in Beat C. Sized just
// wider than the pill's natural content (≈136px) so the gap to the
// question text reads as a tight inline space (~12px) rather than dead
// air. Animates width + opacity off `mcpOpacity` exactly the same way the
// mention wrapper animates off `mentionProgress`.
const MCP_RESERVED_WIDTH = 148;

// "@sundial " — the prefix text revealed character-by-character during the
// Beat B typewriter. The trailing space is part of the prefix so the visual
// gap between the mention and the question text grows in lockstep with the
// typed characters.
export const MENTION_TEXT = '@sundial ';

// Single Claude chatbox height — same visual mass as Slack's pill so the
// seam morph between the two beats only re-skins the box rather than
// resizing it. Previously Claude grew to fit a second MCP row; now the
// MCP tag sits inline on the writing row so no height expansion is needed.
export const CLAUDE_HEIGHT = 100;

// ---------------------------------------------------------------------------
// Surface visuals
//
// The chatbox is rendered once at the section level (not per-beat); the
// surrounding section interpolates between the three surface visuals at
// each beat seam so the chatbox visibly MORPHS shape rather than
// crossfading with a second chatbox underneath. Every property here is
// numeric so it can be lerp'd across a seam window cleanly.
//
// `ringStrength` controls the plum ring + the soft top/bottom drop. At 1
// the chatbox reads like the native Sundial composer; at 0 it reads like
// the flat Slack/Claude composers. Interpolated values in between give a
// shrinking plum halo as the box transforms.
//
// `borderOpacity` controls the 1px hairline border. Only Claude has one.
// ---------------------------------------------------------------------------

export type ChatboxSurface = 'native' | 'slack' | 'claude';

export interface SurfaceVisual {
  width: number;
  height: number;
  borderRadius: number;
  paddingTop: number;
  paddingBottom: number;
  paddingX: number;
  ringStrength: number;
  borderOpacity: number;
}

export const SURFACE_VISUALS: Record<ChatboxSurface, SurfaceVisual> = {
  native: {
    width: NATIVE_CHATBOX_WIDTH,
    // Native is content-driven (= paddingTop + 44px row + paddingBottom).
    // Pinning the explicit value here lets the section interpolate it like
    // any other property at the A↔B and C↔D seams.
    height: 92,
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 24,
    paddingX: 24,
    ringStrength: 1,
    borderOpacity: 0,
  },
  slack: {
    width: SLACK_CHATBOX_WIDTH,
    height: 100,
    borderRadius: 22,
    paddingTop: 0,
    paddingBottom: 0,
    paddingX: 32,
    ringStrength: 0,
    borderOpacity: 0,
  },
  claude: {
    width: CLAUDE_CHATBOX_WIDTH,
    height: CLAUDE_HEIGHT,
    borderRadius: 22,
    paddingTop: 0,
    paddingBottom: 0,
    paddingX: 24,
    ringStrength: 0,
    borderOpacity: 0.08,
  },
};

// Build a continuous box-shadow string from the ringStrength scalar so the
// plum ring (native's signature affordance) interpolates smoothly to / from
// nothing. The ambient drop shadow is always present so the box never feels
// "weightless" mid-morph.
const buildShadow = (ringStrength: number): string => {
  const ringSpread = 5 * ringStrength;
  const ringAlpha = 0.2 * ringStrength;
  const topGlowAlpha = 0.12 * ringStrength;
  const sideGlowAlpha = 0.1 * ringStrength;
  return [
    `0 0 0 ${ringSpread}px rgba(83, 29, 89, ${ringAlpha})`,
    `0 -1px 10px 0 rgba(0, 0, 0, ${topGlowAlpha})`,
    `6px -12px 36px -18px rgba(0, 0, 0, ${sideGlowAlpha})`,
    `6px 12px 36px -18px rgba(0, 0, 0, ${sideGlowAlpha})`,
    // Always-on ambient drop (flat composer's "weight").
    `0 6px 28px -10px rgba(0, 0, 0, 0.15)`,
    `0 1px 0 rgba(0, 0, 0, 0.04) inset`,
  ].join(', ');
};

// ---------------------------------------------------------------------------
// Shared inner pieces
// ---------------------------------------------------------------------------

const Caret: React.FC<{ blink: boolean }> = ({ blink }) => {
  const frame = useCurrentFrame();
  // Square-wave blink: 50% duty cycle over CARET_BLINK_PERIOD frames.
  const opacity = blink
    ? frame % CARET_BLINK_PERIOD < CARET_BLINK_PERIOD / 2
      ? 1
      : 0
    : 1;
  // Caret is sized to the text (CARET_HEIGHT == TEXT_SIZE) so it visually
  // matches a real composer caret. WritingArea uses `alignItems: 'center'`
  // on the cross axis, which centers this 24px caret inside the 32px line
  // box for clean vertical alignment with the text.
  return (
    <span
      style={{
        display: 'inline-block',
        width: 1.5,
        height: CARET_HEIGHT,
        backgroundColor: PLUM,
        marginLeft: 1,
        marginRight: 3,
        opacity,
        flexShrink: 0,
      }}
    />
  );
};

const SlackMention: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: 'inline',
      paddingInline: 4,
      paddingBlock: 1,
      borderRadius: 3,
      backgroundColor: SLACK_MENTION_BG,
      color: SLACK_MENTION_TEXT,
      fontFamily: FUNNEL_STACK,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const SendButton: React.FC = () => (
  <div
    style={{
      width: CHROME_BUTTON_SIZE,
      height: CHROME_BUTTON_SIZE,
      borderRadius: 999,
      backgroundColor: CHROME_BUTTON_BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={CHROME_ICON_SIZE} height={CHROME_ICON_SIZE} viewBox="0 0 20 20" fill="none">
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke={PLUM}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// Blue Slack-style MCP connector tag. Sized to read as a compact pill that
// sits inline at the start of the writing row — visually replacing the
// @sundial mention slot when Beat C is active.
const McpTag: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      paddingInline: 12,
      paddingBlock: 4,
      borderRadius: 999,
      backgroundColor: SLACK_MENTION_BG,
      color: SLACK_MENTION_TEXT,
      border: `1px solid ${SLACK_MENTION_BORDER}`,
      fontFamily: FUNNEL_STACK,
      fontWeight: 500,
      fontSize: 20,
      lineHeight: 1,
      letterSpacing: '-0.2px',
      whiteSpace: 'nowrap',
    }}
  >
    Sundial MCP
  </span>
);

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

type ChatboxProps = {
  // Raw visual properties — width, height, borderRadius, paddings, ring
  // strength, border opacity. The section computes this per frame so the
  // chatbox MORPHS smoothly between native/slack/claude shapes at every
  // beat seam instead of crossfading with a second chatbox underneath.
  visual: SurfaceVisual;
  // Visible portion of the persistent query. Drives the typewriter in beat A
  // and persists unchanged through beats B/C/D.
  text: string;
  // Caret is always visible in the composer. `caretBlink` controls whether
  // it pulses — true only during the typewriter lead-in in beat A.
  caretBlink?: boolean;
  // 0..1 progress for the "@sundial " typewriter. Drives the visible
  // substring of MENTION_TEXT AND the wrapper width AND the opacity —
  // typewriter ramp up in Beat B, ramp down in B→C transition.
  mentionProgress?: number;
  // 0..1 opacity for the Sundial MCP pill. Drives wrapper width + opacity
  // identically to mentionProgress (pill is fully rendered, clipped by
  // wrapper width as it grows in).
  mcpOpacity?: number;
};

export const Chatbox: React.FC<ChatboxProps> = ({
  visual,
  text,
  caretBlink = false,
  mentionProgress = 0,
  mcpOpacity = 0,
}) => {
  return (
    <div
      style={{
        width: visual.width,
        height: visual.height,
        backgroundColor: '#FFFFFF',
        borderRadius: visual.borderRadius,
        border: `1px solid rgba(0, 0, 0, ${visual.borderOpacity})`,
        boxShadow: buildShadow(visual.ringStrength),
        paddingTop: visual.paddingTop,
        paddingBottom: visual.paddingBottom,
        paddingInline: visual.paddingX,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {/* WRITING ROW — WritingArea on the left, send button on the right.
          The @sundial and Sundial MCP prefixes both live inline inside
          WritingArea so the row height stays constant across all beats. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minWidth: 0,
        }}
      >
        <WritingArea
          text={text}
          caretBlink={caretBlink}
          mentionProgress={mentionProgress}
          mcpOpacity={mcpOpacity}
        />
        <SendButton />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Writing area — single source of truth for the persistent query, the
// animated @sundial prefix, and the caret. Used by every surface.
// ---------------------------------------------------------------------------

type WritingAreaProps = {
  text: string;
  caretBlink: boolean;
  mentionProgress: number;
  mcpOpacity: number;
};

const WritingArea: React.FC<WritingAreaProps> = ({
  text,
  caretBlink,
  mentionProgress,
  mcpOpacity,
}) => {
  // Empty text === beat A pre-typewriter. We render both the blinking caret
  // AND the muted "Ask question" placeholder, mimicking a real composer at
  // rest. Real composers put the caret at the insertion point (position 0,
  // i.e. BEFORE the placeholder), so when in placeholder mode the caret
  // renders to the left of the placeholder text. As soon as a character is
  // typed, the caret moves to the right of the typed text instead.
  const isPlaceholder = text.length === 0;

  // @sundial typewriter: reveal characters in lockstep with the wrapper's
  // width animation so the prefix appears to type itself in. Trailing
  // space is part of MENTION_TEXT, so the gap to the question text grows
  // together with the characters.
  const mentionCharsVisible = Math.round(mentionProgress * MENTION_TEXT.length);
  const mentionVisibleText = MENTION_TEXT.slice(0, mentionCharsVisible);

  return (
    <div
      style={{
        display: 'flex',
        // Center alignment instead of baseline so the caret (a 24px filled
        // rectangle without a baseline reference) lines up with the text's
        // x-height region. Baseline alignment was causing the caret to ride
        // a few px high relative to the lowercase letters.
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        fontFamily: FUNNEL_STACK,
        fontWeight: 400,
        fontSize: TEXT_SIZE,
        lineHeight: `${TEXT_LINE_HEIGHT}px`,
        color: isPlaceholder ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.85)',
        letterSpacing: '-0.3px',
        // Single-line composer behaviour — the persistent query is long but
        // we sized every surface chatbox to 880 so it fits without wrap.
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
        {/* MCP wrapper — Beat C prefix. Width + opacity both ride mcpOpacity
            so the pill grows in from zero-width at the start of the line,
            sliding the question text right exactly the same way @sundial
            did. Sits BEFORE the @sundial wrapper so the two never overlap
            visually (only one is ever non-zero at a time). */}
        <span
          style={{
            opacity: mcpOpacity,
            width: MCP_RESERVED_WIDTH * mcpOpacity,
            display: 'inline-flex',
            alignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          aria-hidden={mcpOpacity < 0.001}
        >
          <McpTag />
        </span>
        {/* Mention wrapper — width rides mentionProgress, content is the
            typewriter substring. Both grow together so the prefix really
            reads as character-by-character typing rather than a fade. The
            wrapper is always mounted so the width interpolation stays
            continuous; progress = 0 collapses it to zero width. */}
        <span
          style={{
            opacity: mentionProgress > 0.001 ? 1 : 0,
            width: MENTION_RESERVED_WIDTH * mentionProgress,
            display: 'inline-flex',
            alignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          aria-hidden={mentionProgress < 0.001}
        >
          <SlackMention>{mentionVisibleText.trimEnd() || '\u200B'}</SlackMention>
        </span>
        {/* Caret + content order swaps based on placeholder mode so the
            caret always sits at the insertion point:
              - placeholder: [caret] [Ask question]
              - typing/full: [text]  [caret] */}
        {isPlaceholder ? (
          <>
            <Caret blink={caretBlink} />
            <span>Ask question</span>
          </>
        ) : (
          <>
            <span>{text}</span>
            <Caret blink={caretBlink} />
          </>
        )}
      </span>
    </div>
  );
};
