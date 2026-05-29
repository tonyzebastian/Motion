import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import {
  fontFamily as aleo,
  loadFont as loadAleo,
} from '@remotion/google-fonts/Aleo';
import { FEATURES } from './features';
import {
  CARDS_FADE_DURATION,
  CARD_DURATION,
  CARD_STAGGER,
  CARD_START,
  CTA_DURATION,
  CTA_START,
  FEATURE_COUNT,
  HEADER_DURATION,
  HEADER_START,
  OUTRO_START,
  SECTION_FADE_IN,
  STATEMENT_DURATION,
} from './timing';

loadFunnelSans('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

loadAleo('normal', {
  weights: ['600'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;
const ALEO_STACK = `"${aleo}", "Georgia", "Times New Roman", serif`;
const PLUM = '#531D59';

// --- Layout (1920x1080) ---
// A balanced 4-col x 4-row bento ring around the centered heading. The middle
// column + row tracks are narrower/shorter than the outer ones so the cards
// hug the heading. Mirror-symmetric weight: wide bars top + bottom, tall cards
// on the sides, small cards in the corners, one corner left as a ghost.
const GRID_GAP = 22;
const COL_W = [470, 290, 290, 470];
const ROW_H = [196, 104, 104, 196];
const CONTENT_WIDTH = COL_W.reduce((a, b) => a + b, 0) + GRID_GAP * (COL_W.length - 1);
const GRID_HEIGHT = ROW_H.reduce((a, b) => a + b, 0) + GRID_GAP * (ROW_H.length - 1);
const GRID_LEFT = Math.round((1920 - CONTENT_WIDTH) / 2);
const GRID_TOP = Math.round((1080 - GRID_HEIGHT) / 2);

const BENTO_AREAS = [
  '"dashboards    mcp   mcp   artifacts"',
  '"observability title title applied"',
  '"observability title title applied"',
  '"evals         more  more  git"',
].join(' ');

// Uniform heading + description sizes across every tile.
const TITLE_FONT_SIZE = 34;
const DESC_FONT_SIZE = 21;

// `soft-blur-in` signature easing (matches Headline / Caption).
const smoothGlide = Easing.bezier(0.16, 1, 0.3, 1);
// Snappy ease-out-back: overshoots slightly past the target then settles.
const snappyPop = Easing.bezier(0.34, 1.56, 0.64, 1);
// Opacity rides a quicker ease so cards become visible fast (snappy).
const fastIn = Easing.out(Easing.cubic);

const cardFrame = {
  boxSizing: 'border-box' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center' as const,
  background: 'rgba(255, 255, 255, 0.55)',
  border: '1px solid rgba(83, 29, 89, 0.12)',
  borderRadius: 24,
  boxShadow: '0 10px 40px rgba(83, 29, 89, 0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

// Snappy pop shared by every card, keyed off its reveal index.
const usePop = (index: number) => {
  const frame = useCurrentFrame();
  const start = CARD_START + index * CARD_STAGGER;
  const end = start + CARD_DURATION;
  const pop = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: snappyPop,
  });
  const opacity = interpolate(frame, [start, start + CARD_DURATION * 0.55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: fastIn,
  });
  return { opacity, popY: (1 - pop) * 26, scale: 0.9 + pop * 0.1 };
};

const FeatureCard: React.FC<{
  index: number;
  outroOpacity: number;
  outroScale: number;
}> = ({ index, outroOpacity, outroScale }) => {
  const feature = FEATURES[index];
  const { opacity, popY, scale } = usePop(index);

  return (
    <div
      style={{
        ...cardFrame,
        gridArea: feature.area,
        padding: 32,
        opacity: opacity * outroOpacity,
        transform: `translateY(${popY}px) scale(${scale * outroScale})`,
        transformOrigin: '50% 60%',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 600,
          fontSize: TITLE_FONT_SIZE,
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
          color: PLUM,
        }}
      >
        {feature.title}
      </div>

      <div
        style={{
          marginTop: 12,
          maxWidth: 420,
          fontFamily: FUNNEL_STACK,
          fontWeight: 400,
          fontSize: DESC_FONT_SIZE,
          lineHeight: 1.4,
          color: 'rgba(83, 29, 89, 0.62)',
        }}
      >
        {feature.description}
      </div>
    </div>
  );
};

// "And much more" — a distinct closer card (tinted, centered, no description).
const MoreCard: React.FC<{ outroOpacity: number; outroScale: number }> = ({
  outroOpacity,
  outroScale,
}) => {
  const { opacity, popY, scale } = usePop(FEATURE_COUNT);
  return (
    <div
      style={{
        ...cardFrame,
        gridArea: 'more',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(83, 29, 89, 0.07)',
        border: '1px solid rgba(83, 29, 89, 0.16)',
        opacity: opacity * outroOpacity,
        transform: `translateY(${popY}px) scale(${scale * outroScale})`,
        transformOrigin: '50% 60%',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: '0.01em',
          color: PLUM,
        }}
      >
        And much more
      </div>
    </div>
  );
};

export const ExtendedCapabilities: React.FC = () => {
  const frame = useCurrentFrame();

  // Section-level cross-dissolve in (overlaps the Playbook tail).
  const sectionOpacity = interpolate(frame, [0, SECTION_FADE_IN], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Center heading — soft rise + fade.
  const headerReveal = interpolate(
    frame,
    [HEADER_START, HEADER_START + HEADER_DURATION],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smoothGlide,
    },
  );
  const headerY = (1 - headerReveal) * 22;

  // --- Outro beat ---
  // 1. Cards fade away (slight scale-down for a gentle recede).
  const cardsOutro = interpolate(
    frame,
    [OUTRO_START, OUTRO_START + CARDS_FADE_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smoothGlide },
  );
  const cardsOpacity = cardsOutro;
  const cardsScale = 0.97 + cardsOutro * 0.03;

  // 2. Center subtext "Also ships with" crossfades into the statement, in
  //    place, so "Sundial AI" above never shifts.
  const statementSwap = interpolate(
    frame,
    [OUTRO_START, OUTRO_START + STATEMENT_DURATION],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smoothGlide },
  );
  const subtitleOpacity = 1 - statementSwap;
  const subtitleY = statementSwap * -12;
  const statementOpacity = statementSwap;
  const statementY = (1 - statementSwap) * 14;

  // 3. CTA rises in beneath the statement.
  const ctaSwap = interpolate(
    frame,
    [CTA_START, CTA_START + CTA_DURATION],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smoothGlide },
  );
  const ctaOpacity = ctaSwap;
  const ctaY = (1 - ctaSwap) * 18;

  return (
    <AbsoluteFill style={{ opacity: sectionOpacity, WebkitFontSmoothing: 'antialiased' }}>
      <div
        style={{
          position: 'absolute',
          top: GRID_TOP,
          left: GRID_LEFT,
          width: CONTENT_WIDTH,
          height: GRID_HEIGHT,
          display: 'grid',
          gridTemplateColumns: COL_W.map((w) => `${w}px`).join(' '),
          gridTemplateRows: ROW_H.map((h) => `${h}px`).join(' '),
          gridTemplateAreas: BENTO_AREAS,
          columnGap: GRID_GAP,
          rowGap: GRID_GAP,
        }}
      >
        {/* Center brand block — "Sundial AI" with a swapping subtext beneath,
            and (in the outro) the demo CTA anchored just below it. */}
        <div
          style={{
            position: 'relative',
            gridArea: 'title',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: headerReveal,
            transform: `translateY(${headerY}px)`,
            willChange: 'transform, opacity',
          }}
        >
          <div
            style={{
              fontFamily: ALEO_STACK,
              fontWeight: 600,
              fontSize: 62,
              lineHeight: 1.05,
              color: PLUM,
            }}
          >
            Sundial AI
          </div>
          {/* Subtext slot — "Also ships with" crossfades out as the closing
              statement rises in, in place. Both stacked so "Sundial AI" above
              never shifts. */}
          <div
            style={{
              position: 'relative',
              marginTop: 14,
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                fontFamily: FUNNEL_STACK,
                fontWeight: 500,
                fontSize: 28,
                letterSpacing: '0.01em',
                color: 'rgba(83, 29, 89, 0.7)',
                whiteSpace: 'nowrap',
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleY}px)`,
                willChange: 'transform, opacity',
                pointerEvents: 'none',
              }}
            >
              Also ships with
            </div>
            <div
              style={{
                position: 'absolute',
                fontFamily: FUNNEL_STACK,
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1.25,
                letterSpacing: '0.01em',
                color: PLUM,
                whiteSpace: 'nowrap',
                opacity: statementOpacity,
                transform: `translateY(${statementY}px)`,
                willChange: 'transform, opacity',
                pointerEvents: 'none',
              }}
            >
              <div>The smartest member of your team</div>
              <div>isn&apos;t a hire.</div>
            </div>
          </div>

          {/* Demo CTA — anchored just below the brand block so it can appear
              without reflowing "Sundial AI" / the statement above. */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              marginTop: 24,
              background: PLUM,
              color: '#FFFFFF',
              fontFamily: FUNNEL_STACK,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: '0.01em',
              padding: '16px 40px',
              borderRadius: 999,
              boxShadow: '0 14px 40px rgba(83, 29, 89, 0.28)',
              whiteSpace: 'nowrap',
              opacity: ctaOpacity,
              transform: `translate(-50%, ${ctaY}px)`,
              willChange: 'transform, opacity',
            }}
          >
            Ask us for a demo
          </div>
        </div>

        {FEATURES.map((feature, i) => (
          <FeatureCard
            key={feature.id}
            index={i}
            outroOpacity={cardsOpacity}
            outroScale={cardsScale}
          />
        ))}
        <MoreCard outroOpacity={cardsOpacity} outroScale={cardsScale} />
      </div>
    </AbsoluteFill>
  );
};
