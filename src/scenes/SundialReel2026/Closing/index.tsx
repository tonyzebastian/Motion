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
import {
  fontFamily as aleo,
  loadFont as loadAleo,
} from '@remotion/google-fonts/Aleo';
import {
  ELEMENT_DURATION,
  ELEMENT_STAGGER,
  ELEMENT_START,
  SECTION_FADE_IN,
} from './timing';

loadFunnelSans('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});

loadAleo('normal', {
  weights: ['700'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;
const ALEO_STACK = `"${aleo}", "Georgia", "Times New Roman", serif`;

const PLUM = '#531D59';

const STATEMENT_LINE_1 = 'The smartest member of your team';
const STATEMENT_LINE_2 = "isn't a hire";

const CTA_LOGO_WIDTH = 320;
const CTA_LOGO_HEIGHT = 94;

// `soft-blur-in` signature easing (matches Headline / BrandStack enter).
const softBlur = Easing.bezier(0.22, 1, 0.36, 1);

// Per-element entrance magnitudes (rise + blur + fade).
const ENTER_LIFT_PX = 22;
const ENTER_BLUR_PX = 7;

// Each element rises + fades + de-blurs in, staggered by its reveal index.
const useReveal = (index: number) => {
  const frame = useCurrentFrame();
  const start = ELEMENT_START + index * ELEMENT_STAGGER;
  const end = start + ELEMENT_DURATION;
  const opacity = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: softBlur,
  });
  const translateY = interpolate(frame, [start, end], [ENTER_LIFT_PX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: softBlur,
  });
  const blur = interpolate(frame, [start, end], [ENTER_BLUR_PX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: softBlur,
  });
  return { opacity, translateY, blur };
};

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();

  // Section-level cross-dissolve in (overlaps the ExtendedCapabilities tail).
  const sectionOpacity = interpolate(frame, [0, SECTION_FADE_IN], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const logo = useReveal(0);
  const statement = useReveal(1);
  const button = useReveal(2);

  return (
    <AbsoluteFill
      style={{
        opacity: sectionOpacity,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 88,
          paddingLeft: 120,
          paddingRight: 120,
        }}
      >
        {/* Logo + statement grouped tightly together. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
          }}
        >
          <Img
            src={staticFile('logo.svg')}
            style={{
              width: CTA_LOGO_WIDTH,
              height: CTA_LOGO_HEIGHT,
              display: 'block',
              opacity: logo.opacity,
              transform: `translateY(${logo.translateY}px)`,
              filter: `blur(${logo.blur}px)`,
              willChange: 'transform, opacity, filter',
            }}
          />

          <div
            style={{
              color: PLUM,
              fontFamily: ALEO_STACK,
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              opacity: statement.opacity,
              transform: `translateY(${statement.translateY}px)`,
              filter: `blur(${statement.blur}px)`,
              willChange: 'transform, opacity, filter',
            }}
          >
            <div>{STATEMENT_LINE_1}</div>
            <div>{STATEMENT_LINE_2}</div>
          </div>
        </div>

        <div
          style={{
            opacity: button.opacity,
            transform: `translateY(${button.translateY}px)`,
            filter: `blur(${button.blur}px)`,
            willChange: 'transform, opacity, filter',
            background: PLUM,
            color: '#FFFFFF',
            fontFamily: FUNNEL_STACK,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: '0.01em',
            padding: '24px 56px',
            borderRadius: 999,
            boxShadow: '0 16px 50px rgba(83, 29, 89, 0.28)',
            whiteSpace: 'nowrap',
          }}
        >
          Ask us for a demo
        </div>
      </div>
    </AbsoluteFill>
  );
};
