import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, TIMING, CHART_DATA, LAYOUT } from '../constants';

// ============================================
// TimeSeriesChart Component
// ============================================
// Animated line chart showing declining DAU over time
// Grid and numbers animate first, then trendline draws

interface TimeSeriesChartProps {
  expandProgress: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ expandProgress }) => {
  const frame = useCurrentFrame();

  const { points, yAxisMax, yAxisMin } = CHART_DATA;
  const chartWidth = LAYOUT.chartWidth;
  const chartHeight = LAYOUT.chartHeight;

  // Padding for axis labels
  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 15;
  const paddingBottom = 25;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Grid and numbers animation progress (animates first)
  const gridProgress = frame >= TIMING.chartGridStart
    ? interpolate(
        frame,
        [TIMING.chartGridStart, TIMING.chartGridEnd],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // Line drawing progress (animates after grid)
  const lineProgress = frame >= TIMING.chartLineStart
    ? interpolate(
        frame,
        [TIMING.chartLineStart, TIMING.chartLineEnd],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // Convert data points to SVG coordinates
  const svgPoints = useMemo(() => {
    return points.map((point, index) => {
      const x = paddingLeft + (index / (points.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - ((point.value - yAxisMin) / (yAxisMax - yAxisMin)) * plotHeight;
      return { x, y, ...point };
    });
  }, [points, plotWidth, plotHeight, yAxisMin, yAxisMax]);

  // Create SVG path
  const pathD = useMemo(() => {
    if (svgPoints.length === 0) return '';
    
    let d = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    
    // Create smooth curve using bezier
    for (let i = 1; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1];
      const curr = svgPoints[i];
      const tension = 0.3;
      
      const cp1x = prev.x + (curr.x - prev.x) * tension;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * tension;
      const cp2y = curr.y;
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    
    return d;
  }, [svgPoints]);

  // Calculate path length for animation
  const pathLength = 1000;

  // Only render if expand is happening
  if (expandProgress < 0.1) {
    return null;
  }

  return (
    <div
      style={{
        width: chartWidth,
        height: chartHeight,
        backgroundColor: COLORS.chartBg,
        borderRadius: 12,
        position: 'relative',
        opacity: expandProgress,
        overflow: 'hidden',
      }}
    >
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Shadow filter for line */}
        <defs>
          <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={COLORS.chartLineShadow} />
          </filter>
        </defs>

        {/* Horizontal grid lines - animate with gridProgress */}
        {CHART_DATA.yAxisSteps.map((value, index) => {
          const y = paddingTop + plotHeight - ((value - yAxisMin) / (yAxisMax - yAxisMin)) * plotHeight;
          const staggerDelay = index * 0.15;
          const lineOpacity = interpolate(
            gridProgress,
            [staggerDelay, staggerDelay + 0.3],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          return (
            <g key={value}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={COLORS.chartGridLine}
                strokeWidth={1}
                opacity={lineOpacity}
              />
              {/* Y-axis label */}
              <text
                x={paddingLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fontFamily="'Work Sans', system-ui, sans-serif"
                fontWeight={400}
                fill={COLORS.chartAxisText}
                opacity={lineOpacity}
              >
                {value}K
              </text>
            </g>
          );
        })}

        {/* X-axis labels - animate with gridProgress */}
        {svgPoints.filter((_, i) => i % 3 === 0 || i === svgPoints.length - 1).map((point, index) => {
          const staggerDelay = 0.4 + index * 0.12;
          const labelOpacity = interpolate(
            gridProgress,
            [staggerDelay, staggerDelay + 0.25],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          return (
            <text
              key={point.month}
              x={point.x}
              y={chartHeight - 8}
              textAnchor="middle"
              fontSize={9}
              fontFamily="'Work Sans', system-ui, sans-serif"
              fontWeight={400}
              fill={COLORS.chartAxisText}
              opacity={labelOpacity}
            >
              {point.month}
            </text>
          );
        })}

        {/* Main line with animation - RED for decline */}
        <path
          d={pathD}
          fill="none"
          stroke={COLORS.chartLine}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineShadow)"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - lineProgress)}
        />

        {/* Data points - RED dots, animate with line */}
        {svgPoints.map((point, index) => {
          const pointProgress = interpolate(
            lineProgress,
            [index / points.length, (index + 1) / points.length],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          // Only show first, middle, and last points
          if (index !== 0 && index !== Math.floor(points.length / 2) && index !== points.length - 1) {
            return null;
          }

          return (
            <g key={point.month}>
              {/* White outline */}
              <circle
                cx={point.x}
                cy={point.y}
                r={5 * pointProgress}
                fill="white"
                opacity={pointProgress}
              />
              {/* Red center */}
              <circle
                cx={point.x}
                cy={point.y}
                r={3 * pointProgress}
                fill={COLORS.chartLine}
                opacity={pointProgress}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TimeSeriesChart;
