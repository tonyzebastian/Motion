import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { BrandStack } from './BrandStack';
import { Everywhere } from './Everywhere';
import { CROSSFADE_FRAMES, EVERYWHERE_DURATION } from './Everywhere/timing';
import { Headline, HEADLINE_FADE_END } from './Headline';
import { MeshBackground } from './MeshBackground';

// Overlap the tail of the headline's mask-reveal-up.exit with the start of
// the logo's mask-reveal-up.enter so the swap feels like one continuous
// motion. By this point line 1 is fully wiped and line 2 is ~70%+ wiped,
// while the logo is still at very low opacity — they cross-fade cleanly.
const HEADLINE_TO_LOGO_OVERLAP = 8;
const BRAND_START = HEADLINE_FADE_END - HEADLINE_TO_LOGO_OVERLAP;

// BrandStack lands by ~150 local frames (LOGO_END → TAGLINE → CUSTOMER_START
// + per-logo fade ≈ 150f). We hold for ~90 more so the reveal breathes,
// then hand off to the Everywhere section via cross-dissolve.
const BRAND_HOLD_FRAMES = 240;

// Everywhere starts CROSSFADE_FRAMES early so its section-level fade-in
// overlaps the BrandStack fade-out for a clean cross-dissolve.
const EVERYWHERE_START = BRAND_START + BRAND_HOLD_FRAMES - CROSSFADE_FRAMES;

// Wraps BrandStack with a tail fade so it cross-dissolves into the
// Everywhere section. Local frame is relative to its own Sequence.
const BrandStackWithExit: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [BRAND_HOLD_FRAMES - CROSSFADE_FRAMES, BRAND_HOLD_FRAMES],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <BrandStack />
    </AbsoluteFill>
  );
};

// NOTE: mesh fade-in is temporarily disabled to avoid Studio preview
// performance hitches. Re-enable by wrapping MeshBackground in an
// opacity-driven AbsoluteFill keyed off MESH_FADE_START/END from Headline.
export const SundialReel2026Scene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF' }}>
      <MeshBackground />
      <Sequence
        durationInFrames={HEADLINE_FADE_END + 10}
        layout="none"
      >
        <Headline />
      </Sequence>
      <Sequence
        from={BRAND_START}
        durationInFrames={BRAND_HOLD_FRAMES}
        layout="none"
      >
        <BrandStackWithExit />
      </Sequence>
      <Sequence
        from={EVERYWHERE_START}
        durationInFrames={EVERYWHERE_DURATION}
        layout="none"
      >
        <Everywhere />
      </Sequence>
    </AbsoluteFill>
  );
};
