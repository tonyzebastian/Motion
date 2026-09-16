import { Easing, interpolate } from 'remotion';

// All values are SECTION-relative frames (the parent Sequence is offset by
// EVERYWHERE_START in the reel root). 60fps assumed.

// ---------------------------------------------------------------------------
// Beat boundaries
// ---------------------------------------------------------------------------

// Beat B is now cursor-free, so it's tight: the @sundial typewriter fires
// right after the intro typing finishes, the Slack UI + field morph land as
// it completes, a short hold, then @sundial deletes and we morph straight
// into the Claude beat for the Sundial MCP tag. Beat C still 220f, Beat D
// still 120f. Total section ≈ 12s @ 60fps.
export const BEAT_A_START = 0;
export const BEAT_A_END = 230;
export const BEAT_B_START = 230;
export const BEAT_B_END = 390;
export const BEAT_C_START = 390;
export const BEAT_C_END = 610;
export const BEAT_D_START = 610;
// Beat D is held longer than the others so the caption can finish building
// ("...anywhere") and the serif payoff line ("Sundial answers and
// remembers.") can rise in and breathe before the section ends.
export const BEAT_D_END = 810;

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
// Beat B choreography (cursor-free)
//
//   1. Intro typing finishes (TYPEWRITER_END) → "@sundial " types in.
//   2. As it completes, the Slack chrome + the chatbox field morph
//      (native → Slack pill) land together.
//   3. Short hold, then "@sundial " deletes in reverse and we morph straight
//      into the Claude beat (where the Sundial MCP tag types in).
// ---------------------------------------------------------------------------

// @sundial typewriter — fires shortly after the intro typing completes (the
// native prompt has just faded out). Runs over 44f for 9 chars (≈5f/char) so
// each character lands distinctly rather than blurring into a single fade.
export const MENTION_TYPE_IN_START = TYPEWRITER_END + 16; // 216
export const MENTION_TYPE_IN_END = MENTION_TYPE_IN_START + 44; // 260

// Slack chrome fades in just as the @sundial typewriter completes — the
// brief is "that's when we show the slack UI". 30f fade for a soft reveal.
export const B_CHROME_IN_START = MENTION_TYPE_IN_END; // 260
export const B_CHROME_IN_END = B_CHROME_IN_START + 30; // 290

// Chatbox input-field re-skin (native composer → Slack pill). Runs IN STEP
// with the Slack chrome fade-in above — i.e. right as the @sundial mention
// finishes typing — so the box visibly transforms together with the Slack
// background appearing.
export const SLACK_MORPH_START = B_CHROME_IN_START; // 260
export const SLACK_MORPH_END = B_CHROME_IN_END; // 290

// @sundial typewriter out. After a short hold on the Slack UI, the prefix
// deletes backwards over 30f, ending just before the slack chrome fades out
// and the Slack → Claude seam morph fires.
export const MENTION_TYPE_OUT_START = BEAT_B_START + 105; // 335
export const MENTION_TYPE_OUT_END = MENTION_TYPE_OUT_START + 30; // 365

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
export const MCP_OUT_END = BEAT_C_END - CHATBOX_CROSSFADE - 4; // 588
export const MCP_OUT_START = MCP_OUT_END - 36; // 552

// ---------------------------------------------------------------------------
// Camera zoom — pushes in on the chatbox when @sundial starts typing (Beat B)
// and holds through the Sundial MCP beat (Beat C), then eases back out when
// the MCP tag is removed. This is a CENTRAL zoom: the focal point and the
// on-screen anchor are both the canvas center (960, 540), so the UI scales up
// symmetrically around the middle with no horizontal pan.
//
// A central zoom keeps the Slack thread + both AI logos fully on-screen
// (nothing cropped) and balanced left/right. The bottom caption is
// intentionally left OUTSIDE the camera group (see index.tsx) so it stays
// centered/crisp at its own scale.
// ---------------------------------------------------------------------------

// Zoom in begins exactly when @sundial starts typing, eased over 24f.
export const ZOOM_IN_START = MENTION_TYPE_IN_START; // 216
export const ZOOM_IN_END = ZOOM_IN_START + 24; // 240

// Zoom out finishes when the Sundial MCP tag is fully removed, eased over 24f.
export const ZOOM_OUT_END = MCP_OUT_END; // 588
export const ZOOM_OUT_START = ZOOM_OUT_END - 24; // 564

// Scale at full zoom.
export const ZOOM_SCALE = 1.25;

// Focal point (world/canvas coords) mapped to the on-screen anchor at full
// zoom. Both are the canvas center for a pure central zoom (no pan). The
// translate is scaled by the zoom scalar so the camera is exact identity at
// rest.
export const ZOOM_FOCAL_X = 960;
export const ZOOM_FOCAL_Y = 540;
export const ZOOM_ANCHOR_X = 960;
export const ZOOM_ANCHOR_Y = 540;
