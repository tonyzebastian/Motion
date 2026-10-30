import React from "react";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { PHOTOS } from "./photos";
import { photoLandFrame, VO_WORDS } from "./timing";
import { useOpeningTiming } from "./TimingContext";

// Camera-themed sound effects, each placed on the frame its animation starts.
// Files come from scripts/generate-juny-opening-sfx.mjs. Volumes live in each
// timing set's `sfx` block (timing.ts); 0 turns a sound off.
const sfx = (name: string) =>
  staticFile(`juny-studios/introduction/opening/sfx/${name}.wav`);

const Cue: React.FC<{
  at: number;
  frames: number;
  src: string;
  volume: number;
  name: string;
}> = ({ at, frames, src, volume, name }) =>
  volume > 0 ? (
    <Sequence from={at} durationInFrames={frames} name={name} layout="none">
      <Audio src={src} volume={volume} />
    </Sequence>
  ) : null;

export const SoundEffects: React.FC = () => {
  const t = useOpeningTiming();
  const v = t.sfx;
  return (
    <>
      {PHOTOS.map((_, i) => (
        <Cue
          key={`shutter-${i}`}
          name={`SFX shutter ${i + 1}`}
          at={photoLandFrame(t, i) + 1}
          frames={7}
          src={sfx(`shutter-${i + 1}`)}
          volume={v.shutter}
        />
      ))}

      {VO_WORDS.map((w, i) => (
        <Cue
          key={`tap-${i}`}
          name={`SFX tap "${w.text}"`}
          at={t.wordAt[i]}
          frames={8}
          src={sfx(`tap-${i + 1}`)}
          volume={v.tap}
        />
      ))}

      {/* The ratchet's final stop lands as playback starts */}
      <Cue
        name="SFX film advance"
        at={t.videoPlayStart - 7}
        frames={12}
        src={sfx("film-advance")}
        volume={v.filmAdvance}
      />

      {/* Rises over the expand; the thump lands at full screen */}
      <Cue
        name="SFX whoosh"
        at={t.expandStart}
        frames={t.expandEnd - t.expandStart + 22}
        src={sfx(v.whooshFile)}
        volume={v.whoosh}
      />

      <Cue
        name="SFX corner zip"
        at={t.expandStart + 2}
        frames={10}
        src={sfx("corner-zip")}
        volume={v.cornerZip}
      />
    </>
  );
};
