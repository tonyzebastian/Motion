import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import { fontFamily as aleo, loadFont as loadAleo } from '@remotion/google-fonts/Aleo';

loadFunnelSans('normal', {
  weights: ['300'],
  subsets: ['latin'],
});

loadAleo('normal', {
  weights: ['700'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;
const ALEO_STACK = `"${aleo}", "Georgia", "Times New Roman", serif`;

const HEADLINE_COLOR = '#531D59';
const LINE1_FONT_SIZE = 56;
const LINE2_FONT_SIZE = 92;
const STACK_GAP = 20;

// STACK_OFFSET = half of (line 2 size + gap) so line 1 sits in the visual
// center of the viewport during Phase A: (92 + 20) / 2 = 56.
const STACK_OFFSET = 56;

const LINE1_TEXT = "Data doesn't make you smart.";
const LINE1_CHARS = Array.from(LINE1_TEXT);
const LINE2_TEXT = 'Judgment does.';

// === Soft-blur-IN (per-character) — line 1 entrance ===
// Site-scaled timing from the animate-text catalog `soft-blur-in` spec.
const LINE1_CHAR_DURATION = 39;          // ~648ms at 60fps (scaled 0.72x of 900ms)
const LINE1_CHAR_STAGGER = 1;            // ~17ms at 60fps (≈ scaled 18ms)
const LINE1_CHAR_LIFT_PX = 10;           // 16px * 0.58 site multiplier
const LINE1_CHAR_BLUR_PX = 12;

// === Mask-reveal-up EXIT (per-line) — both lines exit ===
// `mask-reveal-up.exit` from the animate-text catalog. Each line lifts upward,
// fades out, and blurs away while being clipped by an overflow:hidden mask
// wrapper — giving a "mask wipe up" feel rather than per-character dispersion.
// Scaled site values: duration 374ms (~22f), stagger 50ms (~3-4f),
// y_px 0 → -22 * 0.58 multiplier ≈ -13px, blur_px 0 → 6.
const MASK_EXIT_DURATION = 22;
const MASK_EXIT_LINE_STAGGER = 4;
const MASK_EXIT_Y_PX = -13;
const MASK_EXIT_BLUR_PX = 6;

const LINE2_RISE_PX = 100;
const LINE2_SCALE_FROM = 0.92;

// Subtle "breathe" — once each line lands, it slowly scales up by a hair so
// the held headline never feels static. Very gentle, almost imperceptible.
const HOLD_SCALE_END = 1.035;

const snappy = Easing.out(Easing.cubic);
// `soft-blur-in` signature easing: gentle ease-out with no overshoot.
const softBlur = Easing.bezier(0.22, 1, 0.36, 1);
// `mask-reveal-up.exit` easing: ease-in for the upward mask wipe.
const maskExitEase = Easing.bezier(0.64, 0, 0.78, 0);
// Opacity uses a more balanced curve so visibility actually decays
// throughout the (shortened) opacity window instead of dumping at the end.
const maskExitEaseOpacity = Easing.bezier(0.4, 0, 0.4, 1);
// Snappy-but-smooth ease for line 2 (iOS-style ease-out spring without overshoot).
const smoothGlide = Easing.bezier(0.16, 1, 0.3, 1);

export const INTRO_TIMING = {
  charStagger: LINE1_CHAR_STAGGER,
  charDuration: LINE1_CHAR_DURATION,
  charCount: LINE1_CHARS.length,
  pauseFrames: 0,
  phaseBDuration: 30,
  meshFadeDuration: 90,
} as const;

const PHASE_A_END =
  (INTRO_TIMING.charCount - 1) * INTRO_TIMING.charStagger +
  INTRO_TIMING.charDuration;

export const PHASE_B_START = PHASE_A_END + INTRO_TIMING.pauseFrames;
export const PHASE_B_END = PHASE_B_START + INTRO_TIMING.phaseBDuration;
export const MESH_FADE_START = PHASE_B_START;
export const MESH_FADE_END = MESH_FADE_START + INTRO_TIMING.meshFadeDuration;
export const HEADLINE_HOLD_END = PHASE_B_END + 60;

// Exit length covers both lines: the slower line (line 2) begins
// MASK_EXIT_LINE_STAGGER frames after line 1 and runs MASK_EXIT_DURATION.
const HEADLINE_EXIT_TOTAL = MASK_EXIT_LINE_STAGGER + MASK_EXIT_DURATION;
export const HEADLINE_FADE_END = HEADLINE_HOLD_END + HEADLINE_EXIT_TOTAL;

export const Headline: React.FC = () => {
  const frame = useCurrentFrame();

  const stackOffsetY = interpolate(
    frame,
    [PHASE_B_START, PHASE_B_END],
    [STACK_OFFSET, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smoothGlide,
    },
  );

  const line2Opacity = interpolate(
    frame,
    [PHASE_B_START, PHASE_B_END],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: snappy,
    },
  );
  const line2Y = interpolate(
    frame,
    [PHASE_B_START, PHASE_B_END],
    [LINE2_RISE_PX, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smoothGlide,
    },
  );
  const line2Scale = interpolate(
    frame,
    [PHASE_B_START, PHASE_B_END],
    [LINE2_SCALE_FROM, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smoothGlide,
    },
  );

  // === Slow "breathe" scale during hold ===
  // Both lines share a single hold-scale ramp from frame 0 → HEADLINE_HOLD_END
  // so they grow at the same rate and reach their final size at the exact same
  // instant — right when the exit begins. Line 2 doesn't matter visually before
  // PHASE_B_START (it's opacity 0), so using the shared ramp is safe.
  // Applied on an outer wrapper that sits OUTSIDE each line's overflow:hidden
  // mask container, so the scale-up isn't clipped horizontally.
  const holdScale = interpolate(
    frame,
    [0, HEADLINE_HOLD_END],
    [1, HOLD_SCALE_END],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    },
  );

  // === Per-line mask-reveal-up exit values ===
  // Line 1 exits first (DOM order), line 2 follows after MASK_EXIT_LINE_STAGGER.
  const line1ExitStart = HEADLINE_HOLD_END;
  const line1ExitEnd = line1ExitStart + MASK_EXIT_DURATION;
  const line2ExitStart = HEADLINE_HOLD_END + MASK_EXIT_LINE_STAGGER;
  const line2ExitEnd = line2ExitStart + MASK_EXIT_DURATION;

  // Opacity is front-loaded onto a shorter window (75% of the exit duration)
  // with a balanced curve so the text is essentially invisible by the time
  // the brand stack starts crossfading in — while translateY/blur continue
  // playing the spatial wipe for the final 25% for visual continuity.
  const MASK_EXIT_OPACITY_FRACTION = 0.75;
  const line1OpacityEnd =
    line1ExitStart + MASK_EXIT_DURATION * MASK_EXIT_OPACITY_FRACTION;
  const line2OpacityEnd =
    line2ExitStart + MASK_EXIT_DURATION * MASK_EXIT_OPACITY_FRACTION;

  const line1ExitOpacity = interpolate(
    frame,
    [line1ExitStart, line1OpacityEnd],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEaseOpacity,
    },
  );
  const line1ExitY = interpolate(
    frame,
    [line1ExitStart, line1ExitEnd],
    [0, MASK_EXIT_Y_PX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEase,
    },
  );
  const line1ExitBlur = interpolate(
    frame,
    [line1ExitStart, line1ExitEnd],
    [0, MASK_EXIT_BLUR_PX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEase,
    },
  );

  const line2ExitOpacity = interpolate(
    frame,
    [line2ExitStart, line2OpacityEnd],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEaseOpacity,
    },
  );
  const line2ExitY = interpolate(
    frame,
    [line2ExitStart, line2ExitEnd],
    [0, MASK_EXIT_Y_PX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEase,
    },
  );
  const line2ExitBlur = interpolate(
    frame,
    [line2ExitStart, line2ExitEnd],
    [0, MASK_EXIT_BLUR_PX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: maskExitEase,
    },
  );

  return (
    <AbsoluteFill
      style={{
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
          gap: STACK_GAP,
          paddingLeft: 120,
          paddingRight: 120,
          transform: `translateY(${stackOffsetY}px)`,
        }}
      >
        {/* Line 1 — per-character soft-blur-IN entrance, per-line mask-reveal-up EXIT.
            Outer wrapper carries the slow "breathe" scale during hold (no clipping).
            Inner overflow:hidden wrapper is the mask that clips the upward exit. */}
        <div
          style={{
            transform: `scale(${holdScale})`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
        <div
          style={{
            overflow: 'hidden',
            // Tiny vertical breathing room so the per-character lift-from-below
            // entrance is not clipped by the same mask wrapper.
            paddingBottom: 4,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: HEADLINE_COLOR,
              fontFamily: FUNNEL_STACK,
              fontSize: LINE1_FONT_SIZE,
              fontWeight: 300,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
              lineHeight: 1,
              whiteSpace: 'pre',
              opacity: line1ExitOpacity,
              transform: `translateY(${line1ExitY}px)`,
              filter: `blur(${line1ExitBlur}px)`,
              transformOrigin: '50% 50%',
              willChange: 'transform, opacity, filter',
            }}
          >
            {LINE1_CHARS.map((char, i) => {
              const enterStart = i * INTRO_TIMING.charStagger;
              const enterEnd = enterStart + INTRO_TIMING.charDuration;
              const enterOpacity = interpolate(
                frame,
                [enterStart, enterEnd],
                [0, 1],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: softBlur,
                },
              );
              const enterY = interpolate(
                frame,
                [enterStart, enterEnd],
                [LINE1_CHAR_LIFT_PX, 0],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: softBlur,
                },
              );
              const enterBlur = interpolate(
                frame,
                [enterStart, enterEnd],
                [LINE1_CHAR_BLUR_PX, 0],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: softBlur,
                },
              );

              return (
                <span
                  key={`l1-${char}-${i}`}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    opacity: enterOpacity,
                    transform: `translateY(${enterY}px)`,
                    filter: `blur(${enterBlur}px)`,
                    transformOrigin: '50% 55%',
                    willChange: 'transform, opacity, filter',
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
        </div>

        {/* Line 2 — block rise+scale+fade IN, per-line mask-reveal-up EXIT.
            Outer wrapper carries the slow "breathe" scale during hold (no clipping).
            Inner overflow:hidden wrapper is the mask that clips entrance/exit motion. */}
        <div
          style={{
            transform: `scale(${holdScale})`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
        <div
          style={{
            overflow: 'hidden',
            paddingBottom: 8,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: HEADLINE_COLOR,
              fontFamily: ALEO_STACK,
              fontSize: LINE2_FONT_SIZE,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              whiteSpace: 'pre',
              opacity: line2Opacity * line2ExitOpacity,
              transform: `translateY(${line2Y + line2ExitY}px) scale(${line2Scale})`,
              filter: `blur(${line2ExitBlur}px)`,
              transformOrigin: '50% 100%',
              willChange: 'transform, opacity, filter',
            }}
          >
            {LINE2_TEXT}
          </div>
        </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
