import { Easing } from "remotion";

// Scene — "For a while now, I've been getting more curious about stories."
// All timings are in frames at 30fps, on the scene's own timeline.
// Positions are on the 1920×1080 footage.

export const VIDEO_FILE = "juny-studios/introduction/reading/reading-book.mp4";
// The clip is 100 frames. After that its last frame (the Dune cover) holds.
export const VIDEO_FRAMES = 100;
export const READING_DURATION = 135;

// Temporary grade for the ungraded footage. Set to undefined once the
// graded clip is in.
export const FOOTAGE_GRADE = "contrast(1.14) saturate(1.2) brightness(0.95)";

// Slow push-in on the whole shot (footage + words together).
export const CAMERA = { from: 1, to: 1.06 };

// What happens in the footage.
export const FOOTAGE = {
  // The right page swipes over to the left.
  swipeStart: 23,
  swipeEnd: 30,
  // The book closes to show the cover.
  closeStart: 76,
  closeEnd: 86,
  // Where the spine is (the swipe turns around it).
  spineX: 893,
};

// Type: book serif, dark ink, light highlighter behind each word.
export const TYPE = {
  size: 66,
  lineHeight: 1.22,
  ink: "#2b2622",
  highlight: "#FFE9A6",
  // The last word gets a warmer, stronger mark.
  finalHighlight: "#FFD27A",
  finalSize: 128,
};

export type Word = { text: string; frame: number };
export type Line = Word[];
export type PageBlock = { x: number; y: number; lines: Line[] };

// Word frames are a first guess at the voice-over pace. Re-sync them once
// the voice-over is recorded.

// Before the swipe: on the right page. This page turns with the swipe.
export const PAGE_ONE: PageBlock = {
  x: 952,
  y: 400,
  lines: [
    [
      { text: "For", frame: 3 },
      { text: "a", frame: 9 },
      { text: "while", frame: 12 },
    ],
    [{ text: "now,", frame: 18 }],
  ],
};

// After the swipe: across the new spread. Fades as the book closes.
export const PAGE_TWO_LEFT: PageBlock = {
  x: 520,
  y: 400,
  lines: [
    [
      { text: "I've", frame: 34 },
      { text: "been", frame: 40 },
    ],
    [
      { text: "getting", frame: 46 },
      { text: "more", frame: 53 },
    ],
  ],
};

export const PAGE_TWO_RIGHT: PageBlock = {
  x: 960,
  y: 400,
  lines: [
    [{ text: "curious", frame: 60 }],
    [{ text: "about", frame: 69 }],
  ],
};

// Lands beside the Dune cover once the book is closed.
export const FINAL_WORD = { text: "stories.", frame: 88, right: 735, y: 560 };

// Word entrance and highlighter sweep.
export const WORD_MOTION = {
  inFrames: 6,
  highlightDelay: 2,
  highlightFrames: 7,
};

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
