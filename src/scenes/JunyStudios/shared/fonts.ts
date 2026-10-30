import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadReenieBeanie } from "@remotion/google-fonts/ReenieBeanie";

// Display type: spoken words, handwritten.
export const REENIE_BEANIE = loadReenieBeanie("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

// UI type: small labels.
export const INTER = loadInter("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
}).fontFamily;

// Small technical text (camera metadata).
export const PLEX_MONO = loadPlexMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

// Handwritten marks like frame numbers.
export const CAVEAT = loadCaveat("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;
