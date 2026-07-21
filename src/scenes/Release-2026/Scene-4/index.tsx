import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { AbsoluteFill, Sequence } from "remotion";
import { DitherBackground } from "../components/DitherBackground";
import { QuestionDial } from "./components/QuestionDial";

export const release2026Scene4Schema = z.object({
  backgroundColor: zColor(),
  patternColor: zColor(),
  patternOpacity: z.number().min(0).max(0.3),
  iconSource: z.string(),
  initialQuestionIndex: z.number().int().min(0),
  questions: z.array(z.string()).min(1),
});

export type Release2026Scene4Props = z.infer<typeof release2026Scene4Schema>;

export const Release2026Scene4: React.FC<Release2026Scene4Props> = ({
  backgroundColor,
  iconSource,
  initialQuestionIndex,
  patternColor,
  patternOpacity,
  questions,
}) => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sequence name="Dither background">
        <DitherBackground
          backgroundColor={backgroundColor}
          patternColor={patternColor}
          patternOpacity={patternOpacity}
        />
      </Sequence>
      <Sequence name="Question dial">
        <QuestionDial
          iconSource={iconSource}
          initialQuestionIndex={initialQuestionIndex}
          questions={questions}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
