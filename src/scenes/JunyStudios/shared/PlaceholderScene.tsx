import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { JUNY_COLORS, JUNY_FONT } from "./theme";

const ease = Easing.bezier(0.22, 1, 0.36, 1);

// Stand-in card for scenes that don't have their real content yet.
export const PlaceholderScene: React.FC<{ label: string; title: string }> = ({
  label,
  title,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: JUNY_COLORS.background,
        fontFamily: JUNY_FONT,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          color: JUNY_COLORS.accent,
          fontSize: 32,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: enter,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: JUNY_COLORS.text,
          fontSize: 120,
          fontWeight: 700,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 40}px)`,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
