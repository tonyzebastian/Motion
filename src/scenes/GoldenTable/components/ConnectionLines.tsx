import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { COLORS, LAYOUT, TIMING, STACKED_IMAGES } from '../constants';

const HIGHLIGHT_STARTS = [
  TIMING.highlight1Start,
  TIMING.highlight2Start,
  TIMING.highlight3Start,
];

const CARD_BOTTOM_Y = TIMING.cardTopY + LAYOUT.compactCardHeight;
const CARD_CENTER_X = LAYOUT.sceneSize / 2;

const RAIL_Y = CARD_BOTTOM_Y + 40;

function buildPath(index: number): string {
  const sx = CARD_CENTER_X;
  const sy = CARD_BOTTOM_Y;

  if (index === 0) {
    const endX = STACKED_IMAGES[0].left + STACKED_IMAGES[0].width * 0.22;
    const endY = STACKED_IMAGES[0].top + 8;
    return `M ${sx} ${sy} L ${sx} ${RAIL_Y} L ${endX} ${RAIL_Y} L ${endX} ${endY}`;
  }

  if (index === 1) {
    const endY = STACKED_IMAGES[1].top;
    return `M ${sx} ${sy} L ${sx} ${endY}`;
  }

  const endX = STACKED_IMAGES[2].left + STACKED_IMAGES[2].width * 0.15;
  const endY = STACKED_IMAGES[2].top + 8;
  return `M ${sx} ${sy} L ${sx} ${RAIL_Y} L ${endX} ${RAIL_Y} L ${endX} ${endY}`;
}

export const ConnectionLines: React.FC = () => {
  const frame = useCurrentFrame();

  const paths = React.useMemo(
    () => STACKED_IMAGES.map((_, i) => buildPath(i)),
    [],
  );

  if (frame < HIGHLIGHT_STARTS[0]) return null;

  // Each line fades out when the NEXT highlight starts (only one line visible)
  const LINE_FADE_ENDS = [
    HIGHLIGHT_STARTS[1],                  // line 0 fades when image 1 highlights
    HIGHLIGHT_STARTS[2],                  // line 1 fades when image 2 highlights
    TIMING.fadeOutStart,                  // line 2 fades at global fade out
  ];

  return (
    <svg
      width={LAYOUT.sceneSize}
      height={LAYOUT.sceneSize}
      viewBox={`0 0 ${LAYOUT.sceneSize} ${LAYOUT.sceneSize}`}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      {paths.map((d, i) => {
        const lineStart = HIGHLIGHT_STARTS[i];
        const drawDuration = 10;
        const lineFadeEnd = LINE_FADE_ENDS[i];
        const lineFadeStart = lineFadeEnd - 8;

        const drawProgress = interpolate(
          frame,
          [lineStart, lineStart + drawDuration],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
        );

        const lineOpacity = interpolate(
          frame,
          [lineFadeStart, lineFadeEnd],
          [1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        if (drawProgress <= 0 || lineOpacity <= 0) return null;

        return (
          <AnimatedPath
            key={i}
            d={d}
            drawProgress={drawProgress}
            opacity={lineOpacity}
          />
        );
      })}
    </svg>
  );
};

const AnimatedPath: React.FC<{
  d: string;
  drawProgress: number;
  opacity: number;
}> = ({ d, drawProgress, opacity }) => {
  const pathRef = React.useRef<SVGPathElement>(null);
  const [length, setLength] = React.useState(300);

  React.useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, [d]);

  const dashOffset = length * (1 - drawProgress);

  return (
    <path
      ref={pathRef}
      d={d}
      stroke={COLORS.lineStroke}
      strokeWidth={2}
      fill="none"
      strokeDasharray={length}
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
};
