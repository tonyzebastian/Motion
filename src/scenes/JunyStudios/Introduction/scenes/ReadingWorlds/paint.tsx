import React from "react";
import { BOIL_FRAMES } from "./timing";

// Shared filters for the illustrations. Rendered once per
// scene; every layer's SVG refers to these by id.

export const W = 1920;
export const H = 1080;

export const crayonId = (frame: number) => `rw-crayon-${Math.floor(frame / BOIL_FRAMES)}`;

export const PaintDefs: React.FC<{ frame: number }> = ({ frame }) => {
  const seed = Math.floor(frame / BOIL_FRAMES);
  const full = { filterUnits: "userSpaceOnUse" as const, x: 0, y: 0, width: W, height: H };

  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        {/* Crayon / colored pencil: fuzzy edges and streaky fill that
            re-rolls every few frames. */}
        <filter id={crayonId(frame)} {...full}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={1} seed={seed} result="fuzz" />
          <feDisplacementMap in="SourceGraphic" in2="fuzz" scale={6} xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7 0.08" numOctaves={2} seed={seed + 40} result="streak" />
          <feColorMatrix
            in="streak"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.85"
            result="streakMask"
          />
          <feComposite in="fuzzy" in2="streakMask" operator="in" result="streaky" />
          <feComponentTransfer in="fuzzy" result="under">
            <feFuncA type="linear" slope={0.62} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="under" />
            <feMergeNode in="streaky" />
          </feMerge>
        </filter>

        {/* Soft blur for cast shadows. */}
        <filter id="rw-soft" {...full}>
          <feGaussianBlur stdDeviation={7} />
        </filter>

        {/* Glow for spice and light. */}
        <filter id="rw-glow" {...full}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

      </defs>
    </svg>
  );
};

// Fills the frame, for one world layer.
export const Layer: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{ position: "absolute", left: 0, top: 0, ...style }}
  >
    {children}
  </svg>
);

