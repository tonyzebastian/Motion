import React from "react";
import { Img, interpolate } from "remotion";
import { CAVEAT, INTER } from "../../../../shared/fonts";
import { driftFor } from "../camera";
import type { PhotoSlot } from "../photos";
import { easeOut, type OpeningTiming } from "../timing";
import { useOpeningTiming } from "../TimingContext";

const INK = "#2a2a2a";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Text that reads bottom-to-top, like a label printed up a film edge.
const vertical = { writingMode: "vertical-rl", transform: "rotate(180deg)" } as const;

// How far a photo (or the video) has landed (0 → 1).
export const landProgress = (
  frame: number,
  landAt: number,
  t: OpeningTiming,
) =>
  interpolate(frame, [landAt, landAt + t.photoEnterFrames], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

// `age` = how many photos have landed since this one (fractional while
// they're landing). Older photos fade, soften and lose color.
export const PhotoCard: React.FC<{
  slot: PhotoSlot;
  frame: number;
  landAt: number;
  age: number;
}> = ({ slot, frame, landAt, age }) => {
  const timing = useOpeningTiming();
  if (frame < landAt) return null;

  const enter = landProgress(frame, landAt, timing);
  const opacity = enter * interpolate(age, [0, 1, 4, 7], [1, 0.82, 0.4, 0.28], clamp);
  const blur = (1 - enter) * 14 + interpolate(age, [0, 4, 7], [0, 2.6, 3.6], clamp);
  const saturate = interpolate(age, [0, 4], [1, 0.5], clamp);
  const scale = 1.07 - 0.07 * enter;
  const lift = (1 - enter) * 26;

  const w = slot.width;
  const h = w * 1.25;
  const d = driftFor(frame, slot.depth, timing);
  const labelLeft = slot.labelSide === "left";

  return (
    <div
      style={{
        position: "absolute",
        left: slot.x - w / 2 + d.x,
        top: slot.y - h / 2 + d.y + lift,
        width: w,
        height: h,
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur.toFixed(2)}px) saturate(${saturate.toFixed(2)})`,
      }}
    >
      <Img
        src={slot.src}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {slot.perforated ? <Perforation height={h} /> : null}
      {slot.cropMarks ? <CropMarks /> : null}

      {/* Side column: handwritten frame number on top, "FRAME Nº" below */}
      <div
        style={{
          position: "absolute",
          top: 0,
          height: h,
          [labelLeft ? "right" : "left"]: w + 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ ...vertical, fontFamily: CAVEAT, fontSize: 30, lineHeight: 1 }}>
          {slot.frameNo}
        </div>
        <div
          style={{
            ...vertical,
            fontFamily: INTER,
            fontSize: 12,
            letterSpacing: "0.12em",
          }}
        >
          FRAME Nº
        </div>
      </div>
    </div>
  );
};

// Column of punched holes along the right edge, like a stamp/film edge.
const Perforation: React.FC<{ height: number }> = ({ height }) => {
  const count = Math.floor((height - 16) / 15);
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 9,
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "rgba(242,242,240,0.92)",
          }}
        />
      ))}
    </div>
  );
};

// L-shaped crop ticks just outside each corner.
const CropMarks: React.FC = () => {
  const len = 16;
  const off = -12;
  const line = { position: "absolute", backgroundColor: INK } as const;
  const corners = [
    { top: off, left: off, h: "left", v: "top" },
    { top: off, right: off, h: "right", v: "top" },
    { bottom: off, left: off, h: "left", v: "bottom" },
    { bottom: off, right: off, h: "right", v: "bottom" },
  ] as const;
  return (
    <>
      {corners.map((c, i) => {
        const { h, v, ...pos } = c;
        return (
          <div key={i} style={{ position: "absolute", width: len, height: len, ...pos }}>
            <div style={{ ...line, [v]: 0, [h]: 0, width: len, height: 1 }} />
            <div style={{ ...line, [v]: 0, [h]: 0, width: 1, height: len }} />
          </div>
        );
      })}
    </>
  );
};
