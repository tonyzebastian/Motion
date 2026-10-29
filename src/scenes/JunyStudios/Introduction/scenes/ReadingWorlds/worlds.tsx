import React from "react";
import { interpolate } from "remotion";
import { Fish, Gull, type Pose } from "./figures";
import { crayonId } from "./paint";
import { ARRAKIS, CALADAN, easeOut, SPREAD } from "./timing";

// Each world draws in two layers:
// ink — figures on the page (under the hand)
// air — things flying above the book (over the hand)
export type WorldLayer = "ink" | "air";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const deg = (rad: number) => (rad * 180) / Math.PI;

const SpreadClip: React.FC<{ id: string }> = ({ id }) => (
  <clipPath id={id}>
    <rect
      x={SPREAD.left}
      y={SPREAD.top}
      width={SPREAD.right - SPREAD.left}
      height={SPREAD.bottom - SPREAD.top}
      rx={10}
    />
  </clipPath>
);

// ─── First spread: gulls overhead ──────────────────────────────────────

const GULLS = [
  { cx: 660, cy: 360, r: 110, speed: 0.045, phase: 0, s: 1.8 },
  { cx: 1060, cy: 370, r: 140, speed: -0.035, phase: 2.1, s: 1.5 },
  { cx: 1150, cy: 760, r: 120, speed: 0.04, phase: 4, s: 1.6 },
];

export const Caladan: React.FC<{ frame: number; layer: WorldLayer }> = ({ frame, layer }) => {
  // Only gulls here, flying above the hand.
  if (layer === "ink") return null;
  // They fade in as the page settles.
  const appear = interpolate(frame, [CALADAN.revealStart, CALADAN.revealEnd], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  return (
    <g filter={`url(#${crayonId(frame)})`} opacity={appear}>
      {GULLS.map((g, i) => {
        const a = g.phase + frame * g.speed;
        const pose: Pose = {
          x: g.cx + Math.cos(a) * g.r,
          y: g.cy + Math.sin(a) * g.r * 0.7,
          angle: deg(a) + (g.speed > 0 ? 90 : -90),
          scale: g.s,
        };
        return <Gull key={i} pose={pose} flap={Math.abs(Math.sin(frame * 0.5 + i))} />;
      })}
    </g>
  );
};

// ─── Second spread: fish ───────────────────────────────────────────────

// Fish scattered over the page, clear of the two lines of text across the
// middle, each a different size and swimming its own slow way.
// x, y: where it is when the page opens. heading: degrees (0 = right).
const FISH_SPOTS = [
  { x: 600, y: 330, heading: 8, scale: 0.75 },
  { x: 1130, y: 350, heading: 188, scale: 0.9 },
  { x: 860, y: 395, heading: -6, scale: 0.6 },
  { x: 560, y: 800, heading: -10, scale: 1.2 },
  { x: 800, y: 905, heading: 12, scale: 0.7 },
  { x: 1000, y: 770, heading: 176, scale: 1 },
  { x: 1220, y: 900, heading: 194, scale: 0.75 },
];

export const Arrakis: React.FC<{ frame: number; layer: WorldLayer }> = ({ frame, layer }) => {
  // Only fish here, on the page under the hand.
  if (layer === "air") return null;
  const t = Math.max(0, frame - ARRAKIS.start);
  return (
    <g>
      <defs>
        <SpreadClip id="rw-ark-clip" />
      </defs>
      <g clipPath="url(#rw-ark-clip)" filter={`url(#${crayonId(frame)})`}>
        {FISH_SPOTS.map((f, i) => {
          // Smaller fish dart a little faster; each one drifts up and down.
          const speed = 1.1 + (1 - f.scale) * 0.9;
          const h = (f.heading * Math.PI) / 180;
          const sway = Math.sin(t * 0.09 + i * 1.7) * 6;
          const pose: Pose = {
            x: f.x + Math.cos(h) * speed * t,
            y: f.y + Math.sin(h) * speed * t + sway,
            angle: f.heading + Math.cos(t * 0.09 + i * 1.7) * 5,
            scale: f.scale,
          };
          return <Fish key={i} pose={pose} wiggle={Math.sin(frame * 0.7 + i * 1.9)} />;
        })}
      </g>
    </g>
  );
};
