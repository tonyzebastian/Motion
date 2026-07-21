import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";

type AnimatedCenterCopyProps = {
  readonly firstLine: string;
  readonly secondLine: string;
};

type StaggeredTextProps = {
  readonly startFrame: number;
  readonly text: string;
};

const splitFirstLine = (line: string): [string, string] => {
  const phrases = line
    .match(/[^.]+\.?/g)
    ?.map((phrase) => phrase.trim())
    .filter(Boolean);

  if (!phrases || phrases.length < 2) {
    return [line, ""];
  }

  return [phrases[0], phrases.slice(1).join(" ")];
};

const StaggeredText: React.FC<StaggeredTextProps> = ({ startFrame, text }) => {
  const frame = useCurrentFrame();

  return (
    <span
      aria-label={text}
      style={{
        display: "inline-flex",
        whiteSpace: "pre",
      }}
    >
      {text.split("").map((character, index) => {
        const letterStart = startFrame + index * 2;
        const letterEnd = letterStart + 9;

        return (
          <span
            key={`${character}-${index}`}
            aria-hidden
            style={{
              display: "inline-flex",
              height: "1.08em",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <span
              style={{
                filter: `blur(${interpolate(
                  frame,
                  [letterStart, letterEnd],
                  [7, 0],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )}px)`,
                opacity: interpolate(
                  frame,
                  [letterStart, letterStart + 3],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                rotate: interpolate(
                  frame,
                  [letterStart, letterEnd],
                  ["-3deg", "0deg"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                translate: `0 ${interpolate(
                  frame,
                  [letterStart, letterEnd],
                  [110, 0],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )}%`,
              }}
            >
              {character === " " ? "\u00A0" : character}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export const AnimatedCenterCopy: React.FC<AnimatedCenterCopyProps> = ({
  firstLine,
  secondLine,
}) => {
  const frame = useCurrentFrame();
  const [primaryPhrase, secondaryPhrase] = splitFirstLine(firstLine);
  const secondaryMaxWidth = Math.max(360, secondaryPhrase.length * 32);
  const secondaryStart = 112;
  const countStart = 148;

  return (
    <Interactive.Div
      name="Animated center copy"
      style={{
        color: "#111111",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: 52,
        fontWeight: 500,
        height: 150,
        letterSpacing: -2,
        lineHeight: 1.08,
        position: "relative",
        textAlign: "center",
        width: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: interpolate(frame, [144, 156], [52, 42], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          fontWeight: interpolate(frame, [144, 156], [500, 400], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          justifyContent: "center",
          left: 0,
          position: "absolute",
          right: 0,
          top: interpolate(frame, [144, 156], [48, 26], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ display: "flex", whiteSpace: "nowrap" }}>
          <StaggeredText startFrame={80} text={primaryPhrase} />
          {secondaryPhrase ? (
            <div
              style={{
                maxWidth: interpolate(
                  frame,
                  [secondaryStart, 140],
                  [0, secondaryMaxWidth],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <StaggeredText
                startFrame={secondaryStart}
                text={` ${secondaryPhrase}`}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          filter: `blur(${interpolate(
            frame,
            [countStart, countStart + 8],
            [5, 0],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
          fontSize: 52,
          fontWeight: 700,
          left: 0,
          opacity: interpolate(frame, [countStart, countStart + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          position: "absolute",
          right: 0,
          scale: interpolate(frame, [countStart, countStart + 10], [0.94, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          top: 76,
          translate: interpolate(
            frame,
            [countStart, countStart + 10],
            ["0px 12px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {secondLine}
      </div>
    </Interactive.Div>
  );
};
