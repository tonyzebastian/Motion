import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  Chatbox,
  SURFACE_VISUALS,
  type SurfaceVisual,
} from './Chatbox';
import { Caption } from './Caption';
import { NativePrompt } from './NativePrompt';
import { SlackShell } from './SlackShell';
import { DesktopShell } from './DesktopShell';
import {
  BEAT_A_END,
  BEAT_A_START,
  BEAT_B_END,
  BEAT_C_END,
  BEAT_C_START,
  BEAT_D_END,
  BEAT_D_START,
  B_CHROME_IN_END,
  B_CHROME_IN_START,
  CHATBOX_CROSSFADE,
  MCP_IN_END,
  MCP_IN_START,
  MCP_OUT_END,
  MCP_OUT_START,
  MENTION_TYPE_IN_END,
  MENTION_TYPE_IN_START,
  MENTION_TYPE_OUT_END,
  MENTION_TYPE_OUT_START,
  QUERY_TEXT,
  SECTION_FADE_IN,
  SLACK_MORPH_END,
  SLACK_MORPH_START,
  TYPEWRITER_END,
  TYPEWRITER_START,
  chromeOpacity,
} from './timing';

// The chatbox is the geometric anchor. It renders ONCE at the section level
// and its visual properties (height, borderRadius, paddings, ring strength,
// border) are interpolated across each beat seam — so what the viewer sees
// is one chatbox visibly restyling itself, not two chatboxes ghosting
// through each other.
const CHATBOX_CENTER_Y = 540;

// Chatbox visual box ≈ 92px (padding 24 + 44px row + padding 24); add the
// 5px shadow ring to get the visible top edge. Half ≈ 50.
const CHATBOX_VISUAL_HALF_HEIGHT = 50;

// 32px gap between the chatbox top edge and any accessory above it.
const PROMPT_TO_CHATBOX_GAP = 32;

// Bottom edge (from canvas top) of any accessory rendered above the chatbox.
const ACCESSORY_BOTTOM_Y =
  CHATBOX_CENTER_Y - CHATBOX_VISUAL_HALF_HEIGHT - PROMPT_TO_CHATBOX_GAP;

const seamEase = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVisual = (a: SurfaceVisual, b: SurfaceVisual, t: number): SurfaceVisual => ({
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
  borderRadius: lerp(a.borderRadius, b.borderRadius, t),
  paddingTop: lerp(a.paddingTop, b.paddingTop, t),
  paddingBottom: lerp(a.paddingBottom, b.paddingBottom, t),
  paddingX: lerp(a.paddingX, b.paddingX, t),
  ringStrength: lerp(a.ringStrength, b.ringStrength, t),
  borderOpacity: lerp(a.borderOpacity, b.borderOpacity, t),
});

// Per-seam descriptor: which visual we're morphing FROM and TO over an
// explicit [start, end] window. The B/C and C/D seams still own the standard
// CHATBOX_CROSSFADE-wide window that ends at the beat boundary. The A→B
// (native → slack) morph is special: it is decoupled from BEAT_A_END and
// instead runs over the SLACK_MORPH window so the input field re-skins in
// step with the Slack chrome (right as @sundial finishes typing) rather than
// before the cursor even arrives.
type Seam = {
  start: number;
  end: number;
  from: SurfaceVisual;
  to: SurfaceVisual;
};

const seams: Seam[] = [
  {
    start: SLACK_MORPH_START,
    end: SLACK_MORPH_END,
    from: SURFACE_VISUALS.native,
    to: SURFACE_VISUALS.slack,
  },
  {
    start: BEAT_B_END - CHATBOX_CROSSFADE,
    end: BEAT_B_END,
    from: SURFACE_VISUALS.slack,
    to: SURFACE_VISUALS.claude,
  },
  {
    start: BEAT_C_END - CHATBOX_CROSSFADE,
    end: BEAT_C_END,
    from: SURFACE_VISUALS.claude,
    to: SURFACE_VISUALS.native,
  },
];

// Baseline (non-morphing) visual for a frame. The box stays NATIVE through
// all of Beat A AND the early part of Beat B (cursor fly-in + @sundial
// type-in) — it only becomes the Slack pill once the SLACK_MORPH window
// completes.
const getBaseVisual = (frame: number): SurfaceVisual => {
  if (frame < SLACK_MORPH_END) return SURFACE_VISUALS.native;
  if (frame < BEAT_B_END) return SURFACE_VISUALS.slack;
  if (frame < BEAT_C_END) return SURFACE_VISUALS.claude;
  return SURFACE_VISUALS.native;
};

// The full visual for a frame: morphed at seams, baseline within beats.
// Claude no longer grows when the MCP tag appears (the tag is now inline on
// the writing row), so there is no height interpolation tied to mcpOpacity.
const getSurfaceVisual = (frame: number): SurfaceVisual => {
  const seam = seams.find((s) => frame >= s.start && frame < s.end);
  if (seam) {
    const t = interpolate(frame, [seam.start, seam.end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: seamEase,
    });
    return lerpVisual(seam.from, seam.to, t);
  }
  return getBaseVisual(frame);
};

