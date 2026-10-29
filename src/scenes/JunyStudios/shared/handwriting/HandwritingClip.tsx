import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { HAND_FONTS, HandWrite } from "./HandWrite";
import type { LeadStyle, TailStyle } from "./geometry";
import type { HandFont } from "./types";

// Renders a line (or lines) of handwriting exported from the playground
// Handwriting tool, on a transparent background, so it can be laid over
// other footage (e.g. a ProRes 4444 .mov in DaVinci Resolve).
//
//   npm run handwriting -- path/to/handwriting.json
//
// Layout and timing match the tool exactly: the tool works on a 1920-wide
// canvas at 30 fps, and this scales that to the export size and frame rate.

export const handwritingClipSchema = z.object({
  // One line per row.
  text: z.string(),
  font: z.string(),
  // Stroke data for a font uploaded into the tool (otherwise null).
  fontData: z.any().nullable().optional(),
  size: z.number(),
  // 0 = the font's own pen width.
  weight: z.number(),
  lineHeight: z.number(),
  align: z.enum(["left", "center", "right"]),
  // Timing, in 30 fps frames like the tool.
  wordGap: z.number(),
  speed: z.number(),
  hold: z.number(),
  exit: z.enum(["unwrite", "dissolve", "none"]),
  connect: z.number(),
  wordConnect: z.number(),
  lead: z.number(),
  leadStyle: z.enum(["auto", "swoop", "line", "hook", "wave"]),
  tail: z.number(),
  tailStyle: z.enum(["auto", "flick", "lift", "drop", "wave", "swash"]),
  variation: z.number(),
  wiggle: z.number(),
  boil: z.number(),
  texture: z.number(),
  ink: z.string(),
  shadow: z.boolean(),
  // Output video.
  width: z.number().int(),
  height: z.number().int(),
  fps: z.number(),
});

export type HandwritingClipProps = z.infer<typeof handwritingClipSchema>;

export const HANDWRITING_CLIP_DEFAULTS: HandwritingClipProps = {
  text: "for a while now,\nI’ve been getting\nmore curious about stories.",
  font: "reenieBeanie",
  fontData: null,
  size: 150,
  weight: 0,
  lineHeight: 0.9,
  align: "center",
  wordGap: 6,
  speed: 190,
  hold: 40,
  exit: "unwrite",
  connect: 0,
  wordConnect: 0,
  lead: 0.6,
  leadStyle: "auto",
  tail: 1,
  tailStyle: "auto",
  variation: 1,
  wiggle: 1,
  boil: 3,
  texture: 1,
  ink: "#ffffff",
  shadow: true,
  width: 1920,
  height: 1080,
  fps: 30,
};

const BASE_W = 1920;
const BASE_FPS = 30;
const FIRST_WORD = 6;
// Time for the text to leave after the exit starts (as in the tool).
const EXIT_FRAMES = 45;

const linesOf = (props: HandwritingClipProps) => {
  let n = 0;
  return props.text
    .split("\n")
    .map((line) => line.split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0)
    .map((words) => words.map((word) => ({ text: word, frame: FIRST_WORD + n++ * props.wordGap })));
};

// The clip's timeline in the tool's 30 fps frames.
const timeline = (props: HandwritingClipProps) => {
  const count = linesOf(props).reduce((sum, line) => sum + line.length, 0);
  const exitFrame = FIRST_WORD + Math.max(0, count - 1) * props.wordGap + 20 + props.hold;
  const duration = props.exit === "none" ? exitFrame + 10 : exitFrame + EXIT_FRAMES;
  return { exitFrame, duration };
};

export const calculateHandwritingClipMetadata: CalculateMetadataFunction<HandwritingClipProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil((timeline(props).duration * props.fps) / BASE_FPS)),
  fps: props.fps,
  width: props.width,
  height: props.height,
});

export const HandwritingClip: React.FC<HandwritingClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // Work in the tool's 30 fps frames and 1920-wide canvas.
  const f = (frame * BASE_FPS) / props.fps;
  const scale = width / BASE_W;
  const H = height / scale;

  const lines = linesOf(props);
  const { exitFrame } = timeline(props);
  const font: keyof typeof HAND_FONTS | HandFont =
    props.fontData ? (props.fontData as HandFont) : props.font in HAND_FONTS ? (props.font as keyof typeof HAND_FONTS) : "reenieBeanie";
  const lineH = props.size * props.lineHeight;
  const x = props.align === "left" ? 160 : props.align === "right" ? BASE_W - 160 : BASE_W / 2;
  const top = H / 2 - ((lines.length - 1) * lineH) / 2 + props.size * 0.2;

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: BASE_W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {lines.map((words, i) => (
          <HandWrite
            key={i}
            frame={f}
            words={words}
            x={x}
            y={top + i * lineH}
            align={props.align}
            size={props.size}
            font={font}
            color={props.ink}
            weight={props.weight > 0 ? props.weight : undefined}
            speed={props.speed}
            connect={props.connect}
            wordConnect={props.wordConnect}
            lead={i === 0 ? props.lead : 0}
            leadStyle={props.leadStyle as LeadStyle}
            tail={{ length: i === lines.length - 1 ? props.tail : 0, style: props.tailStyle as TailStyle }}
            wiggle={props.wiggle}
            boil={props.boil}
            texture={props.texture}
            exit={props.exit === "none" ? undefined : { type: props.exit, frame: exitFrame }}
            shadow={props.shadow ? undefined : "drop-shadow(0 0 0 transparent)"}
            seed={`line-${i}-v${props.variation}`}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
