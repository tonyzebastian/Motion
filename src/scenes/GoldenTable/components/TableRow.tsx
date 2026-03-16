import React from 'react';
import { Img, staticFile, useCurrentFrame, interpolate, Easing, spring } from 'remotion';
import {
  COLORS,
  LAYOUT,
  TIMING,
  GOLDEN_ROW_INDEX,
  type TableRowData,
} from '../constants';

const GoldenStar: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="#F0A500"
    />
  </svg>
);

interface TableRowProps {
  data: TableRowData;
  rowIndex: number;
  morphProgress?: number;
}

export const TableRow: React.FC<TableRowProps> = ({ data, rowIndex, morphProgress = 0 }) => {
  const frame = useCurrentFrame();
  const isGolden = rowIndex === GOLDEN_ROW_INDEX;
  const isMorphing = morphProgress > 0;

  const entranceStart = TIMING.rowStaggerStart + rowIndex * TIMING.rowStaggerGap;
  const entranceEnd = entranceStart + TIMING.rowStaggerDuration;

  const entranceOpacity = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  const entranceY = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  const dimOpacity = isGolden
    ? 1
    : interpolate(
        frame,
        [TIMING.dimOthersStart, TIMING.dimOthersEnd],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
      );

  const combinedOpacity = entranceOpacity * dimOpacity;

  const focusFade = isGolden
    ? interpolate(
        frame,
        [TIMING.focusStart, TIMING.focusEnd],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
      )
    : 1;

  const cols = LAYOUT.columnWidths;

  const hoverAlpha = isGolden
    ? interpolate(
        frame,
        [TIMING.hoverStart, TIMING.hoverStart + 8],
        [0.05, 0.1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 0.05;

  // --- Tick mark: appears on click, hides when morph starts ---

  const tickScaleRaw = isGolden
    ? spring({
        frame: frame - TIMING.cursorClickFrame,
        fps: 30,
        config: { damping: 14, stiffness: 200 },
      })
    : 0;

  const showTick = isGolden && frame >= TIMING.cursorClickFrame;

  // --- Morph: name cell transitions ---
  // Phase 1 [0–0.4]: only other cells collapse. Name cell stays visually stable.
  // Phase 2 [0.45–1]: name cell transforms (size, weight, padding, etc).

  const morphBgAlpha = isGolden && isMorphing
    ? interpolate(morphProgress, [0.1, 0.2], [hoverAlpha, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : hoverAlpha;

  const nameCellBg = isGolden
    ? (morphBgAlpha > 0.001 ? `rgba(164, 61, 245, ${morphBgAlpha})` : 'transparent')
    : COLORS.dataCellBg;

  const nameFontSize = isGolden && isMorphing
    ? interpolate(morphProgress, [0.45, 1], [12.5, 20], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 12.5;

  const nameFontWeight = 500;

  const nameFontFamily = isGolden && morphProgress > 0.55
    ? "'Work Sans', sans-serif"
    : "'SF Mono', 'Fira Code', monospace";

  const nameLetterSpacing = -0.5;

  const nameLineHeight = isGolden && isMorphing
    ? `${interpolate(morphProgress, [0.45, 1], [18, 28], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })}px`
    : undefined;

  const nameHeight = isGolden && isMorphing
    ? interpolate(morphProgress, [0.45, 1], [LAYOUT.cellHeight, 28], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellHeight;

  const namePaddingY = isGolden && isMorphing
    ? interpolate(morphProgress, [0.45, 1], [LAYOUT.cellPaddingY, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellPaddingY;

  const namePaddingX = isGolden && isMorphing
    ? interpolate(morphProgress, [0.45, 1], [LAYOUT.cellPaddingX, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellPaddingX;

  const nameBorderRadius = isGolden && isMorphing
    ? interpolate(morphProgress, [0.4, 0.5], [LAYOUT.cellRadius, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellRadius;

  // --- Morph: non-name cells collapse ---

  const cellCollapse = isGolden && isMorphing
    ? interpolate(morphProgress, [0, 0.4], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;

  const rowGap = isGolden && isMorphing
    ? interpolate(morphProgress, [0, 0.4], [LAYOUT.cellGap, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellGap;

  const otherCellBg = isGolden
    ? `rgba(164, 61, 245, ${hoverAlpha})`
    : COLORS.dataCellBg;

  const otherCellStyle = (width: number, extra?: React.CSSProperties): React.CSSProperties => ({
    height: isMorphing ? LAYOUT.cellHeight * cellCollapse : LAYOUT.cellHeight,
    borderRadius: LAYOUT.cellRadius,
    backgroundColor: otherCellBg,
    padding: isMorphing
      ? `${LAYOUT.cellPaddingY * cellCollapse}px ${LAYOUT.cellPaddingX * cellCollapse}px`
      : `${LAYOUT.cellPaddingY}px ${LAYOUT.cellPaddingX}px`,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    fontSize: 12.5,
    fontWeight: 400,
    color: COLORS.cellText,
    letterSpacing: -0.3,
    width: width * cellCollapse,
    whiteSpace: 'nowrap',
    opacity: focusFade,
    overflow: 'hidden',
    ...extra,
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: rowGap,
        opacity: combinedOpacity,
        transform: `translateY(${entranceY}px)`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: nameHeight,
          borderRadius: nameBorderRadius,
          backgroundColor: nameCellBg,
          padding: `${namePaddingY}px ${namePaddingX}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          justifyContent: isGolden && morphProgress > 0.6 ? 'center' : undefined,
          flexShrink: 0,
          fontSize: nameFontSize,
          fontWeight: nameFontWeight,
          fontFamily: nameFontFamily,
          color: COLORS.cellText,
          letterSpacing: nameLetterSpacing,
          lineHeight: nameLineHeight,
          width: cols[0],
          whiteSpace: 'nowrap',
          overflow: isMorphing ? 'visible' : 'hidden',
          textOverflow: isMorphing ? undefined : 'ellipsis',
        }}
      >
        {data.name}
        {showTick && (
          <div style={{ transform: `scale(${tickScaleRaw})` }}>
            <GoldenStar />
          </div>
        )}
      </div>

      <div style={otherCellStyle(cols[1])}>
        {cellCollapse > 0.01 && data.rows}
      </div>

      <div style={otherCellStyle(cols[2])}>
        {cellCollapse > 0.01 && data.lastUpdated}
      </div>

      <div style={otherCellStyle(cols[3], { gap: LAYOUT.avatarGap })}>
        {cellCollapse > 0.01 && (
          <>
            <Img
              src={staticFile(data.avatarFile)}
              style={{
                width: LAYOUT.avatarSize * cellCollapse,
                height: LAYOUT.avatarSize * cellCollapse,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <span>{data.createdBy}</span>
          </>
        )}
      </div>
    </div>
  );
};
