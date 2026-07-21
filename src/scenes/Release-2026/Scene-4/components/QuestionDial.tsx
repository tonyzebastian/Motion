import {
  Easing,
  Img,
  Interactive,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type QuestionDialProps = {
  readonly iconSource: string;
  readonly initialQuestionIndex: number;
  readonly questions: readonly string[];
};

const STEP_START_FRAMES = [150, 255, 360] as const;
const STEP_DURATION = 26;
const SLOT_ANGLE = 4;
const PIVOT_X = -863;
const PIVOT_Y = 540;
const DIAL_RADIUS = 1344;

const resolveIconSource = (source: string): string => {
  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:") ||
    source.startsWith("/")
  ) {
    return source;
  }

  return staticFile(source);
};

const getStepProgress = ({
  frame,
  fps,
  startFrame,
}: {
  readonly frame: number;
  readonly fps: number;
  readonly startFrame: number;
}): number => {
  const anticipationFrames = 5;

  if (frame < startFrame) {
    return 0;
  }

  if (frame < startFrame + anticipationFrames) {
    return interpolate(
      frame,
      [startFrame, startFrame + anticipationFrames],
      [0, -0.045],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  return (
    -0.045 +
    spring({
      fps,
      frame: frame - startFrame - anticipationFrames,
      config: {
        damping: 24,
        mass: 0.8,
        stiffness: 260,
      },
      durationInFrames: STEP_DURATION,
    }) *
      1.045
  );
};

const getIconPulse = (frame: number): { rotate: number; scale: number } => {
  for (const startFrame of STEP_START_FRAMES) {
    if (frame >= startFrame && frame <= startFrame + 22) {
      return {
        rotate: interpolate(
          frame,
          [startFrame, startFrame + 5, startFrame + 11, startFrame + 22],
          [0, -1, 1.25, 0],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
        scale: interpolate(
          frame,
          [startFrame, startFrame + 5, startFrame + 11, startFrame + 22],
          [1, 0.985, 1.035, 1],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      };
    }
  }

  return { rotate: 0, scale: 1 };
};

export const QuestionDial: React.FC<QuestionDialProps> = ({
  iconSource,
  initialQuestionIndex,
  questions,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safeInitialIndex = Math.min(
    Math.max(0, initialQuestionIndex),
    Math.max(0, questions.length - 1),
  );
  const iconEntrance = spring({
    fps,
    frame,
    config: {
      damping: 24,
      mass: 0.8,
      stiffness: 220,
    },
    durationInFrames: 55,
  });
  const iconPulse = getIconPulse(frame);
  const fanProgress = interpolate(frame, [58, 80], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const activeReveal = interpolate(frame, [40, 60], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const activeRevealOffset = interpolate(frame, [40, 62], [-92, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dialProgress = STEP_START_FRAMES.reduce(
    (total, startFrame) => total + getStepProgress({ frame, fps, startFrame }),
    0,
  );

  return (
    <>
      <Interactive.Div
        name="Question dial"
        style={{
          inset: 0,
          overflow: "hidden",
          position: "absolute",
        }}
      >
        {questions.map((question, index) => {
          const rawSlot = index - safeInitialIndex - dialProgress;
          const slot = rawSlot * fanProgress;
          const angle = slot * SLOT_ANGLE;
          const angleInRadians = (angle * Math.PI) / 180;
          const distance = Math.abs(rawSlot);
          const left =
            PIVOT_X +
            DIAL_RADIUS * Math.cos(angleInRadians) +
            (index === safeInitialIndex ? activeRevealOffset : 0);
          const top = PIVOT_Y + DIAL_RADIUS * Math.sin(angleInRadians) - 29;
          const distanceOpacity = interpolate(
            distance,
            [0, 1, 2, 3, 4, 5],
            [1, 0.5, 0.4, 0.3, 0.2, 0.1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const openingOpacity =
            index === safeInitialIndex ? activeReveal : fanProgress;

          return (
            <div
              key={`${question}-${index}`}
              style={{
                color: "#000000",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: 48,
                fontWeight: interpolate(distance, [0, 1], [500, 300], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                left,
                lineHeight: 1.18,
                opacity: distanceOpacity * openingOpacity,
                overflow: "hidden",
                position: "absolute",
                rotate: `${angle}deg`,
                textOverflow: "ellipsis",
                top,
                transformOrigin: "0% 50%",
                whiteSpace: "nowrap",
                width: 1344,
              }}
            >
              {question}
            </div>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="AI icon"
        style={{
          height: 90,
          left: interpolate(iconEntrance, [0, 1], [-120, 356]),
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          position: "absolute",
          rotate: `${iconPulse.rotate}deg`,
          scale: iconEntrance * iconPulse.scale,
          top: 495,
          width: 90,
          zIndex: 5,
        }}
      >
        <Img
          src={resolveIconSource(iconSource)}
          style={{
            height: "100%",
            objectFit: "contain",
            width: "100%",
          }}
        />
      </Interactive.Div>
    </>
  );
};
