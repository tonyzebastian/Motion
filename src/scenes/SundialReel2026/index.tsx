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
import { ExtendedCapabilities } from './ExtendedCapabilities';
import {
  EXTENDED_CROSSFADE,
  EXTENDED_DURATION,
} from './ExtendedCapabilities/timing';
import { Headline, HEADLINE_FADE_END } from './Headline';
import { MeshBackground } from './MeshBackground';
import { Playbook } from './Playbook';
import {
  MORPH_DURATION as PLAYBOOK_MORPH_DURATION,
  MORPH_TRANSLATE_Y as PLAYBOOK_MORPH_TRANSLATE_Y,
  PLAYBOOK_DURATION,
  PLAYBOOK_EXIT_DURATION,
  PLAYBOOK_EXIT_TRANSLATE_Y,
} from './Playbook/timing';

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

// Playbook (section 4) starts EXACTLY when Everywhere ends, with an extra
// `PLAYBOOK_MORPH_DURATION` frames overlap during which Everywhere stays
// mounted (rendering its frozen BEAT_D_END state) and the wrapper drives
// a translate-up + fade in lockstep with the Playbooks Phase 2 morph that
// fires at the same time inside the Playbook section. This replaces the
// previous static opacity crossfade with a motion-linked handoff: the
// Everywhere composer "rises out" while the Playbooks input/bubble rise
// into place in the chat thread.
const PLAYBOOK_START = EVERYWHERE_START + EVERYWHERE_DURATION;

// Extended Capabilities (section 5) starts EXTENDED_CROSSFADE frames before
// the Playbook section ends, so its own SECTION_FADE_IN overlaps the Playbook
// tail for a clean cross-dissolve into the "spec sheet" grid.
const EXTENDED_START =
  PLAYBOOK_START + PLAYBOOK_DURATION - EXTENDED_CROSSFADE;

// Total reel length. Exported so Root's <Composition durationInFrames> stays
// in sync with the section timeline automatically.
export const SUNDIAL_REEL_2026_DURATION = EXTENDED_START + EXTENDED_DURATION;

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

// Everywhere stays mounted for an extra `PLAYBOOK_MORPH_DURATION` frames
// past its content end (BEAT_D_END = EVERYWHERE_DURATION). During those
// frames the inner Everywhere component is frozen at its Beat-D-end
// state (chatbox in native style, caption fully resolved), and the
// wrapper applies the exit transform: translate upward AND fade to 0
// using the SAME easing, distance, and duration that Playbooks' Phase 2
// morph uses for its input/bubble inside the Playbook section. The two
// motions start at the same reel frame (== PLAYBOOK_START), so the
// Everywhere composer rises out of frame in lockstep with the Playbooks
// input/bubble rising up to take its place.
const EVERYWHERE_SEQUENCE_DURATION = EVERYWHERE_DURATION + PLAYBOOK_MORPH_DURATION;

const EverywhereWithExit: React.FC = () => {
  const frame = useCurrentFrame();
  // Same curve as Playbooks' Phase 2 morph (`Easing.out(Easing.cubic)`),
  // applied over the same 24-frame window so the speeds match exactly.
  const exitProgress = interpolate(
    frame,
    [EVERYWHERE_DURATION, EVERYWHERE_DURATION + PLAYBOOK_MORPH_DURATION],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );
  const translateY = -PLAYBOOK_MORPH_TRANSLATE_Y * exitProgress;
  const opacity = 1 - exitProgress;
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <Everywhere />
    </AbsoluteFill>
  );
};

// Wraps the Playbook section with a "rise out" exit so the handoff into
// Extended Capabilities reads as motion rather than a flat dissolve. During
// the section's final PLAYBOOK_EXIT_DURATION frames it translates upward and
// fades to 0; Extended Capabilities fades in slightly behind this motion
// (its Sequence begins EXTENDED_CROSSFADE frames before the section ends, a
// shorter window than the exit so the lift starts first), so the beat reads
// as "the demo lifts away, then Sundial AI settles in."
const PlaybookWithExit: React.FC = () => {
  const frame = useCurrentFrame();
  const exitProgress = interpolate(
    frame,
    [PLAYBOOK_DURATION - PLAYBOOK_EXIT_DURATION, PLAYBOOK_DURATION],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  );
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exitProgress,
        transform: `translateY(${-PLAYBOOK_EXIT_TRANSLATE_Y * exitProgress}px)`,
      }}
    >
      <Playbook />
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
        name="1 · Headline"
        durationInFrames={HEADLINE_FADE_END + 10}
        layout="none"
      >
        <Headline />
      </Sequence>
      <Sequence
        name="2 · BrandStack"
        from={BRAND_START}
        durationInFrames={BRAND_HOLD_FRAMES}
        layout="none"
      >
        <BrandStackWithExit />
      </Sequence>
      <Sequence
        name="3 · Everywhere"
        from={EVERYWHERE_START}
        durationInFrames={EVERYWHERE_SEQUENCE_DURATION}
        layout="none"
      >
        <EverywhereWithExit />
      </Sequence>
      <Sequence
        name="4 · Playbook"
        from={PLAYBOOK_START}
        durationInFrames={PLAYBOOK_DURATION}
        layout="none"
      >
        <PlaybookWithExit />
      </Sequence>
      <Sequence
        name="5 · Extended Capabilities"
        from={EXTENDED_START}
        durationInFrames={EXTENDED_DURATION}
        layout="none"
      >
        <ExtendedCapabilities />
      </Sequence>
    </AbsoluteFill>
  );
};
