// ============================================
// Organic typing schedule for agent-streamed text.
//
// Instead of revealing one character per frame, we tokenize the text into
// variable-sized chunks (1-12 chars) and reveal them at irregularly spaced
// frames so it feels more like streamed model output: bursts of a few chars
// at a time, occasional pauses (especially around punctuation), occasional
// whole-word reveals.
//
// Each schedule is fully deterministic (seeded PRNG) so the animation is
// stable across renders.
// ============================================

import {
  AGENT_FOLLOWUP,
  AGENT_RESPONSE,
  DASHBOARD_RESPONSE,
  PHASE5_STEPS,
  TIMING,
} from './constants';

export type Token = { endIdx: number; frame: number };

const PUNCT = new Set(['.', ',', '?', '!', ':', ';']);

const makeRand = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

export const buildSchedule = (
  text: string,
  startFrame: number,
  endFrame: number,
  seed = 42,
): Token[] => {
  const rand = makeRand(seed);

  // 1. Split the text into varying-size chunks. Bias toward medium-size
  //    bursts so the stream feels smooth without being mechanical.
  const sizes: number[] = [];
  let i = 0;
  while (i < text.length) {
    const r = rand();
    let size: number;
    if (r < 0.1) size = 1;
    else if (r < 0.55) size = 2 + Math.floor(rand() * 3);
    else if (r < 0.9) size = 4 + Math.floor(rand() * 4);
    else size = 8 + Math.floor(rand() * 5);

    size = Math.min(size, text.length - i);
    sizes.push(size);
    i += size;
  }

  // 2. Compute per-chunk weights (bigger chunks take a bit longer; punctuation
  //    adds a small pause). The weights are normalized so the schedule fits
  //    exactly between startFrame and endFrame.
  let cum = 0;
  const weights: number[] = sizes.map((size) => {
    cum += size;
    const lastChar = text[cum - 1];
    const base = Math.pow(size, 0.55);
    const jitter = 0.88 + rand() * 0.24;
    const pause = PUNCT.has(lastChar) ? 0.8 : 0;
    return base * jitter + pause;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalFrames = Math.max(1, endFrame - startFrame);

  const tokens: Token[] = [];
  let cumWeight = 0;
  let cumIdx = 0;
  for (let k = 0; k < sizes.length; k++) {
    cumWeight += weights[k];
    cumIdx += sizes[k];
    tokens.push({
      endIdx: cumIdx,
      frame: startFrame + Math.round((cumWeight / totalWeight) * totalFrames),
    });
  }
  return tokens;
};

/**
 * Returns the number of characters of the schedule's text that should be
 * visible at the given frame.
 */
export const getRevealedCharsForSchedule = (
  schedule: Token[],
  frame: number,
): number => {
  if (schedule.length === 0) return 0;
  if (frame < schedule[0].frame) return 0;
  let count = 0;
  for (const token of schedule) {
    if (frame >= token.frame) count = token.endIdx;
    else break;
  }
  return count;
};

// ============================================
// Pre-built schedules for the two agent-streamed strings in the scene.
// ============================================

export const RESPONSE_SCHEDULE: Token[] = buildSchedule(
  AGENT_RESPONSE,
  TIMING.responseTypingStart,
  TIMING.responseTypingEnd,
);

export const FOLLOWUP_SCHEDULE: Token[] = buildSchedule(
  AGENT_FOLLOWUP,
  TIMING.followupTypingStart,
  TIMING.followupTypingEnd,
  // Different seed so the cadence doesn't pattern-match the main response.
  73,
);

/**
 * Number of characters of AGENT_RESPONSE visible at the given frame.
 * (Convenience wrapper kept for backwards compat with existing callers.)
 */
export const getRevealedResponseChars = (frame: number): number =>
  getRevealedCharsForSchedule(RESPONSE_SCHEDULE, frame);

/**
 * Number of characters of AGENT_FOLLOWUP visible at the given frame.
 */
export const getRevealedFollowupChars = (frame: number): number =>
  getRevealedCharsForSchedule(FOLLOWUP_SCHEDULE, frame);

// ============================================
// Phase 5 schedules. One per narration step in PHASE5_STEPS; entries for
// tool steps are `null`. Seeds are offset by a per-step constant so each
// paragraph has its own cadence (no audibly repeating rhythm).
// ============================================

const PHASE5_TYPING_WINDOWS: Array<[number, number] | null> = [
  [TIMING.phase5Step1TypingStart, TIMING.phase5Step1TypingEnd],
  null, // step 2: tool row
  [TIMING.phase5Step3TypingStart, TIMING.phase5Step3TypingEnd],
  null, // step 4: tool row
  [TIMING.phase5Step5TypingStart, TIMING.phase5Step5TypingEnd],
  null, // step 6: tool row
  [TIMING.phase5Step7TypingStart, TIMING.phase5Step7TypingEnd],
  null, // step 8: tool row
];

export const PHASE5_SCHEDULES: Array<Token[] | null> = PHASE5_STEPS.map(
  (step, idx) => {
    const window = PHASE5_TYPING_WINDOWS[idx];
    if (step.type !== 'narration' || !window) return null;
    const [start, end] = window;
    // Distinct seeds per step keep the per-paragraph rhythm varied.
    return buildSchedule(step.text, start, end, 101 + idx * 17);
  },
);

/**
 * Number of characters visible for the Phase 5 narration step at index
 * `stepIndex`. Returns 0 for tool rows or when the step hasn't started.
 */
export const getRevealedPhase5Chars = (
  stepIndex: number,
  frame: number,
): number => {
  const schedule = PHASE5_SCHEDULES[stepIndex];
  if (!schedule) return 0;
  return getRevealedCharsForSchedule(schedule, frame);
};

// ============================================
// Phase 6: dashboard description streamed below the artifact card.
// Distinct seed keeps its cadence from echoing the Phase 3 response.
// ============================================

export const DASHBOARD_SCHEDULE: Token[] = buildSchedule(
  DASHBOARD_RESPONSE,
  TIMING.phase6StreamStart,
  TIMING.phase6StreamEnd,
  211,
);

export const getRevealedDashboardChars = (frame: number): number =>
  getRevealedCharsForSchedule(DASHBOARD_SCHEDULE, frame);
