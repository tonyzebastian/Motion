import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type OrbitDirection = "clockwise" | "anticlockwise";

type ImageOrbitProps = {
  readonly assemblyDurationInFrames: number;
  readonly cardColors: readonly string[];
  readonly direction: OrbitDirection;
  readonly imageSources: readonly string[];
  readonly orbitSpeed: number;
};

type OrbitItem =
  | { readonly color: string; readonly kind: "color" }
  | { readonly kind: "image"; readonly source: string };

const DEFAULT_CARD_COLORS = [
  "#D9A7A0",
  "#E7C78F",
  "#B8C99D",
  "#94B8C7",
  "#AAA2CC",
  "#D9A7C2",
  "#E0B18A",
  "#A8C9BE",
  "#9FB0D0",
  "#C7A6D2",
  "#D6C59C",
  "#A7C2A4",
] as const;

const MINIMUM_ORBIT_ITEMS = 12;

const resolveImageSource = (source: string): string => {
  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:") ||
    source.startsWith("blob:") ||
    source.startsWith("/")
  ) {
    return source;
  }

  return staticFile(source);
};

export const ImageOrbit: React.FC<ImageOrbitProps> = ({
  assemblyDurationInFrames,
  cardColors,
  direction,
  imageSources,
  orbitSpeed,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const usableSources = imageSources
    .map((source) => source.trim())
    .filter(Boolean)
    .slice(0, 30);
  const repeatedSources =
    usableSources.length > 0
      ? Array.from(
          { length: Math.max(MINIMUM_ORBIT_ITEMS, usableSources.length) },
          (_, index) => usableSources[index % usableSources.length],
        )
      : [];
  const usableColors = cardColors.length > 0 ? cardColors : DEFAULT_CARD_COLORS;
  const items: readonly OrbitItem[] =
    repeatedSources.length > 0
      ? repeatedSources.map((source) => ({ kind: "image", source }))
      : usableColors.slice(0, 30).map((color) => ({ color, kind: "color" }));

  const itemCount = items.length;
  const directionSign = direction === "clockwise" ? 1 : -1;
  const centerX = width * 0.5;
  const centerY = height * 0.51;
  const majorRadius = width * 0.405;
  const minorRadius = height * 0.325;
  const cardSize = width * 0.112;
  const tilt = (9 * Math.PI) / 180;
  const tiltCosine = Math.cos(tilt);
  const tiltSine = Math.sin(tilt);
  const startAngle = (137 * Math.PI) / 180;
  const postAssemblyFrame = Math.max(0, frame - assemblyDurationInFrames);
  const orbitOffset =
    directionSign * Math.PI * 2 * orbitSpeed * (postAssemblyFrame / fps);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {items.map((item, index) => {
        const itemDelay =
          itemCount <= 1 ? 0 : (index / itemCount) * assemblyDurationInFrames;
        const travelProgress = interpolate(
          frame,
          [itemDelay, assemblyDurationInFrames],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const travelDistance =
          directionSign *
          Math.PI *
          2 *
          ((itemCount - index) / itemCount) *
          travelProgress;
        const orbitAngle = startAngle + travelDistance + orbitOffset;

        // This periodic warp increases spacing on the right arc and compresses
        // it on the left without introducing a discontinuity in the loop.
        const warpedAngle = orbitAngle + 0.3 * Math.sin(orbitAngle);
        const ellipseX = majorRadius * Math.cos(warpedAngle);
        const ellipseY = minorRadius * Math.sin(warpedAngle);
        const x = ellipseX * tiltCosine - ellipseY * tiltSine;
        const y = ellipseX * tiltSine + ellipseY * tiltCosine;
        const depth = (Math.cos(warpedAngle) + 1) / 2;
        const entryOpacity = interpolate(
          frame,
          [itemDelay, itemDelay + 10],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const entryScale = interpolate(
          frame,
          [itemDelay, itemDelay + 10],
          [0.78, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const depthScale = 0.62 + 0.76 * depth;

        return (
          <div
            key={
              item.kind === "image"
                ? `${item.source}-${index}`
                : `${item.color}-${index}`
            }
            style={{
              backgroundColor: item.kind === "color" ? item.color : "#ffffff",
              border: "2px solid #ffffff",
              borderRadius: 10,
              boxSizing: "border-box",
              boxShadow:
                "0 18px 48px rgba(48, 43, 37, 0.14), 0 3px 10px rgba(48, 43, 37, 0.08)",
              height: cardSize,
              left: centerX + x,
              opacity: entryOpacity,
              overflow: "hidden",
              padding: item.kind === "image" ? 7 : 0,
              position: "absolute",
              scale: entryScale * depthScale,
              top: centerY + y,
              translate: "-50% -50%",
              width: cardSize,
              zIndex: Math.round(depth * 1000),
            }}
          >
            {item.kind === "image" ? (
              <>
                <Img
                  src={resolveImageSource(item.source)}
                  style={{
                    borderRadius: 4,
                    display: "block",
                    height: "100%",
                    objectFit: "cover",
                    width: "100%",
                  }}
                />
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{
                    borderRadius: 4,
                    inset: 7,
                    mixBlendMode: "soft-light",
                    opacity: 0.22,
                    pointerEvents: "none",
                    position: "absolute",
                  }}
                >
                  <defs>
                    <filter
                      id={`paper-texture-${index}`}
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.45"
                        numOctaves={3}
                        seed={31 + index * 7}
                        result="grain"
                      />
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.015 0.35"
                        numOctaves={2}
                        seed={47 + index * 5}
                        result="fibers"
                      />
                      <feBlend in="grain" in2="fibers" mode="multiply" />
                      <feColorMatrix type="saturate" values="0" />
                    </filter>
                  </defs>
                  <rect
                    width="100"
                    height="100"
                    filter={`url(#paper-texture-${index})`}
                  />
                </svg>
              </>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
