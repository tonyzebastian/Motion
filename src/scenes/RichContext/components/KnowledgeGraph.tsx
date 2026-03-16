import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import {
  COLORS,
  LAYOUT,
  TIMING,
  DOTS,
  MESH_EDGES,
  HIGHLIGHT_PATHS,
  getEdgesForPath,
} from '../constants';

type EdgeHighlight = {
  edgeKey: string;
  drawProgress: number;
  fadeOut: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

function computeCycleEdgeHighlights(
  frame: number,
  cycleStart: number,
  cycleEnd: number,
  path: number[],
): EdgeHighlight[] {
  if (frame < cycleStart || frame > cycleEnd) return [];

  const edges = getEdgesForPath(path);
  const edgeCount = edges.length;
  if (edgeCount === 0) return [];

  const cycleDuration = cycleEnd - cycleStart;
  const tracePhase = cycleDuration * 0.45;
  const holdEnd = cycleStart + cycleDuration * 0.75;
  const perEdgeDuration = tracePhase / edgeCount;

  const results: EdgeHighlight[] = [];

  for (let i = 0; i < edgeCount; i++) {
    const [a, b] = edges[i];
    const edgeKey = `${Math.min(a, b)}-${Math.max(a, b)}`;

    const edgeStart = cycleStart + i * perEdgeDuration;
    const edgeEnd = edgeStart + perEdgeDuration;

    const drawProgress = interpolate(frame, [edgeStart, edgeEnd], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const fadeOut = interpolate(frame, [holdEnd, cycleEnd], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.ease),
    });

    if (drawProgress <= 0) continue;

    const dotFrom = DOTS[path[i]];
    const dotTo = DOTS[path[i + 1]];

    results.push({
      edgeKey,
      drawProgress,
      fadeOut,
      fromX: dotFrom.x,
      fromY: dotFrom.y,
      toX: dotTo.x,
      toY: dotTo.y,
    });
  }

  return results;
}

export const KnowledgeGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < TIMING.dotsScatterStart) return null;

  const finalFade = interpolate(
    frame,
    [TIMING.finalFadeStart, TIMING.finalFadeEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (finalFade <= 0) return null;

  const cycles = TIMING.highlightCycles.map((c, i) => ({
    path: HIGHLIGHT_PATHS[i],
    start: c.start,
    end: c.end,
  }));

  const allEdgeHighlights: EdgeHighlight[] = [];
  const highlightedEdgeKeys = new Set<string>();

  for (const cycle of cycles) {
    const edgeHls = computeCycleEdgeHighlights(frame, cycle.start, cycle.end, cycle.path);
    for (const hl of edgeHls) {
      allEdgeHighlights.push(hl);
      highlightedEdgeKeys.add(hl.edgeKey);
    }
  }

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: LAYOUT.sceneSize,
        height: LAYOUT.sceneSize,
        pointerEvents: 'none',
      }}
    >
      {/* Base mesh edges */}
      {MESH_EDGES.map(([a, b]) => {
        const dotA = DOTS[a];
        const dotB = DOTS[b];

        const edgeKey = `${Math.min(a, b)}-${Math.max(a, b)}`;

        const lastDotSettle = TIMING.dotsScatterStart + Math.max(a, b) * 0.6 + 15;
        const edgeAppearFrame = Math.max(lastDotSettle, TIMING.linesAppearStart);
        const edgeEntrance = interpolate(
          frame,
          [edgeAppearFrame, edgeAppearFrame + 10],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <line
            key={edgeKey}
            x1={dotA.x}
            y1={dotA.y}
            x2={dotB.x}
            y2={dotB.y}
            stroke={COLORS.meshDefault}
            strokeWidth={1}
            opacity={edgeEntrance * finalFade}
          />
        );
      })}

      {/* Animated highlight edges drawn on top */}
      {allEdgeHighlights.map((hl) => {
        const dx = hl.toX - hl.fromX;
        const dy = hl.toY - hl.fromY;
        const lineLength = Math.hypot(dx, dy);
        const dashOffset = lineLength * (1 - hl.drawProgress);
        const op = hl.fadeOut * finalFade;

        return (
          <line
            key={`hl-${hl.edgeKey}`}
            x1={hl.fromX}
            y1={hl.fromY}
            x2={hl.toX}
            y2={hl.toY}
            stroke={COLORS.meshHighlight}
            strokeWidth={1}
            strokeDasharray={lineLength}
            strokeDashoffset={dashOffset}
            opacity={op}
          />
        );
      })}

      {/* Dots - scatter from center */}
      {DOTS.map((dot) => {
        const dotDelay = dot.id * 0.6;
        const dotStartFrame = TIMING.dotsScatterStart + dotDelay;
        const localFrame = frame - dotStartFrame;

        const scatter = spring({
          frame: Math.max(0, localFrame),
          fps,
          config: { damping: 14, mass: 1, stiffness: 80 },
        });

        const visible = frame >= dotStartFrame ? 1 : 0;

        const cx = LAYOUT.center + (dot.x - LAYOUT.center) * scatter * visible;
        const cy = LAYOUT.center + (dot.y - LAYOUT.center) * scatter * visible;
        const r = dot.radius * Math.min(1, scatter * 1.5) * visible;
        const entranceOpacity = Math.min(1, scatter * 2) * visible * finalFade;

        return (
          <circle
            key={dot.id}
            cx={cx}
            cy={cy}
            r={r}
            fill={dot.color}
            opacity={entranceOpacity}
          />
        );
      })}
    </svg>
  );
};
