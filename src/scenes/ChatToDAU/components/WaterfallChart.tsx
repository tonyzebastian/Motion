import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, TIMING, CHART_DATA, LAYOUT } from '../constants';

// ============================================
// WaterfallChart Component (RCA Chart)
// ============================================
// Root Cause Analysis waterfall chart showing DAU breakdown:
// - Start bar (purple): DAU on May 01 - from bottom
// - Decline bar (red): Android App - from bottom (shows magnitude of decline)
// - Floating bars (teal): iOS, Mobile, Other - stacked showing cumulative additions
// - End bar (purple): DAU on May 31 - from bottom

const getBarColor = (colorType: string): string => {
  switch (colorType) {
    case 'purple':
      return COLORS.barPurple;
    case 'red':
      return COLORS.barRed;
    case 'teal':
      return COLORS.barTeal;
    default:
      return COLORS.barPurple;
  }
};

// Animated Y-Axis component
const YAxis: React.FC<{ animationProgress: number }> = ({ animationProgress }) => {
  const steps = CHART_DATA.yAxisSteps;

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 20,
        bottom: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      {[...steps].reverse().map((value, index) => {
        // Stagger the label animations (bottom first, going up)
        const labelIndex = steps.length - 1 - index;
        const labelDelay = labelIndex * 3;
        const labelOpacity = Math.max(0, Math.min(1, (animationProgress * 30 - labelDelay) / 10));
        
        return (
          <div
            key={value}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              opacity: labelOpacity,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: "'Work Sans', system-ui, sans-serif",
                fontWeight: 400,
                color: COLORS.textLight,
                lineHeight: '12px',
              }}
            >
              {value === 0 ? '0' : `${value}K`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Animated horizontal grid lines
const GridLines: React.FC<{ animationProgress: number }> = ({ animationProgress }) => {
  const steps = CHART_DATA.yAxisSteps;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        right: 50,
        top: 20,
        bottom: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {steps.map((value, index) => {
        // Stagger the line animations (bottom line first, then going up)
        const lineIndex = steps.length - 1 - index;
        const lineDelay = lineIndex * 3; // 3 frames between each line
        const lineProgress = Math.max(0, Math.min(1, (animationProgress * 30 - lineDelay) / 10));
        
        // Bottom line (0) is always visible and slightly thicker
        const isBaseline = index === steps.length - 1;
        
        return (
          <div
            key={index}
            style={{
              width: `${lineProgress * 100}%`,
              height: isBaseline ? 1 : 1,
              backgroundColor: COLORS.axisLine,
              opacity: isBaseline ? 1 : 0.8,
              transition: 'width 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

// Calculate waterfall bar positions
// Returns { bottomOffset, height } for each bar in chart units (K)
const calculateWaterfallPositions = () => {
  const bars = CHART_DATA.bars;
  const startValue = bars[0].value; // 52.5K
  
  // After Android decline: 52.5 - 37.5 = 15K
  const afterDecline = startValue - Math.abs(bars[1].value);
  
  // Cumulative positions for floating bars
  let cumulative = afterDecline;
  
  return bars.map((bar, index) => {
    if (index === 0) {
      // First bar (DAU May 01): from 0 to value
      return { bottomOffset: 0, height: bar.value };
    } else if (index === 1) {
      // Android decline: from 0 to the decline amount
      return { bottomOffset: 0, height: Math.abs(bar.value) };
    } else if (index === bars.length - 1) {
      // Last bar (DAU May 31): from 0 to value
      return { bottomOffset: 0, height: bar.value };
    } else {
      // Floating bars: start at cumulative, add their value
      const bottomOffset = cumulative;
      const height = bar.value;
      cumulative += bar.value;
      return { bottomOffset, height };
    }
  });
};

// Bar component with animation
interface BarProps {
  label: string;
  value: number;
  displayValue: string;
  color: string;
  isTotal: boolean;
  bottomOffset: number;
  barHeight: number;
  chartAreaHeight: number;
  maxValue: number;
  animationProgress: number;
  hasHighlight?: boolean;
  highlightOpacity?: number;
}

const Bar: React.FC<BarProps> = ({
  label,
  displayValue,
  color,
  isTotal,
  bottomOffset,
  barHeight,
  chartAreaHeight,
  maxValue,
  animationProgress,
  value,
  hasHighlight,
  highlightOpacity = 0,
}) => {
  // Convert values to pixels
  const pixelHeight = (barHeight / maxValue) * chartAreaHeight * animationProgress;
  const pixelBottomOffset = (bottomOffset / maxValue) * chartAreaHeight;

  // Get bar color
  const barColor = getBarColor(color);

  // Determine if value label should be dimmed (for non-total positive values)
  const isPositiveContribution = !isTotal && value > 0;
  const labelOpacity = isPositiveContribution ? 0.5 : 1;

  // Position of value label above bar
  const labelBottom = pixelBottomOffset + pixelHeight + 55;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Highlight background for Android App bar */}
      {hasHighlight && highlightOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -8,
            right: -8,
            backgroundColor: 'rgba(255, 93, 57, 0.2)',
            borderLeft: '1px solid #ffb5b5',
            borderRight: '1px solid #ffb5b5',
            opacity: highlightOpacity,
          }}
        />
      )}

      {/* Value label above bar */}
      <div
        style={{
          position: 'absolute',
          bottom: labelBottom,
          fontSize: 13,
          fontFamily: "'Work Sans', system-ui, sans-serif",
          fontWeight: isTotal ? 500 : 400,
          color: COLORS.text,
          opacity: labelOpacity * animationProgress,
          letterSpacing: -0.45,
          lineHeight: '18px',
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}
      >
        {displayValue}
      </div>

      {/* Bar - positioned from bottom with offset */}
      <div
        style={{
          position: 'absolute',
          bottom: 50 + pixelBottomOffset,
          width: '75%',
          maxWidth: 94,
          height: pixelHeight,
          backgroundColor: barColor,
          borderRadius: 12,
          zIndex: 1,
        }}
      />

      {/* X-axis label */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          fontSize: 12,
          fontFamily: "'Work Sans', system-ui, sans-serif",
          fontWeight: 500,
          color: COLORS.text,
          textAlign: 'center',
          letterSpacing: -0.45,
          lineHeight: '16px',
          whiteSpace: 'pre-wrap',
          opacity: animationProgress,
          zIndex: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const WaterfallChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chartHeight = LAYOUT.chartHeight;
  const chartAreaHeight = chartHeight - 70; // Space for labels

  // Calculate waterfall positions
  const positions = calculateWaterfallPositions();

  // Grid and axis animation (starts slightly before bars)
  const gridAnimationStart = TIMING.barsAnimateStart - 10;
  const gridProgress = frame >= gridAnimationStart
    ? spring({
        frame: frame - gridAnimationStart,
        fps,
        config: { damping: 200, stiffness: 80 },
      })
    : 0;

  // Highlight opacity (appears after all bars are visible)
  const highlightProgress = frame >= TIMING.highlightStart
    ? spring({
        frame: frame - TIMING.highlightStart,
        fps,
        config: { damping: 200 },
      })
    : 0;

  return (
    <div
      style={{
        width: '100%',
        height: chartHeight,
        backgroundColor: COLORS.chartBg,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Grid lines */}
      <GridLines animationProgress={gridProgress} />

      {/* Animated Y-Axis labels */}
      <YAxis animationProgress={gridProgress} />

      {/* Bars container */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 50,
          top: 0,
          bottom: 0,
          display: 'flex',
          gap: 4,
        }}
      >
        {CHART_DATA.bars.map((bar, index) => {
          // Staggered animation
          const delay = index * TIMING.barStaggerDelay;
          const barFrame = frame - TIMING.barsAnimateStart - delay;
          
          const progress = barFrame > 0
            ? spring({
                frame: barFrame,
                fps,
                config: { damping: 200, stiffness: 100 },
              })
            : 0;

          // Android App bar (index 1) gets the highlight
          const hasHighlight = index === 1;
          const position = positions[index];

          return (
            <Bar
              key={bar.label}
              label={bar.label}
              value={bar.value}
              displayValue={bar.displayValue}
              color={bar.color}
              isTotal={bar.isTotal}
              bottomOffset={position.bottomOffset}
              barHeight={position.height}
              chartAreaHeight={chartAreaHeight}
              maxValue={CHART_DATA.yAxisMax}
              animationProgress={progress}
              hasHighlight={hasHighlight}
              highlightOpacity={highlightProgress}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WaterfallChart;
