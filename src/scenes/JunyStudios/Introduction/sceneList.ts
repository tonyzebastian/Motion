import type { SceneDef } from "../shared/types";
import { Opening, OPENING_DURATION } from "./scenes/Opening";
import { Outro, OUTRO_DURATION } from "./scenes/Outro";
import { Story, STORY_DURATION } from "./scenes/Story";

// Every Introduction scene, in story order. Adding a scene here gives it its
// own composition and makes it available to cuts.
export const INTRO_SCENE_IDS = ["Opening", "Story", "Outro"] as const;
export type IntroSceneId = (typeof INTRO_SCENE_IDS)[number];

export const INTRO_SCENES: Record<IntroSceneId, SceneDef> = {
  Opening: {
    title: "Opening",
    durationInFrames: OPENING_DURATION,
    component: Opening,
  },
  Story: { title: "Story", durationInFrames: STORY_DURATION, component: Story },
  Outro: { title: "Outro", durationInFrames: OUTRO_DURATION, component: Outro },
};

// Saved scene combinations. Each one becomes its own composition.
// Add an entry to make a new combination, e.g. Teaser: ["Opening", "Outro"].
export const INTRO_CUTS: Record<
  string,
  { scenes: IntroSceneId[]; transitionFrames: number }
> = {
  Full: { scenes: [...INTRO_SCENE_IDS], transitionFrames: 15 },
};
