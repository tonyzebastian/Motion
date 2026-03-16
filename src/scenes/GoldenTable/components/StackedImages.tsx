import React from 'react';
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { LAYOUT, TIMING, STACKED_IMAGES } from '../constants';

const HIGHLIGHT_STARTS = [
  TIMING.highlight1Start,
  TIMING.highlight2Start,
  TIMING.highlight3Start,
];

function getHighlightIndex(frame: number): number {
  for (let i = HIGHLIGHT_STARTS.length - 1; i >= 0; i--) {
    if (frame >= HIGHLIGHT_STARTS[i]) return i;
  }
  return -1;
}

const SingleImage: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const config = STACKED_IMAGES[index];

  const entranceStart = TIMING.imagesAppearStart + index * TIMING.imagesStaggerGap;
  const entranceEnd = entranceStart + 12;

  const entranceOpacity = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  const entranceY = interpolate(
    frame,
    [entranceStart, entranceEnd],
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  const activeIdx = getHighlightIndex(frame);
  const isHighlighted = activeIdx === index;
  const someHighlightActive = activeIdx >= 0;

  // Overlay opacity: 0 = fully visible image, 0.7 = mostly covered by background wash
  const overlayOpacity = someHighlightActive && !isHighlighted ? 0.7 : 0;

  const shadowAlpha = isHighlighted
    ? interpolate(
        frame,
        [HIGHLIGHT_STARTS[index], HIGHLIGHT_STARTS[index] + 8],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 0;

  // Explicit z-order per highlight state: [DetailedAnalysis, Slack, Dashboard]
  const Z_ORDER: Record<number, number[]> = {
    [-1]: [3, 2, 1],
    0: [10, 9, 8],
    1: [9, 10, 8],
    2: [8, 9, 10],
  };
  const zIndex = (Z_ORDER[activeIdx] ?? Z_ORDER[-1])[index];

  const fadeOut = interpolate(
    frame,
    [TIMING.fadeOutStart, TIMING.fadeOutEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const pad = 8;

  return (
    <div
      style={{
        position: 'absolute',
        left: config.left,
        top: config.top,
        width: config.width,
        height: config.height,
        borderRadius: LAYOUT.imageRadius,
        overflow: 'hidden',
        opacity: entranceOpacity * fadeOut,
        transform: `translateY(${entranceY}px)`,
        boxShadow: shadowAlpha > 0.01
          ? `0 8px 32px rgba(0, 0, 0, ${0.18 * shadowAlpha})`
          : 'none',
        zIndex,
        backgroundColor: '#ffffff',
        padding: pad,
      }}
    >
      <Img
        src={staticFile(config.file)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'left top',
          borderRadius: LAYOUT.imageRadius - 4,
        }}
      />
      {overlayOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.75)',
            opacity: overlayOpacity,
            pointerEvents: 'none',
            borderRadius: LAYOUT.imageRadius,
          }}
        />
      )}
    </div>
  );
};

export const StackedImages: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < TIMING.imagesAppearStart) return null;

  return (
    <>
      {STACKED_IMAGES.map((_, i) => (
        <SingleImage key={i} index={i} />
      ))}
    </>
  );
};
