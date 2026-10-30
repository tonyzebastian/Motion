import { staticFile } from "remotion";

const dir = "juny-studios/introduction/opening";

// The middle video. Each timing set names its own trimmed file (timing.ts).
export const videoSrc = (file: string) => staticFile(`${dir}/${file}`);

export type PhotoSlot = {
  src: string;
  // Center of the photo on the 1920×1080 page.
  x: number;
  y: number;
  width: number; // height is width × 1.25 (4:5)
  // Parallax depth: higher moves more with the camera drift.
  depth: number;
  frameNo: string; // handwritten "07/36" mark
  perforated?: boolean;
  cropMarks?: boolean;
  // Which side the "FRAME Nº" label sits on.
  labelSide: "left" | "right";
};

// Listed in landing order, picked to alternate color, framing and side.
export const PHOTOS: PhotoSlot[] = [
  {
    src: staticFile(`${dir}/img_20170402_105231.jpg`),
    x: 330, y: 300, width: 300, depth: 0.7,
    frameNo: "04/36", perforated: true, labelSide: "left",
  },
  {
    src: staticFile(`${dir}/img_4566.jpg`),
    x: 1600, y: 760, width: 330, depth: 0.9,
    frameNo: "11/36", cropMarks: true, labelSide: "left",
  },
  {
    src: staticFile(`${dir}/img_0579.jpg`),
    x: 1500, y: 215, width: 250, depth: 1.1,
    frameNo: "17/36", labelSide: "right",
  },
  {
    src: staticFile(`${dir}/dscn5630.jpg`),
    x: 560, y: 840, width: 250, depth: 1.0,
    frameNo: "02/36", perforated: true, labelSide: "left",
  },
  {
    src: staticFile(`${dir}/img_4234.jpg`),
    x: 1830, y: 400, width: 260, depth: 1.3,
    frameNo: "23/36", labelSide: "left",
  },
  {
    src: staticFile(`${dir}/img_20161105_065652.jpg`),
    x: 120, y: 690, width: 270, depth: 1.2,
    frameNo: "08/36", cropMarks: true, labelSide: "right",
  },
  {
    src: staticFile(`${dir}/img_4538.jpg`),
    x: 1170, y: 920, width: 230, depth: 0.8,
    frameNo: "29/36", perforated: true, labelSide: "right",
  },
  {
    src: staticFile(`${dir}/img_7364.jpg`),
    x: 880, y: 175, width: 220, depth: 1.0,
    frameNo: "33/36", labelSide: "left",
  },
];

// Large faded copies behind everything, for depth (like the references).
export const GHOSTS: { src: string; x: number; y: number; width: number }[] = [
  { src: staticFile(`${dir}/img_4234.jpg`), x: 1180, y: 430, width: 620 },
  { src: staticFile(`${dir}/img_20170402_105231.jpg`), x: 380, y: 560, width: 520 },
];
