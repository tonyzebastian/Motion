import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { DitherBackground } from "../components/DitherBackground";
import { AnimatedCenterCopy } from "./components/AnimatedCenterCopy";
import { ImageOrbit } from "./components/ImageOrbit";

export const release2026Scene2Schema = z.object({
  centerLineOne: z.string(),
  centerLineTwo: z.string(),
  backgroundColor: zColor(),
  patternColor: zColor(),
  patternOpacity: z.number().min(0).max(0.3),
  cardColors: z.array(zColor()),
  imageSources: z.array(z.string()),
  direction: z.enum(["clockwise", "anticlockwise"]),
  orbitSpeed: z.number().min(0).max(1),
});

export type Release2026Scene2Props = z.infer<typeof release2026Scene2Schema>;

export const Release2026Scene2: React.FC<Release2026Scene2Props> = ({
  backgroundColor,
  cardColors,
  centerLineOne,
  centerLineTwo,
  direction,
  imageSources,
  orbitSpeed,
  patternColor,
  patternOpacity,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sequence
        name="Dither background"
        premountFor={interpolate(frame, [259], [0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      >
        <DitherBackground
          backgroundColor={backgroundColor}
          patternColor={patternColor}
          patternOpacity={patternOpacity}
        />
      </Sequence>
      <Sequence name="Image orbit">
        <ImageOrbit
          assemblyDurationInFrames={120}
          cardColors={cardColors}
          direction={direction}
          imageSources={imageSources}
          orbitSpeed={orbitSpeed}
        />
      </Sequence>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 2000,
        }}
      >
        <AnimatedCenterCopy
          firstLine={centerLineOne}
          secondLine={centerLineTwo}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
