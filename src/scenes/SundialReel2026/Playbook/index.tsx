import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { PlaybooksScene } from '../../Playbooks';
import { PlaybooksTrustSignalScene } from '../../PlaybooksTrustSignal';
import { PlaybooksCitationsScene } from '../../PlaybooksCitations';
import { PlaybookCaption } from './PlaybookCaption';
import { PLAYBOOK_CAPTIONS } from './captions';
import { RemapTime } from './RemapTime';
import {
  PART_A_DURATION,
  PART_B_DURATION,
  PART_B_START,
  PART_C_DURATION,
  PART_C_START,
  PARTS_BC_CROSSFADE,
  PARTS_CROSSFADE,
  PLAYBOOKS_START_FRAME,
  SECTION_FADE_IN,
} from './timing';

// ============================================
// Playbook — Section 4 of SundialReel2026
// ============================================
//
// Renders the Playbooks agent flow + PlaybooksTrustSignal ending inside the
// reel's 1920x1080 frame. Both scenes were authored at 1280x900, so we
// render them into a 1280x900 stage uniformly scaled to fit the reel's
// 1080 height (scale ~= 1.2). The remaining ~192px on each side shows the
// reel's mesh gradient through.
//
// Wallpaper is suppressed via `showBackground={false}` on both scenes so
// the mesh shows through behind the floating browser window.
//
// Part A's 30fps timeline is mapped to 60fps via <RemapTime>; Part B is
// already authored at 60fps and renders natively. A short opacity crossfade
// hides the seam where the underlying timing-system swaps.
// ============================================

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 900;

// Uniform fit-to-height scale: 1080 / 900 = 1.2.
const STAGE_SCALE = 1080 / STAGE_HEIGHT;

const ease = Easing.inOut(Easing.cubic);

// ============================================
// Per-beat horizontal pan
// ============================================
//
// Each beat zooms the browser window so it nearly fills the 1920x1080
// frame, which leaves little room for the explainer captions. To open up
// background space we slide the whole scaled stage sideways during each
// beat (the static full-frame MeshBackground shows through the freed
// side). The pan is aligned to each beat's zoom in/out so it reads as one
// camera move, and returns to 0 between beats so nothing else is affected.
//
//   Beat 1 (Deep Playbooks): pan RIGHT  -> frees the LEFT margin
//   Beat 2 (Trust Signals):  pan RIGHT  -> frees the LEFT margin
//   Beat 3 (Data Lens):      pan LEFT   -> frees the RIGHT margin
const PAN = 240;

const PAN_FRAMES = [
  240, 285, // beat 1 in
  615, 655, // beat 1 out
  2257, 2305, // beat 2 in (aligned to trust-signal zoom-in @ 2257)
  2493, 2549, // beat 2 out
  2575, 2620, // beat 3 in
  2810, 2855, // beat 3 out
];
const PAN_VALUES = [
  0, PAN,
  PAN, 0,
  0, PAN,
  PAN, 0,
  0, -PAN,
  -PAN, 0,
];

// Part A — re-timed Playbooks scene playing from PLAYBOOKS_START_FRAME
// (Phase 1 done) through PLAYBOOKS_END_FRAME (Phase 7 start).
const PartA: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [PART_A_DURATION - PARTS_CROSSFADE, PART_A_DURATION],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    },
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <RemapTime map={(f) => PLAYBOOKS_START_FRAME + f / 2}>
        <PlaybooksScene showBackground={false} />
      </RemapTime>
    </AbsoluteFill>
  );
};

// Part B — PlaybooksTrustSignal at its native 60fps. Anchored at section
// frame `PART_B_START` so its own frame 0 (split-open start) aligns with
// the moment Part A would have transitioned into Phase 7. Fades in over
// the A->B crossfade and back out over the B->C crossfade.
const PartB: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, PARTS_CROSSFADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const fadeOut = interpolate(
    frame,
    [PART_B_DURATION - PARTS_BC_CROSSFADE, PART_B_DURATION],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    },
  );
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Markers shown here too (citationsOpacity=1) so they don't pop in
          when Part C (Citations) takes over. */}
      <PlaybooksTrustSignalScene showBackground={false} citationsOpacity={1} />
    </AbsoluteFill>
  );
};

// Part C — PlaybooksCitations at its native 60fps. Anchored at section
// frame `PART_C_START`; its frame 0 (trust-signal settled state) aligns
// with Part B's settled tail so the crossfade reads as one frame.
const PartC: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, PARTS_BC_CROSSFADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Markers start prefilled since Part B already showed them. */}
      <PlaybooksCitationsScene showBackground={false} citationsPrefilled />
    </AbsoluteFill>
  );
};

export const Playbook: React.FC = () => {
  const frame = useCurrentFrame();
  const sectionOpacity = interpolate(
    frame,
    [0, SECTION_FADE_IN],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    },
  );

  // Horizontal pan that opens background space beside the zoomed window.
  const panX = interpolate(frame, PAN_FRAMES, PAN_VALUES, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        opacity: sectionOpacity,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translateX(${panX}px) scale(${STAGE_SCALE})`,
          transformOrigin: 'center center',
        }}
      >
        <Sequence
          name="4a · Playbooks (re-timed 30→60fps)"
          durationInFrames={PART_A_DURATION}
          layout="none"
        >
          <PartA />
        </Sequence>
        <Sequence
          name="4b · Trust Signal (60fps native)"
          from={PART_B_START}
          durationInFrames={PART_B_DURATION}
          layout="none"
        >
          <PartB />
        </Sequence>
        <Sequence
          name="4c · Citations (60fps native)"
          from={PART_C_START}
          durationInFrames={PART_C_DURATION}
          layout="none"
        >
          <PartC />
        </Sequence>
      </div>

      {/* Explainer captions. Rendered OUTSIDE the scaled 1280x900 stage so
          they live in full 1920x1080 frame space, sitting in the clear mesh
          margin beside the browser window. Each is frame-gated to its beat. */}
      {PLAYBOOK_CAPTIONS.map((caption) => (
        <Sequence
          key={caption.id}
          name={`caption · ${caption.label}`}
          from={caption.from}
          durationInFrames={caption.durationInFrames}
          layout="none"
        >
          <PlaybookCaption
            label={caption.label}
            description={caption.description}
            side={caption.side}
            top={caption.top}
            width={caption.width}
            durationInFrames={caption.durationInFrames}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
