// ============================================
// Playbook section timing
// ============================================
//
// All values are SECTION-relative frames at the reel's 60fps. The Playbook
// section is the fourth top-level section of SundialReel2026 — it picks up
// where Everywhere's composer leaves off and runs:
//
//   Part A — the full Playbooks agent flow (30fps source, re-timed via
//            RemapTime to play at correct wall-clock speed inside the
//            60fps reel). Skips Phase 1 (cursor-enter + typewriter) since
//            the Everywhere composer already showed it.
//   Part B — PlaybooksTrustSignal (native 60fps), which is authored to
//            start exactly at Playbooks' phase7 (split open). Adds the
//            High Confidence badge + hover popover ending.
// ============================================

// Frame in the 30fps Playbooks scene where Part A starts playback.
// 160 is Phase 2's `morphStart` — the moment the input card begins
// translating up to become the chat bubble. Anchoring the section to
// this frame means Playbooks' morph fires the instant the Everywhere
// composer hands off, so the Everywhere chatbox can be animated UP in
// lockstep (matching speed, distance, and easing) instead of doing a
// static opacity crossfade.
export const PLAYBOOKS_START_FRAME = 160;

// Phase 2 morph runs from `morphStart`=160 to `morphEnd`=172 in the
// 30fps Playbooks timeline -> 24 reel frames (60fps).
export const MORPH_DURATION = 24;

// Reel-space upward translation of Playbooks' input/bubble during the
// morph. Derivation:
//   stage-space morphDistance = INPUT_CARD_TOP - conversationBubbleTop
//                             = 340 - 72 = 268
//   stage scale in reel        = 1080 / 900 = 1.2
//   reel-space delta           = 268 * 1.2 ≈ 321 px (upward)
export const MORPH_TRANSLATE_Y = 321;

// Frame in the 30fps Playbooks scene where Part A stops (== phase7Start).
// PlaybooksTrustSignal picks up at exactly this point natively at 60fps.
export const PLAYBOOKS_END_FRAME = 1134;

// Reel frames consumed by Part A: 30fps source frames * 2 (60fps).
// (1134 - 146) * 2 = 1976 frames ≈ 32.93s.
export const PART_A_DURATION =
  (PLAYBOOKS_END_FRAME - PLAYBOOKS_START_FRAME) * 2;

// PlaybooksTrustSignal runs natively at 60fps for 640 frames (~10.67s).
export const PART_B_DURATION = 640;

// Overlap between Part A's tail and Part B's head — the two scenes share
// pixel-identical browser-window framing, so the same crossfade window
// reads as a single continuous moment.
export const PARTS_CROSSFADE = 15;

// Where Part B starts inside the section.
export const PART_B_START = PART_A_DURATION - PARTS_CROSSFADE;

// Section-level fade-in. Matches the morph window so the new browser
// chrome reveals in lockstep with the Everywhere wrapper's translate +
// fade exit (both windows are [0, MORPH_DURATION] = [0, 24] in section
// local frames). By the time the Playbooks input/bubble have finished
// translating up, the section has just reached full opacity.
export const SECTION_FADE_IN = MORPH_DURATION;

// Part C — PlaybooksCitations (native 60fps). Picks up at the
// trust-signal settled end state and layers the artifact citation
// annotations (inline [N] markers + a source-table footnote popover).
export const PART_C_DURATION = 340;

// Overlap between Part B's tail and Part C's head. Both render the same
// settled split-view framing (split open, dashboard streamed, tag
// settled, popover dismissed, zoom == 1), so the crossfade reads as a
// single continuous frame.
export const PARTS_BC_CROSSFADE = 15;

// Where Part C starts inside the section.
export const PART_C_START = PART_B_START + PART_B_DURATION - PARTS_BC_CROSSFADE;

// Total section duration (Part C's window extends past Part B).
export const PLAYBOOK_DURATION = PART_C_START + PART_C_DURATION;

// ============================================
// Exit handoff into Extended Capabilities (section 5)
// ============================================
//
// Instead of a flat opacity crossfade, the Playbook section "rises out" of
// frame on its way to Extended Capabilities: during its final
// PLAYBOOK_EXIT_DURATION frames the whole section translates upward and
// fades to 0. Extended Capabilities fades in slightly behind this motion so
// the beat reads as "the demo lifts away, then Sundial AI settles in" rather
// than a simple dissolve.
export const PLAYBOOK_EXIT_DURATION = 34;
export const PLAYBOOK_EXIT_TRANSLATE_Y = 160;
