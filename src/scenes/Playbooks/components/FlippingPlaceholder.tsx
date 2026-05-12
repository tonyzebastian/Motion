import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

export const HELPER_MESSAGES = [
  'Ask question',
  'Show me revenue this quarter',
  'Find anomalies in user activity',
  'Summarize last week\u2019s data',
  'Compare conversion across regions',
];

type FlippingPlaceholderProps = {
  messages?: string[];
  /** Frames each message stays fully visible before flipping. */
  framesPerMessage?: number;
  /** Length of the flip transition, in frames. */
  transitionFrames?: number;
  /** Height of the visible row (clips the flip). Should match line-height. */
  height?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
};

/**
 * Renders a single line of text that flips through `messages` like a split-flap
 * board: outgoing message slides up & fades; incoming slides in from below.
 */
export const FlippingPlaceholder: React.FC<FlippingPlaceholderProps> = ({
  messages = HELPER_MESSAGES,
  framesPerMessage = 60,
  transitionFrames = 10,
  height = 24,
  fontSize = 16,
  color = COLORS.text,
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();

  const total = framesPerMessage;
  const stable = total - transitionFrames;

  const cycle = ((frame % (messages.length * total)) + messages.length * total) % (messages.length * total);
  const idx = Math.floor(cycle / total);
  const local = cycle % total;

  const t =
    local < stable
      ? 0
      : interpolate(local, [stable, total], [0, 1], {
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const currentMessage = messages[idx];
  const nextMessage = messages[(idx + 1) % messages.length];

  const baseTextStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    fontFamily: FONT_FAMILY,
    fontWeight: 400,
    fontSize,
    lineHeight: `${height}px`,
    letterSpacing: '-0.5px',
    color,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        overflow: 'hidden',
        opacity,
      }}
    >
      <span
        style={{
          ...baseTextStyle,
          transform: `translateY(${-t * height}px)`,
          opacity: 1 - t,
        }}
      >
        {currentMessage}
      </span>
      <span
        style={{
          ...baseTextStyle,
          transform: `translateY(${(1 - t) * height}px)`,
          opacity: t,
        }}
      >
        {nextMessage}
      </span>
    </div>
  );
};
