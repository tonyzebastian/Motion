import React from 'react';
import { ChevronRight } from 'lucide-react';
import { COLORS } from '../constants';
import { PulsingDot } from './PulsingDot';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type ToolCallRowProps = {
  /** Final ("done") label shown after the call settles. */
  label: string;
  /**
   * Running-state label shown while each sub-row is "in flight". Falls
   * back to `label` for single-shot tools.
   */
  runningLabel?: string;
  /**
   * Number of parallel sub-calls. 1 = single-shot (fades in as the done
   * label, no shimmer). N>1 = grouped: N sub-rows fade in with the
   * running label, each gets its own shimmer pass, then they collapse
   * into one done-state row.
   */
  subCount?: number;
  /**
   * 0..1 progress over the tool's full window. Drives sub-row staging,
   * shimmer sweeps, the collapse motion, and the running -> done label
   * morph.
   */
  progress?: number;
  /**
   * Whether to render the trailing chevron on the done-state row.
   * Defaults to true. Set to false for tools whose result is surfaced
   * separately (e.g. an artifact card rendered below the row).
   */
  showChevron?: boolean;
  style?: React.CSSProperties;
};

const ROW_HEIGHT = 20;
const ROW_GAP = 4;
const ROW_PITCH = ROW_HEIGHT + ROW_GAP;
const FADE_IN_DURATION = 0.075;

// Per-subCount sub-row schedule. Each entry is the window
// [appearStart, shimmerEnd) in normalized progress. Sub-rows appear
// sequentially: each row's appearStart equals the previous row's
// shimmerEnd, so each call fully settles before the next begins. After
// the last sub-row's shimmerEnd there's a brief hold, then the group
// collapses INSTANTLY to the done state (no animated transition).
type SubSchedule = { appearStart: number; shimmerEnd: number };

const SCHEDULES: Record<number, SubSchedule[]> = {
  2: [
    // 70f window. Row 0 settles by ~42f; Row 1 starts then, settles by
    // ~66f; hold until 0.94 (~66f), then instant collapse.
    { appearStart: 0.0, shimmerEnd: 0.43 },
    { appearStart: 0.46, shimmerEnd: 0.89 },
  ],
  3: [
    // 95f window. Each row gets ~30 frames (fade-in + shimmer + tiny
    // gap). Hold to 0.96, then instant collapse.
    { appearStart: 0.0, shimmerEnd: 0.31 },
    { appearStart: 0.33, shimmerEnd: 0.63 },
    { appearStart: 0.65, shimmerEnd: 0.94 },
  ],
};

// Progress at which the group flips to the collapsed/done state. No
// animation -- the running rows disappear and the done-state row 0 (with
// chevron) appears in the same frame.
const COLLAPSE_THRESHOLD = 0.95;

// For a single-shot tool with a separate `runningLabel`, the progress at
// which we flip from the running (shimmering) label to the done label.
// Shimmer sweeps from (FADE_IN_DURATION) to this threshold; the final
// ~30% of the window holds the done label.
const SINGLE_SHOT_DONE_SPLIT = 0.7;

const labelTextStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontWeight: 400,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '-0.2px',
  whiteSpace: 'nowrap',
};

/**
 * Compute the CSS gradient that produces a moving highlight across the
 * row text. `pos` is the gradient stop position in % (0..100). A pos of
 * -50 or 150 leaves the text fully grey (highlight off-canvas).
 */
const shimmerGradient = (pos: number): string =>
  `linear-gradient(90deg, rgba(115, 115, 115, 1) 0%, rgba(115, 115, 115, 1) ${
    pos - 20
  }%, rgba(115, 115, 115, 0.3) ${pos}%, rgba(115, 115, 115, 1) ${
    pos + 20
  }%, rgba(115, 115, 115, 1) 100%)`;

const SingleRow: React.FC<{
  label: string;
  opacity: number;
  slideY: number;
  showChevron?: boolean;
  /**
   * 0..1 shimmer sweep progress, or null for no shimmer (plain grey
   * text). 0 = highlight off the left edge, 1 = highlight off the right
   * edge.
   */
  shimmerProgress?: number | null;
}> = ({ label, opacity, slideY, showChevron = false, shimmerProgress = null }) => {
  const shimmer = shimmerProgress !== null;
  const pos = shimmer ? -50 + shimmerProgress * 200 : 0;

  const textStyle: React.CSSProperties = shimmer
    ? {
        ...labelTextStyle,
        color: 'transparent',
        backgroundImage: shimmerGradient(pos),
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    : { ...labelTextStyle, color: COLORS.iconStroke };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: ROW_HEIGHT,
        opacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      {/* Static green status dot (no pulse) marks every settled or in-flight
          single-row tool call. Same geometry as the Thinking dot so the
          column reads as one consistent rail. */}
      <PulsingDot variant="green" animated={false} />
      <span style={textStyle}>{label}</span>
      {showChevron && (
        <ChevronRight
          size={14}
          strokeWidth={1.8}
          color={COLORS.iconStroke}
          style={{ flexShrink: 0, marginLeft: -4 }}
        />
      )}
    </div>
  );
};

