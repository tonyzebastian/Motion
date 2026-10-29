import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

// Film grain. The noise pattern changes every `holdFrames` frames, so it
// shimmers like film without strobing.
export const Grain: React.FC<{
  opacity?: number;
  holdFrames?: number;
  baseFrequency?: number;
  // "overlay" suits photos and video; "multiply" shows on light paper.
  blend?: "overlay" | "multiply";
}> = ({
  opacity = 0.35,
  holdFrames = 2,
  baseFrequency = 0.8,
  blend = "overlay",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = Math.floor(frame / holdFrames);
  const id = `juny-grain-${blend}-${seed}`;

  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", mixBlendMode: blend, opacity }}
    >
      <svg width={width} height={height}>
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          {/* Grayscale, fully opaque */}
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"
          />
          {/* Push the noise away from mid-grey so the grain reads */}
          <feComponentTransfer>
            <feFuncR type="linear" slope="2.4" intercept="-0.7" />
            <feFuncG type="linear" slope="2.4" intercept="-0.7" />
            <feFuncB type="linear" slope="2.4" intercept="-0.7" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
