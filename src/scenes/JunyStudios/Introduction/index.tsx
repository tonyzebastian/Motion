import React from "react";
import { z } from "zod";
import type { CalculateMetadataFunction } from "remotion";
import { getSequenceDuration, SceneSequence } from "../shared/SceneSequence";
import { INTRO_SCENE_IDS, INTRO_SCENES } from "./sceneList";

// Props for a cut: which scenes to play, in order, and the crossfade length
// between them (0 = hard cut). Editable in the Studio props panel.
export const introCutSchema = z.object({
  scenes: z.array(z.enum(INTRO_SCENE_IDS)).min(1),
  transitionFrames: z.number().int().min(0),
});

export type IntroCutProps = z.infer<typeof introCutSchema>;

export const IntroductionCut: React.FC<IntroCutProps> = ({
  scenes,
  transitionFrames,
}) => {
  return (
    <SceneSequence
      scenes={scenes.map((id) => INTRO_SCENES[id])}
      transitionFrames={transitionFrames}
    />
  );
};

// Sets the video's length from the scenes it contains.
export const calculateIntroCutMetadata: CalculateMetadataFunction<
  IntroCutProps
> = ({ props }) => {
  return {
    durationInFrames: getSequenceDuration(
      props.scenes.map((id) => INTRO_SCENES[id]),
      props.transitionFrames,
    ),
  };
};