// ---------------------------------------------------------------------------
// BeatChrome — renders only the surrounding UI (shell or topAccessory) for
// a single beat, driven by `chromeOpacity`. The chatbox is rendered ONCE
// at the section level so it can morph instead of crossfade.
// ---------------------------------------------------------------------------

const BeatChrome: React.FC<{
  opacity: number;
  shell?: React.ReactNode;
  topAccessory?: React.ReactNode;
}> = ({ opacity, shell, topAccessory }) => {
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity }}>
      {shell}
      {topAccessory && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: ACCESSORY_BOTTOM_Y,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {topAccessory}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Everywhere — derives all per-frame state once, then renders four chrome
// layers (one per beat) under a single morphing chatbox.
// ---------------------------------------------------------------------------

export const Everywhere: React.FC = () => {
  const frame = useCurrentFrame();

  // Section-level fade-in (the BrandStack → Everywhere handoff).
  const sectionOpacity = interpolate(
    frame,
    [0, SECTION_FADE_IN],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: seamEase,
    },
  );

  // Beats A, C, D use the default chrome envelope. Beat B is custom — its
  // chrome (Slack thread + skeletons) only fades in AFTER the @sundial
  // typewriter completes, so the viewer reads the cursor + type-in as the
  // catalyst for the Slack UI appearing.
  const chromeA = chromeOpacity(frame, BEAT_A_START, BEAT_A_END, { fadeIn: false, fadeOut: true });

  // Beat B chrome envelope:
  //   - in:  0 → 1 over [B_CHROME_IN_START, B_CHROME_IN_END] (after typewriter)
  //   - out: 1 → 0 over the standard seam window ending at BEAT_B_END
  const chromeB = interpolate(
    frame,
    [
      B_CHROME_IN_START,
      B_CHROME_IN_END,
      BEAT_B_END - CHATBOX_CROSSFADE - 4,
      BEAT_B_END - CHATBOX_CROSSFADE,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: seamEase,
    },
  );

  const chromeC = chromeOpacity(frame, BEAT_C_START, BEAT_C_END);
  const chromeD = chromeOpacity(frame, BEAT_D_START, BEAT_D_END, { fadeIn: true, fadeOut: false });

  // Persistent query: typed once in beat A, then stays for B/C/D.
  const typedChars = Math.floor(
    interpolate(
      frame,
      [TYPEWRITER_START, TYPEWRITER_END],
      [0, QUERY_TEXT.length],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    ),
  );
  const text = QUERY_TEXT.slice(0, typedChars);
  const caretBlink = frame < TYPEWRITER_START;

  const reveal = Easing.inOut(Easing.cubic);

  // @sundial typewriter — ramps up in Beat B after the cursor click, then
  // ramps DOWN late in Beat B as the second cursor pass deletes it. Both
  // edges feed the same `mentionProgress` scalar inside the chatbox; the
  // writing area renders MENTION_TEXT.slice(0, floor(progress * len)) and
  // the wrapper width = MENTION_RESERVED_WIDTH * progress.
  //
  // Linear easing (not `reveal`) so the typed characters land at uniform
  // intervals — eased curves cluster chars at the middle of the window
  // and the result reads as a fade rather than typing.
  const mentionProgress = interpolate(
    frame,
    [
      MENTION_TYPE_IN_START,
      MENTION_TYPE_IN_END,
      MENTION_TYPE_OUT_START,
      MENTION_TYPE_OUT_END,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Sundial MCP — inline tag in Beat C. Drives both width and opacity of
  // its wrapper identically to mentionProgress's behavior on the @sundial
  // wrapper.
  const mcpOpacity = interpolate(
    frame,
    [MCP_IN_START, MCP_IN_END, MCP_OUT_START, MCP_OUT_END],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: reveal },
  );

  // Single source-of-truth for the chatbox's geometry every frame.
  const visual = getSurfaceVisual(frame);

  return (
    <AbsoluteFill style={{ opacity: sectionOpacity }}>
      {/* Chrome layers — shells + accessories per beat. No chatbox here. */}
      <BeatChrome opacity={chromeA} topAccessory={<NativePrompt />} />
      <BeatChrome opacity={chromeB} shell={<SlackShell />} />
      <BeatChrome opacity={chromeC} shell={<DesktopShell />} />
      <BeatChrome opacity={chromeD} topAccessory={<NativePrompt />} />

      {/* Single chatbox — pixel-locked at (50%, CHATBOX_CENTER_Y), morphs
          via interpolated surface visuals at every beat seam. */}
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            top: CHATBOX_CENTER_Y,
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Chatbox
            visual={visual}
            text={text}
            caretBlink={caretBlink}
            mentionProgress={mentionProgress}
            mcpOpacity={mcpOpacity}
          />
        </div>
      </AbsoluteFill>

      {/* Caption is persistent across all four beats. */}
      <Caption />
    </AbsoluteFill>
  );
};
