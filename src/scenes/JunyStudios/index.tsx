import React from "react";
import { Composition, Folder } from "remotion";
import {
  calculateIntroCutMetadata,
  introCutSchema,
  IntroductionCut,
} from "./Introduction";
import {
  INTRO_CUTS,
  INTRO_SCENE_IDS,
  INTRO_SCENES,
} from "./Introduction/sceneList";
import { JUNY_VIDEO } from "./shared/theme";

// All Juny Studios compositions. Each video gets its own sub-folder with:
//   - one composition per cut (combined scenes), e.g. JunyIntroduction-Full
//   - one composition per scene, exported as is, e.g. JunyIntroduction-Opening
export const JunyStudiosCompositions: React.FC = () => {
  return (
    <Folder name="Juny-Studios">
      <Folder name="Introduction">
        {Object.entries(INTRO_CUTS).map(([cutName, cut]) => (
          <Composition
            key={cutName}
            id={`JunyIntroduction-${cutName}`}
            component={IntroductionCut}
            schema={introCutSchema}
            defaultProps={cut}
            calculateMetadata={calculateIntroCutMetadata}
            // Placeholder; calculateMetadata sets the real length.
            durationInFrames={1}
            fps={JUNY_VIDEO.fps}
            width={JUNY_VIDEO.width}
            height={JUNY_VIDEO.height}
          />
        ))}
        <Folder name="Introduction-Scenes">
          {INTRO_SCENE_IDS.map((id) => (
            <Composition
              key={id}
              id={`JunyIntroduction-${id}`}
              component={INTRO_SCENES[id].component}
              durationInFrames={INTRO_SCENES[id].durationInFrames}
              fps={JUNY_VIDEO.fps}
              width={JUNY_VIDEO.width}
              height={JUNY_VIDEO.height}
            />
          ))}
        </Folder>
      </Folder>
    </Folder>
  );
};
