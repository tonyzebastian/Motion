import React from 'react';
import { interpolate } from 'remotion';
import { LAYOUT } from '../constants';

type SplitViewProps = {
  /**
   * 0..1 ease-out progress driven by phase7 timings.
   * 0 = full-width left, right panel collapsed and parked off-screen.
   * 1 = left contracted to LAYOUT.leftColWidthSplit, right at full
   * LAYOUT.rightPanelWidth, divider visible.
   */
  splitProgress: number;
  left: React.ReactNode;
  right: React.ReactNode;
};

/**
 * Two-column animator for the Phase 7 artifact split.
 *
 * The left column owns the chat experience and animates its width down
 * from the full browser body width to LAYOUT.leftColWidthSplit. The
 * right column slides in from the scene's right edge: it grows in width
 * from 0 to LAYOUT.rightPanelWidth AND simultaneously translates from
 * +rightPanelWidth to 0, so it reads as a panel sliding into view from
 * the right rather than scaling out from its center.
 *
 * A 1px vertical divider between the columns fades in from
 * splitProgress >= 0.6 to >= 1.0.
 */
export const SplitView: React.FC<SplitViewProps> = ({
  splitProgress,
  left,
  right,
}) => {
  const t = Math.max(0, Math.min(1, splitProgress));

  const leftWidth = interpolate(
    t,
    [0, 1],
    [LAYOUT.bodyContentWidth, LAYOUT.leftColWidthSplit],
  );
  const rightWidth = interpolate(t, [0, 1], [0, LAYOUT.rightPanelWidth]);
  const rightTranslateX = interpolate(
    t,
    [0, 1],
    [LAYOUT.rightPanelWidth, 0],
  );
  const dividerOpacity = interpolate(t, [0.6, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* Left column: contracts as the split opens. flexShrink/Grow are
          0 so the explicit width is honored exactly. */}
      <div
        style={{
          position: 'relative',
          width: leftWidth,
          flexShrink: 0,
          flexGrow: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {left}
      </div>

      {/* Divider. Sits directly between the two columns with no
          surrounding gap; LAYOUT.splitGap IS the divider width (1px).
          Fades in late so the collapse and divider don't compete for
          attention. */}
      {t > 0 && (
        <div
          style={{
            width: LAYOUT.splitGap,
            flexShrink: 0,
            flexGrow: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            opacity: dividerOpacity,
          }}
        />
      )}

      {/* Right panel: slides in from the right edge. We clip the
          column itself so the panel's content is masked off-screen
          before the slide begins. */}
      <div
        style={{
          position: 'relative',
          width: rightWidth,
          flexShrink: 0,
          flexGrow: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            // Lock the inner panel to its final width so contents don't
            // reflow as the column animates; the column's own
            // overflow-hidden takes care of clipping.
            width: LAYOUT.rightPanelWidth,
            height: '100%',
            transform: `translateX(${rightTranslateX}px)`,
          }}
        >
          {right}
        </div>
      </div>
    </div>
  );
};
