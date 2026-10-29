import type React from "react";

// One self-contained scene. It can be exported as its own composition or
// joined with other scenes into a cut.
export type SceneDef = {
  title: string;
  durationInFrames: number;
  component: React.FC;
};
