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

loadFunnelSans('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

const BRAND_COLOR = '#531D59';
// Subtle structural marks (hairlines + pipes) — brand color at low alpha so
// they read as dividers rather than competing with the logos and label.
const HAIRLINE_COLOR = 'rgba(83, 29, 89, 0.35)';

// Trusted-by group anchored at y=895 from the top of the 1080 viewport.
const TRUSTED_BY_TOP = 895;

// Logo + tagline — Figma nodes 260:1625 / 260:1626 / 260:1631.
const LOGO_WIDTH = 340;
const LOGO_HEIGHT = 100;
const STACK_GAP = 12;
const TAGLINE_FONT_SIZE = 48;
const TAGLINE_FONT_WEIGHT = 500; // Funnel Sans Medium

// During Phase A (logo entering alone) the column is pushed DOWN by this
// amount so the logo appears at viewport center. Phase B animates this back
// to 0, which visually lifts the logo upward as the tagline materializes
// underneath it. Computed as half of (tagline visual block + gap) so the
// shift exactly compensates for the tagline that has yet to appear.
const LOGO_PRE_OFFSET = Math.round((TAGLINE_FONT_SIZE * 1.1 + STACK_GAP) / 2);

const TAGLINE_WORDS = ['Opinionated', 'Intelligence', 'for', 'data', 'teams.'];

// Trusted-by group — Figma nodes 260:1662 / 260:1714 / 260:1660.
const TRUSTED_BY_GAP = 24; // between label-row and logo-row
const LABEL_GROUP_GAP = 8; // between hairlines and "Trusted by" label
const HAIRLINE_WIDTH = 120;
const HAIRLINE_HEIGHT = 1;
const TRUSTED_BY_LABEL_SIZE = 26;
const PIPE_WIDTH = 1;
const PIPE_HEIGHT = 28;
const LOGO_ROW_GAP = 40;

// Customer logos pulled from the Sundial.ai homepage hero.
const CUSTOMER_LOGO_HEIGHT = 40;
const CUSTOMER_LOGO_OPACITY = 0.82;

type CustomerLogo = {
  readonly key: string;
  readonly src: string;
  readonly aspect: number; // width / height of the source asset
};

const CUSTOMER_LOGOS: ReadonlyArray<CustomerLogo> = [
  { key: 'character-ai', src: 'customer-logos/character-ai.png', aspect: 720 / 168 },
  { key: 'openai', src: 'customer-logos/openai.png', aspect: 456 / 168 },
  { key: 'gamma', src: 'customer-logos/gamma.png', aspect: 528 / 168 },
  { key: 'picsart', src: 'customer-logos/picsart.png', aspect: 474 / 168 },
  { key: 'mirage', src: 'customer-logos/mirage.png', aspect: 500 / 150 },
];

// === Three-phase motion timeline ===
// Phase A: logo mask-reveal-up.enter
// Phase B: tagline soft-blur-in + push (logo lifts up to make room)
// Phase C: trusted-by group rises in as one unit, starts just before tagline
//          finishes
const TIMING = {
  logoDuration: 36,
  // Tagline starts this many frames after the logo's entrance begins. Set
  // beyond `logoDuration` so the logo gets clear solo screen time before
  // the tagline materializes underneath it. (logoDuration=36, so 54 = logo
  // lands at 36, holds alone for 18 frames, then tagline begins at 54.)
  taglineLeadInFromLogoStart: 54,
  taglinePushDuration: 22,         // how long the "lift the logo up" push takes
  taglineStagger: 6,                // per-word stagger for soft-blur-in
  taglineWordDuration: 22,          // per-word entrance duration
  trustedLeadInBeforeTaglineEnd: 10, // trusted-by starts this many frames before tagline finishes
  trustedDuration: 40,              // unified rise-up duration for trusted-by block
} as const;

// `mask-reveal-up.enter`: from { y_px: 30, blur: 6, opacity: 0 } → settled.
const LOGO_RISE_PX = 17;
const LOGO_BLUR_PX = 6;

// Tagline per-word soft-blur-in tuning — echoes the headline's signature
// entrance with smaller magnitudes to suit the smaller copy.
const TAGLINE_WORD_LIFT_PX = 12;
const TAGLINE_WORD_BLUR_PX = 8;

// Trusted-by unified entrance (single block, no per-element stagger).
const TRUSTED_LIFT_PX = 22;
const TRUSTED_BLUR_PX = 8;

const smoothGlide = Easing.bezier(0.16, 1, 0.3, 1);
// `mask-reveal-up.enter` / `soft-blur-in` / settle curve, shared across phases.
const maskEnterEase = Easing.bezier(0.22, 1, 0.36, 1);

// === Continuous breathe scale (1.0 → 1.035) ===
const BREATHE_SCALE_END = 1.035;
const BREATHE_DURATION = 260;
const breatheEase = Easing.inOut(Easing.quad);

const LOGO_END = TIMING.logoDuration;
const TAGLINE_PUSH_START = TIMING.taglineLeadInFromLogoStart;
const TAGLINE_PUSH_END = TAGLINE_PUSH_START + TIMING.taglinePushDuration;
const TAGLINE_WORDS_START = TAGLINE_PUSH_START;
const TAGLINE_WORDS_END =
  TAGLINE_WORDS_START +
  (TAGLINE_WORDS.length - 1) * TIMING.taglineStagger +
  TIMING.taglineWordDuration;
const TAGLINE_FINISH = Math.max(TAGLINE_PUSH_END, TAGLINE_WORDS_END);
const TRUSTED_START = TAGLINE_FINISH - TIMING.trustedLeadInBeforeTaglineEnd;
const TRUSTED_END = TRUSTED_START + TIMING.trustedDuration;

export const BrandStack: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Phase A: logo mask-reveal-up.enter ---
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

  // --- Phase B: stack push (logo lifts up to make room for tagline) ---
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

  // --- Phase C: trusted-by unified entrance ---
  const trustedOpacity = interpolate(
    frame,
    [TRUSTED_START, TRUSTED_END],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskEnterEase,
    },
  );
  const trustedY = interpolate(
    frame,
    [TRUSTED_START, TRUSTED_END],
    [TRUSTED_LIFT_PX, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskEnterEase,
    },
  );
  const trustedBlur = interpolate(
    frame,
    [TRUSTED_START, TRUSTED_END],
    [TRUSTED_BLUR_PX, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskEnterEase,
    },
  );

  // --- Continuous breathe scale (logo + tagline column only) ---
  // The center stack breathes from the moment the logo begins entering
  // (frame 0) so the wordmark and tagline feel alive while they sit on
  // screen. The trusted-by group stays at scale 1 — no breathe applied.
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
    <>
      {/* Center stack: logo + tagline. Anchored at viewport center so the
          Phase B push gives a clearly visible upward lift. */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FUNNEL_STACK,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Phase B push wrapper — translates the column up as the tagline
            materializes, and breathes (1.0 → 1.035) so the wordmark and
            tagline subtly expand while on screen. */}
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
            {/* Logo mask wrapper: overflow:hidden clips the upward rise so the
                entrance reads as a "mask reveal up" through the wrapper edge. */}
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

      {/* Trusted-by group: rises in as one block once the tagline is about to
          finish. Anchored at top:895 (matches Figma node 260:1662). */}
      <AbsoluteFill
        style={{
          fontFamily: FUNNEL_STACK,
          WebkitFontSmoothing: 'antialiased',
          opacity: trustedOpacity,
          transform: `translateY(${trustedY}px)`,
          filter: `blur(${trustedBlur}px)`,
          willChange: 'transform, opacity, filter',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: TRUSTED_BY_TOP,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: TRUSTED_BY_GAP,
          }}
        >
          {/* "──── Trusted by ────" label row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: LABEL_GROUP_GAP,
            }}
          >
            <div
              style={{
                width: HAIRLINE_WIDTH,
                height: HAIRLINE_HEIGHT,
                background: HAIRLINE_COLOR,
              }}
            />
            <div
              style={{
                color: BRAND_COLOR,
                fontSize: TRUSTED_BY_LABEL_SIZE,
                fontWeight: 400,
                lineHeight: 'normal',
                whiteSpace: 'nowrap',
              }}
            >
              Trusted by
            </div>
            <div
              style={{
                width: HAIRLINE_WIDTH,
                height: HAIRLINE_HEIGHT,
                background: HAIRLINE_COLOR,
              }}
            />
          </div>

          {/* Customer logos separated by vertical pipes (1px × 21px). */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: LOGO_ROW_GAP,
            }}
          >
            {CUSTOMER_LOGOS.map((logo, i) => {
              const width = Math.round(CUSTOMER_LOGO_HEIGHT * logo.aspect);
              return (
                <React.Fragment key={logo.key}>
                  {i > 0 ? (
                    <div
                      style={{
                        width: PIPE_WIDTH,
                        height: PIPE_HEIGHT,
                        background: HAIRLINE_COLOR,
                      }}
                    />
                  ) : null}
                  <Img
                    src={staticFile(logo.src)}
                    style={{
                      height: CUSTOMER_LOGO_HEIGHT,
                      width,
                      display: 'block',
                      objectFit: 'contain',
                      opacity: CUSTOMER_LOGO_OPACITY,
                    }}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
