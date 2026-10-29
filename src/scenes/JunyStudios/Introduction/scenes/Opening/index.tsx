import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain } from "../../../shared/Grain";
import { cameraScale } from "./camera";
import { CornerSquares } from "./components/CornerSquares";
import { ExpandingVideo } from "./components/ExpandingVideo";
import { PaperBackground } from "./components/PaperBackground";
import { landProgress, PhotoCard } from "./components/PhotoCard";
import { SpokenWords } from "./components/SpokenWords";
import { PHOTOS } from "./photos";
import { SoundEffects } from "./SoundEffects";
import { OpeningTimingContext } from "./TimingContext";
import {
  PAGE_COLOR,
  photoLandFrame,
  SHORT_TIMING,
  STANDARD_TIMING,
  type OpeningTiming,
} from "./timing";

export { OPENING_DURATION, OPENING_SHORT_DURATION } from "./timing";

// Scene 1 — "I've mostly been behind the camera."
// A small video plays in the middle while the line builds around it and
// photos of Juny with a camera pile up around the edges of a grainy cream
// page. Then the video expands to full screen to hand off to the next scene.
// Layout follows Figma: Storyboard › Scratch (node 47:201).
const OpeningScene: React.FC<{ timing: OpeningTiming }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const pageOpacity = interpolate(
    frame,
    [timing.expandStart, timing.expandStart + timing.sceneFadeFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <OpeningTimingContext.Provider value={timing}>
      <AbsoluteFill style={{ backgroundColor: PAGE_COLOR, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            opacity: pageOpacity,
            transform: `scale(${cameraScale(frame, timing)})`,
          }}
        >
          <PaperBackground frame={frame} />

          {PHOTOS.map((slot, i) => {
            // Sum of how far each later photo has landed.
            let age = 0;
            for (let j = i + 1; j < PHOTOS.length; j++) {
              age += landProgress(frame, photoLandFrame(timing, j), timing);
            }
            return (
              <PhotoCard
                key={slot.src}
                slot={slot}
                frame={frame}
                landAt={photoLandFrame(timing, i)}
                age={age}
              />
            );
          })}

          <SpokenWords frame={frame} />

          {/* Paper grain: dark specks that show on the light page */}
          <Grain blend="multiply" opacity={0.12} />
        </AbsoluteFill>

        <ExpandingVideo frame={frame} width={width} height={height} />
        <CornerSquares frame={frame} width={width} height={height} />

        <Grain />

        <SoundEffects />
      </AbsoluteFill>
    </OpeningTimingContext.Provider>
  );
};

// 6.5s: video holds a still for 2s before playing.
export const Opening: React.FC = () => <OpeningScene timing={STANDARD_TIMING} />;

// 3s: faster and snappier, video plays straight away.
export const OpeningShort: React.FC = () => <OpeningScene timing={SHORT_TIMING} />;
