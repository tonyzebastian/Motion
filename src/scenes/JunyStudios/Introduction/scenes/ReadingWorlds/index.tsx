import React from "react";
import {
  AbsoluteFill,
  Freeze,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Video } from "@remotion/media";
import { Grain } from "../../../shared/Grain";
import { FOOTAGE_GRADE, VIDEO_FILE } from "../Reading/timing";
import { Layer, PaintDefs } from "./paint";
import {
  CLOSE,
  easeInOut,
  footageFrame,
  HAND_FRAMES,
  handFile,
  READING_WORLDS_DURATION,
  SPREAD,
  SWIPE,
} from "./timing";
import { VoiceOverText } from "./text";
import { Arrakis, Caladan, type WorldLayer } from "./worlds";

export { READING_WORLDS_DURATION } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 1920;

// Show only x between `from` and `to`.
const clipX = (from: number, to: number) =>
  `inset(0 ${Math.max(0, W - to)}px 0 ${Math.max(0, from)}px)`;

// The footage, time-remapped: it pauses on the first spread for a moment.
const Footage: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ filter: FOOTAGE_GRADE }}>
    <Freeze frame={footageFrame(frame)}>
      <Video
        src={staticFile(VIDEO_FILE)}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </Freeze>
  </AbsoluteFill>
);

// The hand cut out of the footage (scripts/generate-juny-hand-matte.mjs),
// laid back on top so it sits above the painted pages.
const Hand: React.FC<{ frame: number }> = ({ frame }) => {
  const source = footageFrame(frame);
  if (source >= HAND_FRAMES) return null;
  return (
    <AbsoluteFill style={{ filter: FOOTAGE_GRADE }}>
      <Img src={staticFile(handFile(source))} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

// A piece of a world: which world, and the clip/transform it's shown with.
type Piece = { which: "caladan" | "arrakis"; style: React.CSSProperties };

const PieceLayer: React.FC<{ piece: Piece; frame: number; layer: WorldLayer }> = ({
  piece,
  frame,
  layer,
}) => {
  const Comp = piece.which === "caladan" ? Caladan : Arrakis;
  return (
    <Layer style={piece.style}>
      <Comp frame={frame} layer={layer} />
    </Layer>
  );
};

// Scene — "For a while now, I've been getting more curious about stories."
// Two lightly sketched Dune worlds on the pages, pen-line drawings in one
// ink, with the voice-over handwritten over the top. First spread: gulls
// circling (Caladan). The page swipe turns it away and uncovers fish
// swimming across the next spread (Arrakis). The hand stays above the
// drawings; anything flying stays above the hand; the words sit above
// everything. The book closes on the Dune cover and "stories." lands
// beside it.
export const ReadingWorlds: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = interpolate(frame, [0, READING_WORLDS_DURATION], [1, 1.05], clamp);

  // Page turn, 0 → 1. The turning page's outer edge sits at
  // spine + width·cos(angle) (perspective aside).
  const turn = interpolate(frame, [SWIPE.start, SWIPE.end], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const cos = Math.cos(turn * Math.PI);
  const leftW = SPREAD.spine - SPREAD.left;
  const rightW = SPREAD.right - SPREAD.spine;
  const rightEdge = turn >= 0.5 ? SPREAD.spine : SPREAD.spine + rightW * cos + 40;
  const leftEdge = turn >= 1 ? 0 : turn <= 0.5 ? SPREAD.spine : SPREAD.spine + leftW * cos - 40;

  const close = interpolate(frame, [CLOSE.start - 2, CLOSE.start + 7], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });

  const pieces: Piece[] = [];
  if (turn > 0 && frame < CLOSE.end) {
    // New right page, uncovered as the old one lifts. Folds away on close.
    pieces.push({
      which: "arrakis",
      style: {
        clipPath: turn >= 1 ? undefined : clipX(rightEdge, W),
        transform: close > 0 ? `scaleX(${1 - 0.3 * close})` : undefined,
        transformOrigin: `${SPREAD.spine}px 540px`,
        opacity: 1 - close,
        filter: close > 0 ? `blur(${close * 6}px)` : undefined,
      },
    });
    // New left page: the back of the turned page as it lands.
    if (turn > 0.5 && turn < 1) {
      pieces.push({ which: "arrakis", style: { clipPath: clipX(leftEdge, SPREAD.spine) } });
    }
  }
  if (turn < 1) {
    // Old left page, covered as the turned page lands on it.
    pieces.push({ which: "caladan", style: { clipPath: clipX(0, leftEdge) } });
    // Old right page, turning over the spine with the swipe.
    if (turn < 0.5) {
      pieces.push({
        which: "caladan",
        style: {
          clipPath: clipX(SPREAD.spine, W),
          transform: `perspective(2200px) rotateY(${-180 * turn}deg)`,
          transformOrigin: `${SPREAD.spine}px 540px`,
        },
      });
    }
  }

  const draw = (layer: WorldLayer) =>
    pieces.map((p, i) => <PieceLayer key={`${layer}-${i}`} piece={p} frame={frame} layer={layer} />);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <PaintDefs frame={frame} />
      <AbsoluteFill style={{ transform: `scale(${camera})` }}>
        <Footage frame={frame} />
        {draw("ink")}
        {pieces.length > 0 && <Hand frame={frame} />}
        {draw("air")}


        <VoiceOverText frame={frame} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.36) 100%)",
        }}
      />
      <Grain opacity={0.16} />
    </AbsoluteFill>
  );
};
