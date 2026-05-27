import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import { SLACK_MENTION_BG, SLACK_MENTION_TEXT } from './Chatbox';

loadFunnelSans('normal', {
  weights: ['400', '500', '700'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

// Phone container — outline-only "wireframe" frame around the conversation
// and chatbox. Sized to comfortably contain the 880-wide Slack chatbox at
// the section's geometric anchor (canvas y=540), with a 40px GUTTER on each
// side so the chatbox + thread message rows align flush with the phone's
// inset edges. The phone is intentionally taller than the canvas so its
// TOP extends off-canvas and gets clipped at y=0, giving the "device peeks
// in from above" feel. There is no header, no fill, no shadow — only the
// chatbox reads as a "real" filled UI element.
const PHONE_WIDTH = 960;
// Phone bottom sits ~70px below the chatbox — close enough to feel like a
// tight mobile-app frame around the composer rather than a tall device
// with empty space at the bottom. Top is still off-canvas (top = -40);
// phone bottom now lands at canvas y = 660.
const PHONE_HEIGHT = 700;
const PHONE_TOP = -40;
const PHONE_LEFT = (1920 - PHONE_WIDTH) / 2;
const PHONE_RADIUS = 40;

// Inside gutter for thread content. Sized so message rows align flush with
// the chatbox's left/right edges: PHONE_WIDTH 960 minus chatbox 880 = 80px
// split into 40 per side.
const GUTTER = 40;

// Top padding inside the phone before the thread begins. We skip the channel
// header entirely (wireframe → minimal chrome) and let the skeleton rows
// start near the off-canvas cutoff. Lowered 56 → 20 so the whole thread
// shifts upward, opening up real breathing room between the Sundial bot's
// last line and the chatbox below it (the chatbox stays pixel-locked at
// canvas y = 540, so moving the thread up is the only way to widen this
// gap without moving the anchor).
const THREAD_TOP_IN_PHONE = 20;

// Colors
const WIREFRAME_LINE = 'rgba(0, 0, 0, 0.28)';
const DIVIDER = 'rgba(0, 0, 0, 0.08)';
const MUTED = 'rgba(0, 0, 0, 0.45)';
const TEXT = 'rgba(0, 0, 0, 0.85)';
const NEW_RED = '#E01E5A';
const APP_BG = 'rgba(0, 0, 0, 0.06)';
const APP_TEXT = 'rgba(0, 0, 0, 0.55)';
const SKELETON = 'rgba(0, 0, 0, 0.08)';

// Sundial bot avatar palette — four sundial-adjacent quadrants (plum, coral,
// gold, mint) arranged as a Slackbot-style mosaic so the persona reads as a
// dedicated bot identity rather than a regular user.
const BOT_QUADRANTS = ['#531D59', '#E45D7D', '#E8A93C', '#4FB892'] as const;

// Avatar geometry — shared by all avatar variants (bot, person, skeleton)
// so the gutter and 1st-line baseline of every MessageRow line up perfectly.
// Bumped from 48 → 56 (radius 10 → 12) so the conversation reads with more
// presence now that the tab bar is gone and the thread is the only chrome.
const AVATAR_SIZE = 56;
const AVATAR_RADIUS = 12;

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const DateDivider: React.FC<{ label: string; showNew?: boolean }> = ({ label, showNew }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      paddingInline: GUTTER,
      paddingBlock: 6,
    }}
  >
    <div style={{ flex: 1, height: 1, backgroundColor: DIVIDER }} />
    <span
      style={{
        fontFamily: FUNNEL_STACK,
        fontWeight: 500,
        fontSize: 13,
        color: MUTED,
        textTransform: 'none',
        letterSpacing: '0.1px',
      }}
    >
      {label}
    </span>
    {showNew && (
      <span
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 700,
          fontSize: 11,
          color: '#FFFFFF',
          backgroundColor: NEW_RED,
          paddingInline: 8,
          paddingBlock: 3,
          borderRadius: 4,
          letterSpacing: '0.4px',
        }}
      >
        NEW
      </span>
    )}
    <div style={{ flex: 1, height: 1, backgroundColor: DIVIDER }} />
  </div>
);

// ---------------------------------------------------------------------------
// Avatar variants — all share AVATAR_SIZE / AVATAR_RADIUS so message rows line
// up regardless of which avatar variant they're rendered with.
// ---------------------------------------------------------------------------

const AvatarBox: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_RADIUS,
      flexShrink: 0,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

const PersonAvatar: React.FC<{ color: string }> = ({ color }) => (
  <AvatarBox style={{ backgroundColor: color }} />
);