/**
 * Tool call row, optionally grouped.
 *
 * Single-shot (subCount=1): simple fade-in with the done label and
 * chevron. No shimmer.
 *
 * Grouped (subCount>1): row 0 stays pinned to the top. Each sub-row
 * (including row 0) fades in with a `runningLabel`, then receives one
 * shimmer sweep across the text. Rows 1..N-1 stack BELOW row 0 at
 * ROW_PITCH spacing. Once the last sub-row's shimmer completes, the
 * group enters the collapse window: the lower rows slide up into row 0
 * and fade out, and row 0's label morphs from running to done (with a
 * small opacity dip across the swap). The chevron appears on row 0
 * only AFTER it has flipped to the done label.
 */
export const ToolCallRow: React.FC<ToolCallRowProps> = ({
  label,
  runningLabel,
  subCount = 1,
  progress = 1,
  showChevron = true,
  style,
}) => {
  const t = Math.max(0, Math.min(1, progress));
  const running = runningLabel ?? label;

  // Single-shot path.
  if (subCount <= 1) {
    // Two-phase single-shot: when a distinct `runningLabel` is provided
    // (e.g. "Creating artifact" -> "Created artifact '...'") the row
    // first fades in showing the running label with a shimmer sweep,
    // then instantly flips to the done label and holds.
    const hasRunningPhase =
      runningLabel !== undefined && runningLabel !== label;

    if (hasRunningPhase) {
      const done = t >= SINGLE_SHOT_DONE_SPLIT;
      if (done) {
        return (
          <div style={style}>
            <SingleRow
              label={label}
              opacity={1}
              slideY={0}
              showChevron={showChevron}
            />
          </div>
        );
      }
      // Running phase: fade in, then shimmer until SINGLE_SHOT_DONE_SPLIT.
      const fadeIn = Math.max(0, Math.min(1, t / FADE_IN_DURATION));
      const shimStart = FADE_IN_DURATION;
      const shimEnd = SINGLE_SHOT_DONE_SPLIT;
      const shimmerProgress =
        t <= shimStart
          ? 0
          : Math.max(0, Math.min(1, (t - shimStart) / (shimEnd - shimStart)));
      return (
        <div style={style}>
          <SingleRow
            label={running}
            opacity={fadeIn}
            slideY={(1 - fadeIn) * 6}
            shimmerProgress={shimmerProgress}
          />
        </div>
      );
    }

    return (
      <div style={style}>
        <SingleRow
          label={label}
          opacity={t}
          slideY={(1 - t) * 6}
          showChevron={showChevron}
        />
      </div>
    );
  }

  const schedule = SCHEDULES[subCount] ?? [];

  // Has the group flipped to its collapsed (done) state? Instant flip
  // at COLLAPSE_THRESHOLD -- no animation in either direction.
  const collapsed = t >= COLLAPSE_THRESHOLD;

  // ============ Collapsed (done) state ============
  // Render just the done-state row 0 with chevron. The expanded sub-row
  // stack from the previous frame is replaced wholesale -- no slide-up,
  // no cross-fade.
  if (collapsed) {
    return (
      <div style={{ position: 'relative', height: ROW_HEIGHT, ...style }}>
        <SingleRow
          label={label}
          opacity={1}
          slideY={0}
          showChevron={showChevron}
        />
      </div>
    );
  }

  // ============ Running (expanded) state ============
  // Per-row appearance progress (0..1) -- ramps over FADE_IN_DURATION
  // starting at the row's appearStart.
  const appearOf = (k: number) => {
    const s = schedule[k]?.appearStart ?? 0;
    return Math.max(0, Math.min(1, (t - s) / FADE_IN_DURATION));
  };

  // Per-row shimmer sweep progress (0..1) -- runs from
  // (appearStart + FADE_IN_DURATION) to shimmerEnd. Returns null when
  // the row hasn't started shimmering yet OR when shimmer is finished.
  const shimmerOf = (k: number): number | null => {
    const entry = schedule[k];
    if (!entry) return null;
    const start = entry.appearStart + FADE_IN_DURATION;
    const end = entry.shimmerEnd;
    if (t <= start || t >= end) return null;
    return (t - start) / (end - start);
  };

  // Container height grows as each sub-row fades in. Once the group
  // collapses (handled above) the height drops to one row in the same
  // frame.
  let expandedRows = 1; // row 0 always counted
  for (let k = 1; k < subCount; k++) {
    expandedRows += appearOf(k);
  }
  const containerHeight = ROW_HEIGHT + (expandedRows - 1) * ROW_PITCH;

  return (
    <div
      style={{
        position: 'relative',
        height: containerHeight,
        ...style,
      }}
    >
      {Array.from({ length: subCount }, (_, k) => {
        const appear = appearOf(k);
        const y = k * ROW_PITCH + (1 - appear) * -4;
        const opacity = appear;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translateY(${y}px)`,
              opacity,
            }}
          >
            <SingleRow
              label={running}
              opacity={1}
              slideY={0}
              shimmerProgress={shimmerOf(k)}
            />
          </div>
        );
      })}
    </div>
  );
};
