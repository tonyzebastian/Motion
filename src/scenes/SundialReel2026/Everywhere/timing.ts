import { Easing, interpolate } from 'remotion';

// All values are SECTION-relative frames (the parent Sequence is offset by
// EVERYWHERE_START in the reel root). 60fps assumed.

// ---------------------------------------------------------------------------
// Beat boundaries
// ---------------------------------------------------------------------------

// Beat B grew by ~60 frames so the new choreography fits: cursor in → click
// → @sundial typewriter → Slack chrome → hold → cursor returns → delete.
// Beat C still 220f, Beat D still 120f. Total section ≈ 14s @ 60fps.
export const BEAT_A_START = 0;
export const BEAT_A_END = 240;
export const BEAT_B_START = 240;
export const BEAT_B_END = 500;
export const BEAT_C_START = 500;
export const BEAT_C_END = 720;
export const BEAT_D_START = 720;
export const BEAT_D_END = 840;

export const EVERYWHERE_DURATION = BEAT_D_END;

// ---------------------------------------------------------------------------
// Cross-dissolve model
// ---------------------------------------------------------------------------

// Cross-dissolve length at each beat boundary for the CHATBOX itself.
// Beats overlap by this many frames — the outgoing chatbox fades 1→0 over
// the same window the incoming chatbox fades 0→1.
export const CHATBOX_CROSSFADE = 18;

// Chrome (shell + topAccessory) lag for beats whose chrome envelope is
// the default `chromeOpacity` (Beats A, C, D). Beat B no longer uses the
// default envelope — its chrome fade-in is delayed until after the
// @sundial typewriter (see B_CHROME_IN_* below), so this constant is
// applied only at exit-time for Beat B.
export const CHROME_LAG = 10;

// Back-compat alias. The reel root still imports `CROSSFADE_FRAMES` to
// schedule the BrandStack → Everywhere handoff, so re-export under the
// old name to avoid touching that file.
export const CROSSFADE_FRAMES = CHATBOX_CROSSFADE;

// Section-level fade-in (matches the BrandStack→Everywhere handoff on the
// reel root) and fade-out tail. Fade-out is 0 for now because nothing
// follows Everywhere yet; can be re-introduced when the next section lands.
export const SECTION_FADE_IN = 12;

// inOut(cubic) is symmetric — both ends of every fade ease in and out, so
// chrome and chatbox transitions glide rather than snap.
const fade = Easing.inOut(Easing.cubic);

type EnvelopeOptions = { fadeIn?: boolean; fadeOut?: boolean };

/**
 * Opacity envelope for a beat's CHATBOX layer.
 *
 * Cross-dissolve model: the incoming chatbox starts fading in
 * CHATBOX_CROSSFADE frames BEFORE its nominal start (which is the outgoing
 * beat's nominal end), so during those frames the two chatboxes overlap with
 * opposite-direction opacity ramps and produce a real cross-dissolve.
 *
 * Beat A has no fade-in (it inherits the section's own fade-in).
 * Beat D has no fade-out (the whole section will fade out together later).
 */
export const beatOpacity = (
  frame: number,
  start: number,
  end: number,
  options: EnvelopeOptions = {},
): number => {
  const { fadeIn = true, fadeOut = true } = options;

  const points: number[] = [];
  const values: number[] = [];

  if (fadeIn) {
    points.push(start - CHATBOX_CROSSFADE, start);
    values.push(0, 1);
  } else {
    points.push(start);
    values.push(1);
  }

  if (fadeOut) {
    points.push(end - CHATBOX_CROSSFADE, end);
    values.push(1, 0);
  } else {
    points.push(end);
    values.push(1);
  }

  return interpolate(frame, points, values, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: fade,
  });
};

/**
 * Default chrome envelope. Used by Beats A, C, D. Beat B has a custom
 * delayed envelope that lives in `index.tsx`.
 *
 * Shifted relative to `beatOpacity` so chrome lags the chatbox on entry and
 * leads it on exit:
 *   - entry: 0 → 1 over [start, start + CHROME_LAG]
 *   - exit:  1 → 0 over [end - CHATBOX_CROSSFADE - CHROME_LAG,
 *                        end - CHATBOX_CROSSFADE]
 */
