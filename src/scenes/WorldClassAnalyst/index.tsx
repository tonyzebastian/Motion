import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import { MeshBackground } from '../SundialReel2026/MeshBackground';

loadFunnelSans('normal', {
  weights: ['500'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

const BRAND_COLOR = '#531D59';

const LOGO_WIDTH = 280;
const LOGO_HEIGHT = 82;
const STACK_GAP = 12;
const TAGLINE_FONT_SIZE = 48;
const TAGLINE_FONT_WEIGHT = 500;

// During Phase A the column sits slightly low so the logo reads as centered.
// Phase B lifts it back as the tagline materializes underneath.
const LOGO_PRE_OFFSET = Math.round((TAGLINE_FONT_SIZE * 1.1 + STACK_GAP) / 2);

const TAGLINE_WORDS = [
  'A',
  'world',
  'class',
  'data',
  'analyst',
  'and',
  'engineer',
];

const TIMING = {
  logoDuration: 36,
  // Logo lands, holds alone, then the tagline begins.
  taglineLeadInFromLogoStart: 54,
  taglinePushDuration: 22,
  taglineStagger: 6,
  taglineWordDuration: 22,
} as const;

const LOGO_RISE_PX = 17;
const LOGO_BLUR_PX = 6;
const TAGLINE_WORD_LIFT_PX = 12;
const TAGLINE_WORD_BLUR_PX = 8;

const maskEnterEase = Easing.bezier(0.22, 1, 0.36, 1);
const smoothGlide = Easing.bezier(0.16, 1, 0.3, 1);

const BREATHE_SCALE_END = 1.035;
const BREATHE_DURATION = 260;
const breatheEase = Easing.inOut(Easing.quad);

const LOGO_END = TIMING.logoDuration;
const TAGLINE_PUSH_START = TIMING.taglineLeadInFromLogoStart;
const TAGLINE_PUSH_END = TAGLINE_PUSH_START + TIMING.taglinePushDuration;
const TAGLINE_WORDS_START = TAGLINE_PUSH_START;

// Hold the settled lockup for a few seconds after the last word lands.
export const WORLD_CLASS_ANALYST_DURATION = 600;

export const WorldClassAnalystScene: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, LOGO_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: maskEnterEase,
  });
  const logoY = interpolate(frame, [0, LOGO_END], [LOGO_RISE_PX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: maskEnterEase,
  });
  const logoBlur = interpolate(frame, [0, LOGO_END], [LOGO_BLUR_PX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: maskEnterEase,
  });

  const stackOffsetY = interpolate(
    frame,
    [TAGLINE_PUSH_START, TAGLINE_PUSH_END],
    [LOGO_PRE_OFFSET, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smoothGlide,
    },
  );

  const centerBreathe = interpolate(
    frame,
    [0, BREATHE_DURATION],
    [1, BREATHE_SCALE_END],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: breatheEase,
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF' }}>
      <MeshBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FUNNEL_STACK,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <div
          style={{
            transform: `translateY(${stackOffsetY}px) scale(${centerBreathe})`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: STACK_GAP,
            }}
          >
            <div
              style={{
                width: LOGO_WIDTH,
                height: LOGO_HEIGHT,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Img
                src={staticFile('logo.svg')}
                style={{
                  width: LOGO_WIDTH,
                  height: LOGO_HEIGHT,
                  display: 'block',
                  opacity: logoOpacity,
                  transform: `translateY(${logoY}px)`,
                  filter: `blur(${logoBlur}px)`,
                  willChange: 'transform, opacity, filter',
                }}
              />
            </div>
            <div
              style={{
                color: BRAND_COLOR,
                fontSize: TAGLINE_FONT_SIZE,
                fontWeight: TAGLINE_FONT_WEIGHT,
                lineHeight: 'normal',
                display: 'inline-flex',
                flexWrap: 'nowrap',
                justifyContent: 'center',
                columnGap: '0.32em',
                whiteSpace: 'nowrap',
              }}
            >
              {TAGLINE_WORDS.map((word, i) => {
                const start = TAGLINE_WORDS_START + i * TIMING.taglineStagger;
                const end = start + TIMING.taglineWordDuration;
                const opacity = interpolate(frame, [start, end], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: maskEnterEase,
                });
                const y = interpolate(
                  frame,
                  [start, end],
                  [TAGLINE_WORD_LIFT_PX, 0],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: maskEnterEase,
                  },
                );
                const blur = interpolate(
                  frame,
                  [start, end],
                  [TAGLINE_WORD_BLUR_PX, 0],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: maskEnterEase,
                  },
                );
                return (
                  <span
                    key={`${word}-${i}`}
                    style={{
                      display: 'inline-block',
                      opacity,
                      transform: `translateY(${y}px)`,
                      filter: `blur(${blur}px)`,
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
