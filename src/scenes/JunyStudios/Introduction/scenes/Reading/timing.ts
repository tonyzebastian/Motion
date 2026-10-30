import type { LeadStyle, TailStyle } from "../../../shared/handwriting/geometry";
import { Easing } from "remotion";

// Scene — "For a while now, I've been getting more curious about stories."
// The voice-over is handwritten over an overhead clip of the Dune book: one
// line on the first spread, two after the page swipe, and "stories." beside
// the cover once the book closes. The footage plays straight through, so
// scene frames are footage frames (30 fps). Positions are on the 1920×1080
// un-zoomed take; zoom.ts moves them with the edit's zoom.

// The colour-graded take, with the edit's zoom baked in (H.264, 30 fps).
export const VIDEO_FILE = "juny-studios/introduction/reading/reading-book.mp4";
export const VIDEO_FRAMES = 98;
export const READING_DURATION = VIDEO_FRAMES;

// Scene frame → footage frame.
export const footageFrame = (frame: number) => Math.min(Math.max(0, Math.floor(frame)), VIDEO_FRAMES - 1);

// Events in the footage.
export const SWIPE = { start: 23, end: 30 };
export const CLOSE = { start: 76, end: 86 };

// The open spread (both pages) and the spine.
export const SPREAD = { left: 485, right: 1310, top: 255, bottom: 968, spine: 893 };

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

// The tool used speed 50. The footage plays in real time, so each block is
// faster to fit its window: the first spread is on screen for under a
// second, and "stories." is written while the book closes.
const SHARED_PEN = { connect: 0.65, wiggle: 2.3, boil: 3, texture: 1, variation: 46 };

export const PEN: Record<"pageOne" | "pageTwo" | "final", PenStyle> = {
  // "For a while now," — a wave in, no tail.
  pageOne: {
    ...SHARED_PEN,
    speed: 150,
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
    speed: 150,
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
        { text: "for", frame: 1 },
        { text: "a", frame: 4 },
        { text: "while", frame: 6 },
        { text: "now,", frame: 10 },
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
        { text: "I’ve", frame: 31 },
        { text: "been", frame: 35 },
        { text: "getting", frame: 39 },
      ],
    },
    {
      words: [
        { text: "more", frame: 46 },
        { text: "curious", frame: 52 },
        { text: "about", frame: 60 },
      ],
    },
  ],
};

// Lands beside the Dune cover once the book has closed (screen position,
// on the zoomed-in footage).
export const FINAL_WORD = { text: "stories.", frame: 80, right: 730, y: 470 };

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
