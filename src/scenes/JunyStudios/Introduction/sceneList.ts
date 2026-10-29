import type { SceneDef } from "../shared/types";
import {
  Opening,
  OPENING_DURATION,
  OPENING_SHORT_DURATION,
  OpeningShort,
} from "./scenes/Opening";
import { Outro, OUTRO_DURATION } from "./scenes/Outro";
import { Reading, READING_DURATION } from "./scenes/Reading";
import {
  ReadingWorlds,
  READING_WORLDS_DURATION,
} from "./scenes/ReadingWorlds";
import { Story, STORY_DURATION } from "./scenes/Story";

// Every Introduction scene, in story order. Adding a scene here gives it its
// own composition and makes it available to cuts.
export const INTRO_SCENE_IDS = [
  "Opening",
  "OpeningShort",
  "Reading",
  "ReadingWorlds",
  "Story",
  "Outro",
] as const;
export type IntroSceneId = (typeof INTRO_SCENE_IDS)[number];

export const INTRO_SCENES: Record<IntroSceneId, SceneDef> = {
  Opening: {
    title: "Opening",
    durationInFrames: OPENING_DURATION,
    component: Opening,
  },
  OpeningShort: {
    title: "Opening (3s)",
    durationInFrames: OPENING_SHORT_DURATION,
    component: OpeningShort,
  },
  Reading: {
    title: "Reading",
    durationInFrames: READING_DURATION,
    component: Reading,
  },
  ReadingWorlds: {
    title: "Reading (Dune worlds)",
    durationInFrames: READING_WORLDS_DURATION,
    component: ReadingWorlds,
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
  Full: { scenes: ["Opening", "Reading", "Story", "Outro"], transitionFrames: 15 },
};