// Initial-based person avatar (Slack/Gmail fallback style). Used for real
// human authors who need to read as a person, not a placeholder.
const InitialAvatar: React.FC<{ initial: string; background: string }> = ({
  initial,
  background,
}) => (
  <AvatarBox
    style={{
      backgroundColor: background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span
      style={{
        fontFamily: FUNNEL_STACK,
        fontWeight: 700,
        fontSize: 26,
        color: '#FFFFFF',
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  </AvatarBox>
);

// Slackbot-style 2x2 mosaic in Sundial colors. No facial features — keeps the
// mark calm and brand-aligned while still reading as a bot persona.
const SundialBotAvatar: React.FC = () => (
  <AvatarBox
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    }}
  >
    {BOT_QUADRANTS.map((c) => (
      <div key={c} style={{ backgroundColor: c }} />
    ))}
  </AvatarBox>
);

// ---------------------------------------------------------------------------
// Skeleton row — implies prior chatter without competing with the real
// messages or the composer. Lightweight grey bars + a desaturated avatar.
// ---------------------------------------------------------------------------

const SkeletonRow: React.FC<{ avatarColor: string; widths: number[] }> = ({
  avatarColor,
  widths,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 14,
      paddingInline: GUTTER,
      paddingBlock: 6,
      alignItems: 'flex-start',
    }}
  >
    <PersonAvatar color={avatarColor} />
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingTop: 10,
      }}
    >
      {widths.map((w, i) => (
        <div
          // Static skeleton — indexes are stable across renders.
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={{
            height: 11,
            borderRadius: 6,
            backgroundColor: SKELETON,
            width: `${w}%`,
          }}
        />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Rich-message building blocks (quote block + label/value rows) for the
// structured Sundial bot reply.
// ---------------------------------------------------------------------------

const QuoteBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      borderLeft: '3px solid rgba(0, 0, 0, 0.18)',
      paddingLeft: 16,
      marginTop: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    {children}
  </div>
);

const LabelValue: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      fontFamily: FUNNEL_STACK,
      fontSize: 25,
      lineHeight: '34px',
      color: TEXT,
      letterSpacing: '-0.2px',
    }}
  >
    <span style={{ fontWeight: 700 }}>{label}:</span>{' '}
    <span style={{ fontWeight: 400 }}>{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// MessageRow — now takes a custom avatar node, so bot, person, and skeleton
// variants can all share the same layout.
// ---------------------------------------------------------------------------

type MessageRowProps = {
  authorName: string;
  isApp?: boolean;
  avatar: React.ReactNode;
  timestamp: string;
  children: React.ReactNode;
};

const MessageRow: React.FC<MessageRowProps> = ({
  authorName,
  isApp,
  avatar,
  timestamp,
  children,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 14,
      paddingInline: GUTTER,
      // Bumped 6 → 12 so there is real breathing room between Tony and the
      // Sundial reply, and between the Sundial reply and the chatbox below.
      paddingBlock: 12,
      alignItems: 'flex-start',
    }}
  >
    {avatar}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          style={{
            fontFamily: FUNNEL_STACK,
            fontWeight: 700,
            fontSize: 24,
            color: TEXT,
            letterSpacing: '-0.2px',
          }}
        >
          {authorName}
        </span>
        {isApp && (
          <span
            style={{
              fontFamily: FUNNEL_STACK,
              fontWeight: 700,
              fontSize: 11,
              color: APP_TEXT,
              backgroundColor: APP_BG,
              paddingInline: 6,
              paddingBlock: 2,
              borderRadius: 3,
              letterSpacing: '0.4px',
              transform: 'translateY(-2px)',
            }}
          >
            APP
          </span>
        )}
        <span
          style={{
            fontFamily: FUNNEL_STACK,
            fontWeight: 400,
            fontSize: 16,
            color: MUTED,
          }}
        >
          {timestamp}
        </span>
      </div>
      <div
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 400,
          fontSize: 26,
          lineHeight: '34px',
          color: TEXT,
          letterSpacing: '-0.2px',
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

const SlackMentionInline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      paddingInline: 4,
      paddingBlock: 1,
      borderRadius: 3,
      backgroundColor: SLACK_MENTION_BG,
      color: SLACK_MENTION_TEXT,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export const SlackShell: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Wireframe phone frame — outline-only so the chatbox below reads as
          the only "real" UI element. No fill, no drop shadow, no header. */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT,
          top: PHONE_TOP,
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          backgroundColor: 'transparent',
          borderRadius: PHONE_RADIUS,
          border: `1.5px solid ${WIREFRAME_LINE}`,
          overflow: 'hidden',
        }}
      >
        {/* Chat thread starts a bit below the phone's off-canvas top cutoff
            (no channel header in the wireframe). */}
        <div
          style={{
            position: 'absolute',
            top: THREAD_TOP_IN_PHONE,
            left: 0,
            right: 0,
          }}
        >
          {/* Skeleton rows imply prior #data-questions chatter without
              competing with the real Sundial conversation below. */}
          <SkeletonRow avatarColor="#A6B7D9" widths={[68, 52]} />
          <SkeletonRow avatarColor="#D9C2B0" widths={[78, 60, 44]} />

          <DateDivider label="Yesterday" />

          <MessageRow
            authorName="Tony"
            avatar={<InitialAvatar initial="T" background="#C58A57" />}
            timestamp="4:12 PM"
          >
            <SlackMentionInline>@sundial</SlackMentionInline>
            {' what was our DAU last week?'}
          </MessageRow>

          <MessageRow
            authorName="Sundial"
            isApp
            avatar={<SundialBotAvatar />}
            timestamp="4:12 PM"
          >
            DAU last week was{' '}
            <span style={{ fontWeight: 700 }}>12,847</span> —{' '}
            <span style={{ color: '#1F8E3D', fontWeight: 700 }}>up 8% WoW</span>.
            <QuoteBlock>
              <LabelValue label="Top driver" value="Workspace D7 activation" />
              <LabelValue
                label="Compared to"
                value="prior week (11,895)"
              />
              <LabelValue label="Outlook" value="On track to hit Q3 target" />
            </QuoteBlock>
          </MessageRow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
