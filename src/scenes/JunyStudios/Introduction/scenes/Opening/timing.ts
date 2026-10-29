import { Easing } from "remotion";

// The Opening scene comes in two paces that share layout and assets:
//   STANDARD_TIMING — 6.5s, video holds a still before playing
//   SHORT_TIMING    — 3s, faster and snappier, video plays straight away
// All frames are at 30fps. Layout values below are shared by both.

// Layout (shared) ------------------------------------------------------------

// Voice-over words, laid out around the small video. x/y are each word's
// top-left corner on the 1920×1080 page, from the Figma layout
// (Storyboard › Scratch, node 81:1186).
export const VO_WORDS: { text: string; x: number; y: number }[] = [
  { text: "I’ve", x: 771, y: 326 },
  { text: "mostly", x: 937, y: 350 },
  { text: "been", x: 727, y: 471 },
  { text: "behind", x: 1063, y: 536 },
  { text: "the", x: 792, y: 612 },
  { text: "camera.", x: 950, y: 628 },
];

// Small black squares among the words. Each pops in with a word (index into
// VO_WORDS); when the video expands, each rides one corner of the video out.
export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export const SQUARE_SIZE = 11;
export const SQUARE_CORNER_GAP = 14; // distance outside the video's corner
export const SQUARES: { x: number; y: number; word: number; corner: Corner }[] = [
  { x: 861, y: 431, word: 2, corner: "topLeft" }, // with "been"
  { x: 1094, y: 472, word: 3, corner: "topRight" }, // with "behind"
  { x: 771, y: 588, word: 4, corner: "bottomLeft" }, // with "the"
  { x: 913, y: 716, word: 5, corner: "bottomRight" }, // with "camera."
];

// Small video in the middle (4:5).
export const VIDEO_SMALL = { x: 886, y: 428, width: 160, height: 200 };

// Depth used for the words, squares and small video, so they drift together.
export const CENTER_DEPTH = 0.45;

export const PAGE_COLOR = "#fff7f2";
export const INK = "#222222";

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

// Timing sets ----------------------------------------------------------------

export type OpeningTiming = {
  duration: number;
  cameraPush: number; // page scale reached at the end (1 = no push)

  wordAt: number[]; // frame each VO word appears (same order as VO_WORDS)
  wordEnterFrames: number;
  squarePopFrames: number;

  photoFirstLand: number;
  photoInterval: number; // frames between photo landings
  photoEnterFrames: number;

  // Trimmed clip of IMG_3134 in public/juny-studios/introduction/opening/.
  // It plays from its first frame.
  videoFile: string;
  videoLand: number;
  videoPlayStart: number; // same as videoLand = no pause
  expandStart: number;
  expandEnd: number; // full screen from here to the end
  wordsExitFrames: number;
  sceneFadeFrames: number;
  squareSnapFrames: number; // squares' move to the video corners

  sfx: {
    whooshFile: string; // rise length matches expandEnd - expandStart
    shutter: number; // volumes; 0 = off
    tap: number;
    filmAdvance: number;
    whoosh: number;
    cornerZip: number;
  };
};

export const STANDARD_TIMING: OpeningTiming = {
  duration: 195, // 6.5s
  cameraPush: 1.08,
  wordAt: [14, 24, 36, 45, 58, 66],
  wordEnterFrames: 12,
  squarePopFrames: 8,
  photoFirstLand: 6,
  photoInterval: 16,
  photoEnterFrames: 16,
  videoFile: "img_3134.mp4", // 2.0s–6.6s of the original: steady, no swing
  videoLand: 9, // 0.3s
  videoPlayStart: 69, // holds the first frame for 2s
  expandStart: 130, // 4.33s
  expandEnd: 165, // 5.5s
  wordsExitFrames: 14,
  sceneFadeFrames: 24,
  squareSnapFrames: 12,
  sfx: {
    whooshFile: "whoosh-expand",
    shutter: 0.32,
    tap: 0.42,
    filmAdvance: 0.45,
    whoosh: 0.55,
    cornerZip: 0.25,
  },
};

export const SHORT_TIMING: OpeningTiming = {
  duration: 90, // 3s
  cameraPush: 1.05,
  wordAt: [8, 14, 20, 26, 32, 38], // all six words by ~1.3s
  wordEnterFrames: 7,
  squarePopFrames: 5,
  photoFirstLand: 3,
  photoInterval: 5, // burst: all 8 land by ~1.3s
  photoEnterFrames: 9,
  videoFile: "img_3134-short.mp4", // 8.5s–11.5s of the original; ends before the hand swing
  videoLand: 4, // 0.13s
  videoPlayStart: 4, // plays straight away
  expandStart: 54, // 1.8s
  expandEnd: 72, // 2.4s
  wordsExitFrames: 8,
  sceneFadeFrames: 14,
  squareSnapFrames: 7,
  sfx: {
    whooshFile: "whoosh-expand-short",
    shutter: 0.24, // quieter, since 8 fire in quick succession
    tap: 0.4,
    filmAdvance: 0, // no still-to-motion moment
    whoosh: 0.55,
    cornerZip: 0.25,
  },
};

export const OPENING_DURATION = STANDARD_TIMING.duration;
export const OPENING_SHORT_DURATION = SHORT_TIMING.duration;

export const photoLandFrame = (t: OpeningTiming, i: number) =>
  t.photoFirstLand + i * t.photoInterval;
