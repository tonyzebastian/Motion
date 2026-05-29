import React, { useContext, useMemo } from 'react';
import {
  Internals,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================
// RemapTime
// ============================================
//
// Plays children at a remapped frame so a scene authored at one fps (or with
// a specific frame timeline) can be embedded inside a parent timeline at a
// different rate without rewriting all of its TIMING constants.
//
// Implementation mirrors Remotion's own <Freeze /> component
// (node_modules/remotion/dist/cjs/freeze.js) — instead of pinning to one
// frame, we route a caller-provided map(localFrame) through the same two
// contexts that drive `useCurrentFrame()`:
//   1. Override TimelineContext so the absolute timeline frame for this
//      composition is `mapped + relativeFrom`.
//   2. Reset the SequenceContext.cumulatedFrom to 0 so the outer Sequence
//      offset doesn't get subtracted twice.
//
// With both contexts replaced, any descendant calling `useCurrentFrame()`
// receives exactly `mapped`. Fractional values are fine — `interpolate`
// handles them, and they produce smoother motion when the outer composition
// runs at a higher fps than the embedded scene.
// ============================================

type RemapTimeProps = {
  /**
   * Maps the section-local frame (the frame this component sees via
   * `useCurrentFrame()` inside its parent Sequence) to the frame that
   * children should see.
   *
   * Example: to play a 30fps scene at correct speed inside a 60fps parent
   * starting at the scene's frame 146, use:
   *   map={(f) => 146 + f / 2}
   */
  map: (localFrame: number) => number;
  children: React.ReactNode;
};

export const RemapTime: React.FC<RemapTimeProps> = ({ map, children }) => {
  const frame = useCurrentFrame();
  const videoConfig = useVideoConfig();
  const timelineContext = Internals.useTimelineContext();
  const sequenceContext = useContext(Internals.SequenceContext);

  const relativeFrom = sequenceContext?.relativeFrom ?? 0;
  const mapped = map(frame);

  const nextTimelineValue = useMemo(
    () => ({
      ...timelineContext,
      frame: {
        ...timelineContext.frame,
        [videoConfig.id]: mapped + relativeFrom,
      },
    }),
    [timelineContext, videoConfig.id, mapped, relativeFrom],
  );

  const nextSequenceValue = useMemo(() => {
    if (!sequenceContext) return null;
    return {
      ...sequenceContext,
      cumulatedFrom: 0,
    };
  }, [sequenceContext]);

  return (
    <Internals.TimelineContext.Provider value={nextTimelineValue}>
      <Internals.SequenceContext.Provider value={nextSequenceValue}>
        {children}
      </Internals.SequenceContext.Provider>
    </Internals.TimelineContext.Provider>
  );
};
