import React from "react";
import { AbsoluteFill, Freeze, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { Grain } from "../../../shared/Grain";
import { footageFrame, VIDEO_FILE } from "./timing";
import { FinalWord, VoiceOverText } from "./text";
import { FOOTAGE_ZOOM } from "./zoom";

export { READING_DURATION } from "./timing";

// The graded footage, frame-locked to the scene.
const Footage: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    <Freeze frame={footageFrame(frame)}>
      <Video src={staticFile(VIDEO_FILE)} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
    </Freeze>
  </AbsoluteFill>
);

// Scene — "For a while now, I've been getting more curious about stories."
// The voice-over is handwritten over the book: "for a while now," across
// the first spread, "I've been getting / more curious about" across the
// next one after the page swipe, and "stories." beside the cover once the
// book closes.
export const Reading: React.FC = () => {
  const frame = useCurrentFrame();
  // The edit zooms in on the book. The page text was placed on the
  // un-zoomed footage, so it rides along in "book space".
  const zoom = FOOTAGE_ZOOM[footageFrame(frame)];
  const bookSpace: React.CSSProperties = {
    transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
    transformOrigin: "0 0",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Footage frame={frame} />
      <AbsoluteFill style={bookSpace}>
        <VoiceOverText frame={frame} />
      </AbsoluteFill>
      <FinalWord frame={frame} />

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.36) 100%)",
        }}
      />
      <Grain opacity={0.16} />
    </AbsoluteFill>
  );
};
