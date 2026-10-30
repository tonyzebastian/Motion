// A single-line font: every letter is a list of pen strokes.
// Stroke points are flat [x, y, x, y, …] in font units, y pointing up.
export type HandFont = {
  name?: string;
  license: string;
  unitsPerEm: number;
  xHeight: number;
  // Average pen width as a fraction of the em (fonts traced from outlines).
  stem?: number;
  // "advance": the font's own letter spacing (real fonts). "ink": space by
  // the drawn width (the EMS single-line fonts, whose advances are uneven).
  spacing?: "advance" | "ink";
  glyphs: Record<string, { adv: number; strokes: number[][] }>;
};

export type Pt = { x: number; y: number };

// One pen stroke after layout: evenly spaced points in px (y down, baseline
// at 0) and the distance along the stroke at each point.
export type Stroke = { pts: Pt[]; at: number[]; length: number; ch?: string };

// A laid-out word: its strokes in writing order.
export type WordLayout = { strokes: Stroke[]; x: number; width: number };
