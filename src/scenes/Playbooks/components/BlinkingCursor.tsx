import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, TIMING } from '../constants';

type BlinkingCursorProps = {
  width?: number;
  height?: number;
  color?: string;
};

export const BlinkingCursor: React.FC<BlinkingCursorProps> = ({
  width = 1,
  height = 18,
  color = COLORS.black,
}) => {
  const frame = useCurrentFrame();
  const blinkPeriod = TIMING.cursorBlinkFrames * 2;
  const visible = frame % blinkPeriod < TIMING.cursorBlinkFrames;

  return (
    <span
      style={{
        display: 'inline-block',
        width,
        height,
        backgroundColor: color,
        opacity: visible ? 1 : 0,
        verticalAlign: 'middle',
      }}
    />
  );
};