export const chromeOpacity = (
  frame: number,
  start: number,
  end: number,
  options: EnvelopeOptions = {},
): number => {
  const { fadeIn = true, fadeOut = true } = options;

  const points: number[] = [];
  const values: number[] = [];

  if (fadeIn) {
    points.push(start, start + CHROME_LAG);
    values.push(0, 1);
  } else {
    points.push(start);
    values.push(1);
  }

  if (fadeOut) {
    points.push(end - CHATBOX_CROSSFADE - CHROME_LAG, end - CHATBOX_CROSSFADE);
    values.push(1, 0);
  } else {
    points.push(end);
    values.push(1);
  }

  return interpolate(frame, points, values, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: fade,
  });
};

// ---------------------------------------------------------------------------
// Content choreography — driven from a single section-level frame so the
// chatbox state is identical across whichever beats are visible at the seam.
// ---------------------------------------------------------------------------

export const QUERY_TEXT =
  'What are the biggest opportunities for long term user growth?';

// Beat A — typewriter intro. 70-frame caret-blink lead-in lets the empty
// composer sit deliberately on screen before typing starts, then ~130
// frames of typing to fill the sentence (≈30 WPM, readable on video),
// then a 40f tail before the crossfade to Beat B begins.
export const TYPEWRITER_START = 70;
export const TYPEWRITER_END = 200;

// ---------------------------------------------------------------------------
// Beat B choreography
//
// Two cursor passes anchor the beat:
//   1. Cursor flies in, clicks at composer left, fades out → "@sundial "
//      types in → Slack chrome fades in.
//   2. Cursor returns late in the beat, clicks, fades out → "@sundial "
//      deletes in reverse → Slack chrome fades out alongside the seam morph
//      into Beat C.
// ---------------------------------------------------------------------------

// First cursor pass (type-in).
export const B_CURSOR_ENTER_START = BEAT_B_START + 20; // 260
export const B_CURSOR_ENTER_END = BEAT_B_START + 40; // 280
export const B_CURSOR_CLICK_FRAME = BEAT_B_START + 42; // 282
export const B_CURSOR_HIDE_FRAME = BEAT_B_START + 54; // 294

// 30-frame pause between the cursor finishing its click and the @sundial
// typewriter starting. Without this pause the click and the first typed
// character fired on top of each other and read as a single beat; the
// pause lets the viewer register the click before the prefix appears.
//
// @sundial typewriter then runs over 44f for 9 chars (≈5f/char) — slower
// than the original 4f/char so each character lands distinctly rather
// than blurring into a single fade.
export const MENTION_TYPE_IN_START = BEAT_B_START + 84; // 324
export const MENTION_TYPE_IN_END = BEAT_B_START + 128; // 368

// Slack chrome fades in just after the @sundial typewriter completes —
// the brief is "that's when we show the slack UI". 30f fade for a soft
// reveal.
export const B_CHROME_IN_START = BEAT_B_START + 132; // 372
export const B_CHROME_IN_END = BEAT_B_START + 162; // 402

// Second cursor pass (type-out / delete).
export const BC_CURSOR_ENTER_START = BEAT_B_START + 200; // 440
export const BC_CURSOR_ENTER_END = BEAT_B_START + 220; // 460
export const BC_CURSOR_CLICK_FRAME = BEAT_B_START + 222; // 462
export const BC_CURSOR_HIDE_FRAME = BEAT_B_START + 234; // 474

// @sundial typewriter out. Same 30f window, deleting backwards. Ends just
// before the seam crossfade fires (BEAT_B_END - CHATBOX_CROSSFADE = 482).
export const MENTION_TYPE_OUT_START = BEAT_B_START + 230; // 470
export const MENTION_TYPE_OUT_END = BEAT_B_START + 260; // 500

// ---------------------------------------------------------------------------
// Beat C choreography — Sundial MCP tag types in at the START of the
// writing line (in the slot @sundial just vacated), holds, then fades out
// before the C → D seam.
// ---------------------------------------------------------------------------

// MCP slides in just after the Slack → Claude chatbox morph completes
// (BEAT_C_START + a couple of frames so the new shape is visible first).
export const MCP_IN_START = BEAT_C_START + 4; // 504
export const MCP_IN_END = BEAT_C_START + 40; // 540

// MCP holds, then fades out before the C → D crossfade.
export const MCP_OUT_END = BEAT_C_END - CHATBOX_CROSSFADE - 4; // 698
export const MCP_OUT_START = MCP_OUT_END - 36; // 662
