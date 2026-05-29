// ============================================
// Closing section timing
// ============================================
//
// All values are SECTION-relative frames at the reel's 60fps. This is the
// sixth and final top-level section of SundialReel2026 — a calm, single-beat
// outro that reveals three stacked elements in sequence and holds:
//   1. the Sundial logo
//   2. the one-line statement "The smartest member of your team isn't a hire"
//   3. an "Ask us for a demo" button
// ============================================

// Section-level cross-dissolve in. The Sequence starts CLOSING_CROSSFADE
// frames before the ExtendedCapabilities section ends so this fade-in overlaps
// its tail for a clean dissolve (Extended keeps rendering its settled end
// state during the overlap).
export const CLOSING_CROSSFADE = 18;
export const SECTION_FADE_IN = CLOSING_CROSSFADE;

// Sequential reveal: logo (index 0) → statement (index 1) → button (index 2).
// Each element rises + fades in, offset from the previous by ELEMENT_STAGGER.
export const ELEMENT_START = 14;
export const ELEMENT_STAGGER = 18;
export const ELEMENT_DURATION = 30;
export const ELEMENT_COUNT = 3;

// Frame at which the last element (the button) has finished entering.
const LAST_ELEMENT_END =
  ELEMENT_START + (ELEMENT_COUNT - 1) * ELEMENT_STAGGER + ELEMENT_DURATION;

// Hold on the full brand frame so the closing breathes before the reel ends.
export const CLOSING_HOLD = 110;

// Total section duration. Exported so the reel timeline + Root composition
// duration stay in sync automatically.
export const CLOSING_DURATION = LAST_ELEMENT_END + CLOSING_HOLD;
