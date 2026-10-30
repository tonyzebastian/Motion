import React from "react";
import { interpolate, random } from "remotion";
import { pageToScreen, videoRect } from "./ExpandingVideo";
import {
  easeOut,
  SQUARE_CORNER_GAP,
  SQUARE_SIZE,
  SQUARES,
  type Corner,
} from "../timing";
import { useOpeningTiming } from "../TimingContext";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The four small black marks. They pop in among the words as soft, wobbling
// blobs; when the video expands, each moves to one corner of the video and
// firms up into a square on the way, then rides the corner outward.
export const CornerSquares: React.FC<{
  frame: number;
  width: number;
  height: number;
}> = ({ frame, width, height }) => {
  const t = useOpeningTiming();
  const video = videoRect(frame, width, height, t);
  const snap = interpolate(
    frame,
    [t.expandStart, t.expandStart + t.squareSnapFrames],
    [0, 1],
    { ...clamp, easing: easeOut },
  );

  return (
    <>
      {SQUARES.map((sq, i) => {
        const at = t.wordAt[sq.word];
        if (frame < at) return null;
        const pop = interpolate(frame, [at, at + t.squarePopFrames], [0, 1], {
          ...clamp,
          easing: easeOut,
        });

        // Resting spot among the words (follows the camera like the words).
        const rest = pageToScreen(frame, sq.x, sq.y, width, height, t);
        const size = lerp(SQUARE_SIZE * rest.scale, SQUARE_SIZE, snap);

        // Target: just outside the matching corner of the video.
        const target = cornerOf(video, sq.corner, size);

        const cx = lerp(rest.x, target.x, snap) + size / 2;
        const cy = lerp(rest.y, target.y, snap) + size / 2;
        // Blobs read a little larger than the square they become.
        const r = (size / 2) * lerp(BLOB_SCALE, 1, snap) * pop;
        const pad = r * 2;

        return (
          <svg
            key={i}
            width={pad * 2}
            height={pad * 2}
            viewBox={`${-pad} ${-pad} ${pad * 2} ${pad * 2}`}
            style={{
              position: "absolute",
              left: cx - pad,
              top: cy - pad,
              overflow: "visible",
            }}
          >
            <path d={blobPath(i, frame, r, snap)} fill="#000" />
          </svg>
        );
      })}
    </>
  );
};

const cornerOf = (
  r: { left: number; top: number; width: number; height: number },
  corner: Corner,
  size: number,
) => {
  const g = SQUARE_CORNER_GAP;
  const leftX = r.left - g - size;
  const rightX = r.left + r.width + g;
  const topY = r.top - g - size;
  const bottomY = r.top + r.height + g;
  switch (corner) {
    case "topLeft":
      return { x: leftX, y: topY };
    case "topRight":
      return { x: rightX, y: topY };
    case "bottomLeft":
      return { x: leftX, y: bottomY };
    case "bottomRight":
      return { x: rightX, y: bottomY };
  }
};

const BLOB_SCALE = 1.45;
const BLOB_POINTS = 48;

// Outline that blends from a wobbling blob (morph = 0) to a square
// (morph = 1). Each point sits at an angle around the center; its distance is
// a lerp between a lumpy circle and the square's edge at that angle.
const blobPath = (seed: number, frame: number, r: number, morph: number) => {
  if (r <= 0) return "";
  // Three slow lobes per blob, each with its own phase and drift speed.
  const lobes = [2, 3, 5].map((k, j) => ({
    k,
    amp: 0.1 + random(`blob-amp-${seed}-${j}`) * 0.12,
    phase: random(`blob-phase-${seed}-${j}`) * Math.PI * 2,
    speed: (random(`blob-speed-${seed}-${j}`) - 0.5) * 0.12,
  }));
  // The blob slowly turns; it settles flat as it becomes a square.
  const spin = (random(`blob-spin-${seed}`) - 0.5) * 0.02 * frame * (1 - morph);

  let d = "";
  for (let n = 0; n < BLOB_POINTS; n++) {
    const a = (n / BLOB_POINTS) * Math.PI * 2;
    const wobble = lobes.reduce(
      (sum, l) => sum + l.amp * Math.sin(l.k * (a + spin) + l.phase + frame * l.speed),
      0,
    );
    const blobR = r * (1 + wobble);
    const squareR = r / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    const rr = lerp(blobR, squareR, morph);
    d += `${n === 0 ? "M" : "L"}${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`;
  }
  return d + "Z";
};
