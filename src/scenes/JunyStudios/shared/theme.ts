// Shared Juny Studios settings. Every video and scene uses these, so a change
// here applies everywhere.
export const JUNY_VIDEO = {
  fps: 30,
  width: 1920,
  height: 1080,
} as const;

// Placeholder brand palette. Swap for the real Juny Studios colors.
export const JUNY_COLORS = {
  background: "#0f0e17",
  surface: "#1b1a27",
  text: "#fffffe",
  muted: "#a7a9be",
  accent: "#ff8906",
} as const;

export const JUNY_FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
