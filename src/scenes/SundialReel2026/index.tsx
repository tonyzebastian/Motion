import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { BrandStack } from './BrandStack';
import { Headline, HEADLINE_FADE_END } from './Headline';
import { MeshBackground } from './MeshBackground';

// Overlap the tail of the headline's mask-reveal-up.exit with the start of
// the logo's mask-reveal-up.enter so the swap feels like one continuous
// motion. By this point line 1 is fully wiped and line 2 is ~70%+ wiped,
// while the logo is still at very low opacity — they cross-fade cleanly.
const HEADLINE_TO_LOGO_OVERLAP = 8;
const BRAND_START = HEADLINE_FADE_END - HEADLINE_TO_LOGO_OVERLAP;

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
      <Sequence from={BRAND_START} layout="none">
        <BrandStack />
      </Sequence>
    </AbsoluteFill>
  );
};
