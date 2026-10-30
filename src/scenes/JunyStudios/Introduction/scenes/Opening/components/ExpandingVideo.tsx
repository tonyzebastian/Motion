import React from "react";
import { Freeze, Sequence, interpolate } from "remotion";
import { Video } from "@remotion/media";
import { cameraScale, driftFor } from "../camera";
import { landProgress } from "./PhotoCard";
import { videoSrc } from "../photos";
import {
  CENTER_DEPTH,
  easeInOut,
  VIDEO_SMALL,
  type OpeningTiming,
} from "../timing";
import { useOpeningTiming } from "../TimingContext";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Maps a point on the 1920×1080 page to the screen, following the page's
// camera push and the center layer's drift.
export const pageToScreen = (
  frame: number,
  x: number,
  y: number,
  width: number,
  height: number,
  t: OpeningTiming,
) => {
  const s = cameraScale(frame, t);
  const d = driftFor(frame, CENTER_DEPTH, t);
  return {
    x: width / 2 + (x + d.x - width / 2) * s,
    y: height / 2 + (y + d.y - height / 2) * s,
    scale: s,
  };
};

// Where the video is on screen: small among the words, then growing to fill
// the frame. `t` is the expansion progress (0 → 1).
export const videoRect = (
  frame: number,
  width: number,
  height: number,
  timing: OpeningTiming,
) => {
  const enter = landProgress(frame, timing.videoLand, timing);
  const t = interpolate(frame, [timing.expandStart, timing.expandEnd], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const small = pageToScreen(frame, VIDEO_SMALL.x, VIDEO_SMALL.y, width, height, timing);
  return {
    enter,
    t,
    left: lerp(small.x, 0, t),
    top: lerp(small.y, 0, t) + (1 - enter) * 18,
    width: lerp(VIDEO_SMALL.width * small.scale, width, t),
    height: lerp(VIDEO_SMALL.height * small.scale, height, t),
  };
};

// A small 4:5 video in the middle of the words. It holds on its first frame
// until videoPlayStart (no hold in the short version), then grows to fill
// the 16:9 frame.
export const ExpandingVideo: React.FC<{
  frame: number;
  width: number;
  height: number;
}> = ({ frame, width, height }) => {
  const timing = useOpeningTiming();
  const r = videoRect(frame, width, height, timing);
  const scale = 1.07 - 0.07 * r.enter;
  const blur = (1 - r.enter) * 12;
  const playStart = timing.videoPlayStart;

  return (
    <div
      style={{
        position: "absolute",
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        overflow: "hidden",
        opacity: r.enter,
        transform: `scale(${scale})`,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        backgroundColor: "#d9d2cc",
      }}
    >
      {/* Until playback starts, show the video's first frame as a still */}
      <Freeze frame={playStart} active={frame < playStart}>
        <Sequence from={playStart} premountFor={30}>
          <Video
            src={videoSrc(timing.videoFile)}
            muted
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </Sequence>
      </Freeze>
    </div>
  );
};
