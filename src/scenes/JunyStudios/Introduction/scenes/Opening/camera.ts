import { interpolate } from "remotion";
import type { OpeningTiming } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Slow push-in for the whole page, plus a drift that each layer scales by its
// depth (parallax). Both run across the whole scene.
export const cameraScale = (frame: number, t: OpeningTiming) =>
  interpolate(frame, [0, t.duration], [1, t.cameraPush], clamp);

export const driftFor = (frame: number, depth: number, t: OpeningTiming) => {
  const p = interpolate(frame, [0, t.duration], [0, 1], clamp);
  return {
    x: -46 * p * depth,
    y: -16 * p * depth,
  };
};
