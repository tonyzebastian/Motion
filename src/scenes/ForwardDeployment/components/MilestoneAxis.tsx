import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { COLORS, LAYOUT, MILESTONES, ANIMATION, TIMING } from '../constants';

interface MilestoneAxisProps {
  sundialPct: number;
}

export const MilestoneAxis: React.FC<MilestoneAxisProps> = ({ sundialPct }) => {
  const frame = useCurrentFrame();

  // Entrance: lines grow from top, labels fade in
  const entranceProgress = interpolate(
    frame,
    [TIMING.entranceMilestonesStart, TIMING.entranceMilestonesEnd],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  // Exit: fade out
  const exitOpacity = interpolate(
    frame,
    [TIMING.exitMilestonesStart, TIMING.exitMilestonesEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const dividerHeight = LAYOUT.dividerHeight * entranceProgress;
  const baseOpacity = entranceProgress * exitOpacity;

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.chartLeft,
        top: LAYOUT.chartTop,
        width: LAYOUT.chartWidth,
        height: LAYOUT.chartHeight,
        opacity: baseOpacity,
      }}
    >
      {MILESTONES.map((milestone) => {
        let labelOpacity = 1;

        if (milestone.pct > 0) {
          const crossingFrame = getCrossingFrame(milestone.pct, sundialPct, frame);
          if (crossingFrame !== null) {
            const elapsed = frame - crossingFrame;
            if (elapsed >= 0 && elapsed < ANIMATION.checkpointPulseDuration) {
              labelOpacity = interpolate(
                elapsed,
                [0, ANIMATION.checkpointPulseDuration / 2, ANIMATION.checkpointPulseDuration],
                [1, 0.6, 1],
                { extrapolateRight: 'clamp' },
              );
            }
          }
        }

        return (
          <div
            key={milestone.label}
            style={{
              position: 'absolute',
              left: milestone.x,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              style={{
                width: LAYOUT.dividerWidth,
                height: dividerHeight,
                backgroundColor: COLORS.divider,
              }}
            />
            <span
              style={{
                marginTop: 3,
                fontSize: LAYOUT.milestoneFontSize,
                fontWeight: 500,
                color: COLORS.labelText,
                lineHeight: '14.4px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                opacity: labelOpacity,
              }}
            >
              {milestone.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

function getCrossingFrame(
  milestonePct: number,
  currentSundialPct: number,
  currentFrame: number,
): number | null {
  if (currentSundialPct < milestonePct) return null;

  const { frames, values } = ANIMATION.sundialKeyframes;

  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] < milestonePct && values[i + 1] >= milestonePct) {
      const segmentStart = frames[i];
      const segmentEnd = frames[i + 1];
      const segmentRange = values[i + 1] - values[i];
      const pctIntoSegment = (milestonePct - values[i]) / segmentRange;
      const crossFrame = Math.round(
        segmentStart + pctIntoSegment * (segmentEnd - segmentStart),
      );

      if (currentFrame >= crossFrame) {
        return crossFrame;
      }
    }
  }

  return null;
}
