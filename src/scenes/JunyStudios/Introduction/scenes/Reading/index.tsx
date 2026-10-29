import React from "react";
import {
  AbsoluteFill,
  Freeze,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Video } from "@remotion/media";
import { Grain } from "../../../shared/Grain";
import { NEWSREADER } from "../../../shared/fonts";
import {
  CAMERA,
  easeInOut,
  easeOut,
  FINAL_WORD,
  FOOTAGE,
  FOOTAGE_GRADE,
  PAGE_ONE,
  PAGE_TWO_LEFT,
  PAGE_TWO_RIGHT,
  READING_DURATION,
  TYPE,
  VIDEO_FILE,
  VIDEO_FRAMES,
  WORD_MOTION,
  type PageBlock,
} from "./timing";

export { READING_DURATION } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The footage: plays once, then holds on its last frame (the cover).
const Footage: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ filter: FOOTAGE_GRADE }}>
    <Freeze frame={VIDEO_FRAMES - 1} active={frame >= VIDEO_FRAMES}>
      <Video
        src={staticFile(VIDEO_FILE)}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </Freeze>
  </AbsoluteFill>
);

// One spoken word: rises in as it's said, then a highlighter sweeps under it
// left to right. Neighbouring marks overlap so a line reads as one stroke.
const SpokenWord: React.FC<{
  text: string;
  at: number;
  frame: number;
  color: string;
  trailingSpace: boolean;
}> = ({ text, at, frame, color, trailingSpace }) => {
  const enter = interpolate(frame, [at, at + WORD_MOTION.inFrames], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const hlStart = at + WORD_MOTION.highlightDelay;
  const sweep = interpolate(
    frame,
    [hlStart, hlStart + WORD_MOTION.highlightFrames],
    [0, 1],
    { ...clamp, easing: easeInOut },
  );

  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
      <span
        style={{
          position: "absolute",
          left: "-0.1em",
          right: trailingSpace ? "-0.02em" : "-0.12em",
          top: "0.2em",
          bottom: "0.06em",
          backgroundColor: color,
          borderRadius: "0.08em",
          transform: `scaleX(${sweep}) skewX(-6deg)`,
          transformOrigin: "left center",
          // Solid, so overlapping marks between words don't show seams.
          boxShadow: "0 2px 8px rgba(30, 20, 10, 0.18)",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "inline-block",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 10}px)`,
        }}
      >
        {text}
        {trailingSpace ? " " : ""}
      </span>
    </span>
  );
};

const Block: React.FC<{ block: PageBlock; frame: number }> = ({ block, frame }) => (
  <div
    style={{
      position: "absolute",
      left: block.x,
      top: block.y,
      fontFamily: NEWSREADER,
      fontWeight: 500,
      fontSize: TYPE.size,
      lineHeight: TYPE.lineHeight,
      color: TYPE.ink,
      letterSpacing: "-0.01em",
    }}
  >
    {block.lines.map((line, i) => (
      <div key={i}>
        {line.map((w, j) => (
          <SpokenWord
            key={j}
            text={w.text}
            at={w.frame}
            frame={frame}
            color={TYPE.highlight}
            trailingSpace={j < line.length - 1}
          />
        ))}
      </div>
    ))}
  </div>
);

// Page one sits on the right page and turns over the spine with the swipe.
const PageOne: React.FC<{ frame: number }> = ({ frame }) => {
  const turn = interpolate(frame, [FOOTAGE.swipeStart, FOOTAGE.swipeEnd], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  if (turn >= 1) return null;
  const angle = -180 * turn;

  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: `${FOOTAGE.spineX}px 540px` }}>
      <AbsoluteFill
        style={{
          transform: `rotateY(${angle}deg)`,
          transformOrigin: `${FOOTAGE.spineX}px 540px`,
          backfaceVisibility: "hidden",
          // Darkens a touch as it lifts, like the page turning away from light.
          filter: `brightness(${1 - 0.25 * Math.sin(turn * Math.PI)})`,
          opacity: interpolate(turn, [0.35, 0.5], [1, 0], clamp),
        }}
      >
        <Block block={PAGE_ONE} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Page two spreads across both pages and slips away as the book closes.
const PageTwo: React.FC<{ frame: number }> = ({ frame }) => {
  const close = interpolate(frame, [FOOTAGE.closeStart - 2, FOOTAGE.closeStart + 6], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  if (close >= 1) return null;

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - close,
        transform: `scaleX(${1 - 0.25 * close})`,
        transformOrigin: `${FOOTAGE.spineX}px 540px`,
        filter: close > 0 ? `blur(${close * 6}px)` : undefined,
      }}
    >
      <Block block={PAGE_TWO_LEFT} frame={frame} />
      <Block block={PAGE_TWO_RIGHT} frame={frame} />
    </AbsoluteFill>
  );
};

// "stories." lands beside the closed book, bigger, with a warmer mark.
const FinalWord: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      right: 1920 - FINAL_WORD.right,
      top: FINAL_WORD.y,
      fontFamily: NEWSREADER,
      fontWeight: 500,
      fontSize: TYPE.finalSize,
      lineHeight: 1,
      color: TYPE.ink,
      letterSpacing: "-0.015em",
    }}
  >
    <SpokenWord
      text={FINAL_WORD.text}
      at={FINAL_WORD.frame}
      frame={frame}
      color={TYPE.finalHighlight}
      trailingSpace={false}
    />
  </div>
);

// Scene — "For a while now, I've been getting more curious about stories."
// The voice-over is set on the pages as it's spoken, each word marked with a
// highlighter. "For a while now," turns away with the page swipe, the rest
// fills the next spread, and "stories." lands beside the Dune cover.
export const Reading: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = interpolate(frame, [0, READING_DURATION], [CAMERA.from, CAMERA.to], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${camera})` }}>
        <Footage frame={frame} />
        <PageOne frame={frame} />
        <PageTwo frame={frame} />
        <FinalWord frame={frame} />
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />
      <Grain opacity={0.16} />
    </AbsoluteFill>
  );
};
