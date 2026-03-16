import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { COLORS, LAYOUT, TIMING, TABLE_DATA, GOLDEN_ROW_INDEX } from '../constants';
import { TableRow } from './TableRow';

const COLUMN_HEADERS = ['Table Name', 'Rows', 'Last updated', 'Created by'];

export const TableView: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = LAYOUT.columnWidths;
  const totalTableWidth =
    cols.reduce((a, b) => a + b, 0) + (cols.length - 1) * LAYOUT.cellGap;

  const headerOpacity = interpolate(
    frame,
    [TIMING.act1Start + 2, TIMING.act1Start + 12],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  const headerFade = interpolate(
    frame,
    [TIMING.focusStart, TIMING.focusEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  // --- Card dimensions (before morph) ---
  const fullCardWidth = totalTableWidth + LAYOUT.cardPadding * 2;
  const numRows = TABLE_DATA.length;
  const fullCardHeight =
    LAYOUT.cellHeight * (numRows + 1) + LAYOUT.cellGap * numRows + LAYOUT.cardPadding * 2;

  const ox = LAYOUT.zoomOriginX;
  const oy = LAYOUT.zoomOriginY;
  const s0 = LAYOUT.initialScale;
  const baseLeft =
    LAYOUT.sceneSize / 2 - ox * fullCardWidth - (0.5 - ox) * fullCardWidth * s0;
  const baseTop =
    LAYOUT.sceneSize / 2 - oy * fullCardHeight - (0.5 - oy) * fullCardHeight * s0;

  // --- Zoom (Act 1) ---
  const zoomedScale = interpolate(
    frame,
    [TIMING.zoomInStart, TIMING.zoomInEnd],
    [LAYOUT.initialScale, LAYOUT.zoomedScale],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) },
  );

  // --- Morph progress (Act 3) ---
  const morphProgress = interpolate(
    frame,
    [TIMING.morphStart, TIMING.morphEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) },
  );

  const compactW = LAYOUT.compactCardWidth;
  const compactH = LAYOUT.compactCardHeight;
  const centerLeft = (LAYOUT.sceneSize - compactW) / 2;
  const centerTop = (LAYOUT.sceneSize - compactH) / 2;

  const curLeft = interpolate(morphProgress, [0, 1], [baseLeft, centerLeft]);
  const morphTop = interpolate(morphProgress, [0, 1], [baseTop, centerTop]);
  const curWidth = interpolate(morphProgress, [0, 1], [fullCardWidth, compactW]);
  const curHeight = interpolate(morphProgress, [0, 1], [fullCardHeight, compactH]);
  const curScale = interpolate(morphProgress, [0, 1], [LAYOUT.zoomedScale, 1]);
  const curPadding = interpolate(morphProgress, [0, 1], [LAYOUT.cardPadding, 12]);
  const curRadius = interpolate(
    morphProgress,
    [0, 1],
    [LAYOUT.cardBorderRadius, LAYOUT.compactCardRadius],
  );

  const scale = frame < TIMING.morphStart ? zoomedScale : curScale;

  // Card slides up after morph + tag
  const cardMoveUp = interpolate(
    frame,
    [TIMING.cardMoveUpStart, TIMING.cardMoveUpEnd],
    [centerTop, TIMING.cardTopY],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) },
  );
  const curTop = frame >= TIMING.morphEnd ? cardMoveUp : morphTop;

  const fadeOut = interpolate(
    frame,
    [TIMING.fadeOutStart, TIMING.fadeOutEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const originStr = `${ox * 100}% ${oy * 100}%`;
  const isMorphing = morphProgress > 0;

  const cardBorder = `2px solid ${COLORS.cardBorder}`;

  const curPaddingY = isMorphing
    ? interpolate(morphProgress, [0, 1], [LAYOUT.cardPadding, 12])
    : LAYOUT.cardPadding;

  const compactPad = 12;

  // --- Layout collapse during morph ---

  const headerHeight = isMorphing
    ? interpolate(morphProgress, [0, 0.3], [LAYOUT.cellHeight, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellHeight;

  const otherRowHeight = isMorphing
    ? interpolate(morphProgress, [0, 0.3], [LAYOUT.cellHeight, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : undefined;

  const innerGap = isMorphing
    ? interpolate(morphProgress, [0, 0.4], [LAYOUT.cellGap, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : LAYOUT.cellGap;

  // Center the name cell horizontally in the compact card
  const compactContentWidth = compactW - 2 * compactPad;
  const targetTranslateX = (compactContentWidth - cols[0]) / 2;
  const innerTranslateX = isMorphing
    ? interpolate(morphProgress, [0, 1], [0, targetTranslateX])
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: isMorphing ? curLeft : baseLeft,
        top: isMorphing ? curTop : baseTop,
        width: isMorphing ? curWidth : fullCardWidth,
        height: isMorphing ? curHeight : fullCardHeight,
        background: COLORS.cardBg,
        borderRadius: isMorphing ? curRadius : LAYOUT.cardBorderRadius,
        border: cardBorder,
        boxShadow: morphProgress >= 1
          ? `${COLORS.cardShadow}, inset 0px 1px 2px rgba(0, 0, 0, 0.03)`
          : COLORS.cardShadow,
        overflow: 'hidden',
        opacity: fadeOut,
        transform: `scale(${scale})`,
        transformOrigin: originStr,
        padding: isMorphing
          ? `${curPaddingY}px ${curPadding}px`
          : LAYOUT.cardPadding,
        zIndex: isMorphing ? 10 : undefined,
      }}
    >
      <div
        style={{
          width: totalTableWidth,
          display: 'flex',
          flexDirection: 'column',
          gap: innerGap,
          borderRadius: LAYOUT.cardBorderRadius - LAYOUT.cardPadding / 2,
          overflow: 'hidden',
          transform: innerTranslateX > 0.1
            ? `translateX(${innerTranslateX}px)`
            : undefined,
        }}
      >
        {/* Header row — collapses during morph */}
        <div
          style={{
            display: 'flex',
            gap: LAYOUT.cellGap,
            opacity: headerOpacity * headerFade,
            height: headerHeight,
            overflow: 'hidden',
          }}
        >
          {COLUMN_HEADERS.map((header, i) => (
            <div
              key={header}
              style={{
                width: cols[i],
                height: LAYOUT.cellHeight,
                borderRadius: LAYOUT.cellRadius,
                backgroundColor: COLORS.headerCellBg,
                padding: `${LAYOUT.cellPaddingY}px ${LAYOUT.cellPaddingX}px`,
                display: 'flex',
                alignItems: 'center',
                fontSize: 12.5,
                fontWeight: 500,
                color: COLORS.cellText,
                letterSpacing: -0.3,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {TABLE_DATA.map((row, i) => {
          const isGoldenRow = i === GOLDEN_ROW_INDEX;

          if (isGoldenRow) {
            return (
              <TableRow
                key={row.name}
                data={row}
                rowIndex={i}
                morphProgress={morphProgress}
              />
            );
          }

          return (
            <div
              key={row.name}
              style={{
                height: otherRowHeight,
                overflow: 'hidden',
              }}
            >
              <TableRow data={row} rowIndex={i} />
            </div>
          );
        })}

      </div>
    </div>
  );
};
