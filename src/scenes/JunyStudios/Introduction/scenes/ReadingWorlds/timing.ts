import type { LeadStyle, TailStyle } from "../../../shared/handwriting/geometry";
import { Easing } from "remotion";

// Scene — "For a while now, I've been getting more curious about stories."
// Two painted Dune worlds, seen from above, on the pages of the book:
// Caladan (the ocean world) on the first spread, Arrakis (the desert) after
// the page swipe. Then the book closes on the Dune cover.
// Frames are on the scene's own timeline (30fps). Positions are on the
// 1920×1080 footage.

export const VIDEO_FRAMES = 100;

// Hand cut-outs, one per footage frame while the book is open
// (made by scripts/generate-juny-hand-matte.mjs).
export const HAND_FRAMES = 78;
export const handFile = (source: number) =>
  `juny-studios/introduction/reading/hand/hand-${String(source).padStart(3, "0")}.png`;

// The footage pauses on the first spread so Caladan has time to play.
// `at` is the source frame to hold on, `frames` how long to hold it.
export const HOLD = { at: 17, frames: 24 };

// Scene frame → footage frame.
export const footageFrame = (frame: number) => {
  if (frame < HOLD.at) return frame;
  if (frame < HOLD.at + HOLD.frames) return HOLD.at;
  return Math.min(frame - HOLD.frames, VIDEO_FRAMES - 1);
};
// Footage frame → scene frame (after the hold).
const at = (source: number) => (source <= HOLD.at ? source : source + HOLD.frames);

// Events in the footage, on the scene timeline.
export const SWIPE = { start: at(23), end: at(30) };
export const CLOSE = { start: at(76), end: at(86) };

export const READING_WORLDS_DURATION = 140;

// The open spread (both pages) and the spine.
export const SPREAD = { left: 485, right: 1310, top: 255, bottom: 968, spine: 893 };

// Caladan: the fish and gulls fade in as the page settles.
export const CALADAN = { revealStart: 6, revealEnd: 22 };

// Second spread: fish swim across the page from the moment it opens.
export const ARRAKIS = { start: at(23) };

// ─── Voice-over text ───────────────────────────────────────────────────
// The voice-over, handwritten in white over the pages (shared/handwriting).
// Each word writes itself on with a tapered pen as it's said. Word frames
// are a first guess; re-sync them to the recorded voice-over.

export const TEXT = {
  font: "reenieBeanie" as const,
  size: 135,
  // "stories." is about twice the size of the other lines (293 vs 150 in
  // the tool).
  finalSize: 264,
  // Pen width × size; a little heavier than the font so it holds up on video.
  weight: 0.07,
  // Baseline to baseline, × size.
  lineHeight: 0.8,
  ink: "#FFFFFF",
};

// Pen settings for one block of text, as tuned in the playground
// Handwriting tool. `seed` matches the tool's per-line seed
// (line-<n>-v<variation>) so the lead-ins, tails and wobble come out the same.
export type PenStyle = {
  speed: number;
  connect: number;
  wordConnect: number;
  lead: number;
  leadStyle: LeadStyle;
  tail: { length: number; style: TailStyle };
  wiggle: number;
  boil: number;
  texture: number;
  variation: number;
};

// The tool used speed 50. Each block below is as close to that as its
// window allows (page swipe, book close, end of scene): 55, 70 and 65.
const SHARED_PEN = { connect: 0.65, wiggle: 2.3, boil: 3, texture: 1, variation: 46 };

export const PEN: Record<"pageOne" | "pageTwo" | "final", PenStyle> = {
  // "For a while now," — a wave in, no tail.
  pageOne: {
    ...SHARED_PEN,
    speed: 55,
    wordConnect: 0.4,
    lead: 1.2,
    leadStyle: "wave",
    tail: { length: 0, style: "lift" },
  },
  // "I've been getting / more curious about" — short wave in, lift out.
  pageTwo: {
    ...SHARED_PEN,
    speed: 70,
    wordConnect: 0.65,
    lead: 0.5,
    leadStyle: "wave",
    tail: { length: 0.8, style: "lift" },
  },
  // "stories." — hook in, lift out.
  final: {
    ...SHARED_PEN,
    speed: 65,
    wordConnect: 0.1,
    lead: 0.5,
    leadStyle: "hook",
    tail: { length: 1.7, style: "lift" },
  },
};

export type Word = { text: string; frame: number };
// x, y: the centre of the first line's baseline. Lines are centred on x.
export type TextBlock = { x: number; y: number; lines: { words: Word[] }[] };

// Before the swipe: one line across the middle of the book.
export const PAGE_ONE_TEXT: TextBlock = {
  x: SPREAD.spine,
  y: 590,
  lines: [
    {
      words: [
        { text: "for", frame: 6 },
        { text: "a", frame: 12 },
        { text: "while", frame: 15 },
        { text: "now,", frame: 22 },
      ],
    },
  ],
};

// After the swipe: two lines across the middle of the book. Runs off as it
// closes.
export const PAGE_TWO_TEXT: TextBlock = {
  x: SPREAD.spine,
  y: 545,
  lines: [
    {
      words: [
        { text: "I’ve", frame: at(34) },
        { text: "been", frame: at(39) },
        { text: "getting", frame: at(44) },
      ],
    },
    {
      words: [
        { text: "more", frame: at(52) },
        { text: "curious", frame: at(58) },
        { text: "about", frame: at(67) },
      ],
    },
  ],
};

// Lands beside the Dune cover once the book has closed.
export const FINAL_WORD = { text: "stories.", frame: at(88), right: 800, y: 620 };


// Crayon texture re-rolls every N frames, like hand-drawn animation.
export const BOIL_FRAMES = 3;

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
