import React from "react";

// Small painted figures, drawn in local space pointing right (+x).

export type Pose = { x: number; y: number; angle: number; scale: number };

const place = (p: Pose) =>
  `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.angle.toFixed(2)}) scale(${p.scale.toFixed(3)})`;

// Everything is drawn like the gulls: one ink, open pen lines, no fills.
export const INK = "#2D3842";
const line = {
  fill: "none",
  stroke: INK,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// A fish seen from the side, drawn as a pen outline: body, a swinging
// tail, an eye and a gill line. `wiggle` swings the tail.
export const Fish: React.FC<{ pose: Pose; wiggle: number }> = ({ pose, wiggle }) => (
  <g transform={place(pose)}>
    <g transform={`rotate(${(wiggle * 16).toFixed(2)} -22 0)`}>
      <path d="M -20 0 Q -30 -6 -40 -15 Q -36 0 -40 15 Q -30 6 -20 0" {...line} strokeWidth={2.6} />
    </g>
    <path d="M 30 0 C 24 -16 -2 -18 -20 0 C -2 18 24 16 30 0" {...line} strokeWidth={3} />
    <path d="M 14 -9 Q 9 0 14 9" {...line} strokeWidth={1.8} />
    <path d="M 2 -14 Q -4 -22 -12 -12" {...line} strokeWidth={2} />
    <circle cx={20} cy={-3} r={2.2} fill={INK} />
  </g>
);

// A gull seen from above: two curved wings that beat.
export const Gull: React.FC<{ pose: Pose; flap: number }> = ({ pose, flap }) => {
  const lift = 4 + 8 * flap;
  return (
    <g transform={place(pose)}>
      <path
        d={`M 4 -18 Q ${-lift} -9 0 0 Q ${-lift} 9 4 18`}
        fill="none"
        stroke={INK}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx={2} cy={0} rx={5} ry={2.4} fill="#F3F1EA" stroke={INK} strokeWidth={1} />
    </g>
  );
};
