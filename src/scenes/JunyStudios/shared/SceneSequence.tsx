import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { SceneDef } from "./types";

// A transition can't be longer than either scene it joins.
const overlapBetween = (a: SceneDef, b: SceneDef, transitionFrames: number) =>
  Math.max(
    0,
    Math.min(transitionFrames, a.durationInFrames - 1, b.durationInFrames - 1),
  );

// Total length of the joined scenes, minus the frames where they overlap.
export const getSequenceDuration = (
  scenes: SceneDef[],
  transitionFrames: number,
): number => {
  let total = 0;
  scenes.forEach((scene, i) => {
    total += scene.durationInFrames;
    if (i > 0) {
      total -= overlapBetween(scenes[i - 1], scene, transitionFrames);
    }
  });
  return Math.max(1, total);
};

// Plays scenes back to back, with an optional crossfade between them
// (0 = hard cut).
export const SceneSequence: React.FC<{
  scenes: SceneDef[];
  transitionFrames: number;
}> = ({ scenes, transitionFrames }) => {
  return (
    <TransitionSeries>
      {scenes.map((scene, i) => {
        const Scene = scene.component;
        const overlap =
          i > 0 ? overlapBetween(scenes[i - 1], scene, transitionFrames) : 0;
        return (
          <React.Fragment key={`${scene.title}-${i}`}>
            {overlap > 0 ? (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: overlap })}
              />
            ) : null}
            <TransitionSeries.Sequence
              name={scene.title}
              durationInFrames={scene.durationInFrames}
            >
              <Scene />
            </TransitionSeries.Sequence>
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
