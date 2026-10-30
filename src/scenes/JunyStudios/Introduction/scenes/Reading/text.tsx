import React from "react";
import { interpolate } from "remotion";
import { HandWrite, type HandExit } from "../../../shared/handwriting/HandWrite";
import {
  CLOSE,
  easeInOut,
  FINAL_WORD,
  PAGE_ONE_TEXT,
  PAGE_TWO_TEXT,
  PEN,
  type PenStyle,
  SWIPE,
  TEXT,
  type TextBlock,
  type Word,
} from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// One handwritten line with a block's pen settings. The lead-in only goes on
// a block's first line and the tail only on its last.
const Line: React.FC<{
  words: Word[];
  x: number;
  y: number;
  align: "center" | "right";
  size: number;
  pen: PenStyle;
  index: number;
  first: boolean;
  last: boolean;
  exit?: HandExit;
  frame: number;
}> = ({ words, x, y, align, size, pen, index, first, last, exit, frame }) => (
  <HandWrite
    frame={frame}
    words={words}
    x={x}
    y={y}
    align={align}
    size={size}
    font={TEXT.font}
    color={TEXT.ink}
    weight={TEXT.weight}
    speed={pen.speed}
    connect={pen.connect}
    wordConnect={pen.wordConnect}
    lead={first ? pen.lead : 0}
    leadStyle={pen.leadStyle}
    tail={last ? pen.tail : { length: 0 }}
    wiggle={pen.wiggle}
    boil={pen.boil}
    texture={pen.texture}
    exit={exit}
    seed={`line-${index}-v${pen.variation}`}
  />
);

// A block of handwritten lines, each centred on the block's x.
const Block: React.FC<{ block: TextBlock; pen: PenStyle; frame: number; exit?: HandExit }> = ({
  block,
  pen,
  frame,
  exit,
}) => (
  <>
    {block.lines.map((line, i) => (
      <Line
        key={i}
        words={line.words}
        x={block.x}
        y={block.y + i * TEXT.size * TEXT.lineHeight}
        align="center"
        size={TEXT.size}
        pen={pen}
        index={i}
        first={i === 0}
        last={i === block.lines.length - 1}
        exit={exit}
        frame={frame}
      />
    ))}
  </>
);

// The voice-over, handwritten on top of everything.
// "For a while now," is written across the middle of the book and runs off
// before the page turns. The rest is written across the next spread and
// runs off as the book closes. ("stories." is FinalWord, below.)
export const VoiceOverText: React.FC<{ frame: number }> = ({ frame }) => {
  const turn = interpolate(frame, [SWIPE.start, SWIPE.end], [0, 1], { ...clamp, easing: easeInOut });

  return (
    <>
      {turn < 0.5 && (
        <Block
          block={PAGE_ONE_TEXT}
          pen={PEN.pageOne}
          frame={frame}
          // Runs off just as the page starts to turn.
          exit={{ type: "unwrite", frame: SWIPE.start - 4, speed: 420 }}
        />
      )}

      <Block
        block={PAGE_TWO_TEXT}
        pen={PEN.pageTwo}
        frame={frame}
        // Runs off quickly as the book closes.
        exit={{ type: "unwrite", frame: CLOSE.start + 2, speed: TEXT.size * 3 }}
      />
    </>
  );
};

// "stories.", beside the closed book. It sits on screen rather than in book
// space: by then the edit has zoomed in far enough that it would run off the
// left edge.
export const FinalWord: React.FC<{ frame: number }> = ({ frame }) => (
  <Line
    words={[{ text: FINAL_WORD.text, frame: FINAL_WORD.frame }]}
    x={FINAL_WORD.right}
    y={FINAL_WORD.y}
    align="right"
    size={TEXT.finalSize}
    pen={PEN.final}
    index={0}
    first
    last
    frame={frame}
  />
);
