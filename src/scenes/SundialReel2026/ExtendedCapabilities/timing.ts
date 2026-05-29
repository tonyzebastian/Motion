// ============================================
// Extended Capabilities section timing
// ============================================
//
// All values are SECTION-relative frames at the reel's 60fps. This is the
// fifth top-level section of SundialReel2026 — a calm "spec sheet" beat that
// follows the dense Playbook demo. A 3x2 bento grid of feature cards lands
// one-by-one, paced to a voiceover that names each capability.
// ============================================

// Section-level cross-dissolve in. The Sequence starts EXTENDED_CROSSFADE
// frames before the Playbook section ends so this fade-in overlaps the
// Playbook tail for a clean dissolve (the Playbook section keeps rendering
// its settled end state during the overlap).
export const EXTENDED_CROSSFADE = 18;
export const SECTION_FADE_IN = EXTENDED_CROSSFADE;

// Header ("Also ships with") mask-reveal-up enter.
export const HEADER_START = 6;
export const HEADER_DURATION = 26;

// Card reveal cadence. The first card lands at CARD_START; each subsequent
// card follows CARD_STAGGER frames later (tuned for voiceover so each
// capability appears as it is spoken). CARD_DURATION is the per-card pop
// window — kept short so the entrance feels snappy (it uses an ease-out-back
// overshoot). Bump CARD_STAGGER to re-time against the real VO.
export const CARD_START = 36;
export const CARD_STAGGER = 44;
export const CARD_DURATION = 18;

// Ghost filler cards drift/fade in behind the real grid early and stay.
export const GHOST_START = 4;
export const GHOST_STAGGER = 6;
export const GHOST_DURATION = 26;

// Seven feature cards + the "And much more" card = 8 tiles in the ring.
export const FEATURE_COUNT = 7;
export const CARD_COUNT = FEATURE_COUNT + 1;

// Frame at which the last card (And much more) has finished entering.
export const LAST_CARD_END =
  CARD_START + (CARD_COUNT - 1) * CARD_STAGGER + CARD_DURATION;

// --- Outro (final beat) ---
// After the grid lands and holds, the section resolves into a closing lockup:
//   1. the feature cards fade away
//   2. the center "Also ships with" subtext crossfades into the statement
//      "The smartest member of your team isn't a hire."
//   3. the "Ask us for a demo" CTA rises in beneath it
// This makes ExtendedCapabilities the final beat of the reel.
export const OUTRO_START = LAST_CARD_END + 30;
export const CARDS_FADE_DURATION = 30;
export const STATEMENT_DURATION = 26;
export const CTA_START = OUTRO_START + 26;
export const CTA_DURATION = 28;

// Total section duration. Holds on the closing lockup for ~2.5s after the CTA
// lands so the beat breathes before the reel ends.
export const EXTENDED_DURATION = CTA_START + CTA_DURATION + 150;
