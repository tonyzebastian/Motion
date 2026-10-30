import React from "react";
import { interpolate } from "remotion";
import { REENIE_BEANIE } from "../../../../shared/fonts";
import { driftFor } from "../camera";
import { CENTER_DEPTH, easeOut, INK, VO_WORDS } from "../timing";
import { useOpeningTiming } from "../TimingContext";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The voice-over line, one word at a time, laid out around the small video.
export const SpokenWords: React.FC<{ frame: number }> = ({ frame }) => {
  const t = useOpeningTiming();
  const exit = interpolate(
    frame,
    [t.expandStart, t.expandStart + t.wordsExitFrames],
    [1, 0],
    { ...clamp, easing: easeOut },
  );
  if (exit === 0) return null;

  const d = driftFor(frame, CENTER_DEPTH, t);
  const exitBlur = (1 - exit) * 10;

  return (
    <>
      {VO_WORDS.map((w, i) => {
        const at = t.wordAt[i];
        if (frame < at) return null;
        const p = interpolate(frame, [at, at + t.wordEnterFrames], [0, 1], {
          ...clamp,
          easing: easeOut,
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: w.x + d.x,
              top: w.y + d.y + (1 - p) * 16,
              fontFamily: REENIE_BEANIE,
              fontWeight: 400,
              fontSize: 92,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: INK,
              opacity: p * exit,
              filter: `blur(${((1 - p) * 10 + exitBlur).toFixed(2)}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {w.text}
          </div>
        );
      })}
    </>
  );
};
