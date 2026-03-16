import React from 'react';
import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { COLORS, LAYOUT, SOURCE_CONFIGS, TIMING, SourceConfig } from '../constants';

const SourceCard: React.FC<{ config: SourceConfig; fadeOut: number }> = ({
  config,
  fadeOut,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - config.appearFrame;
  const entrance = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 15, mass: 1, stiffness: 120 },
  });

  const visible = frame >= config.appearFrame ? 1 : 0;
  const half = LAYOUT.sourceCardSize / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: config.x - half,
        top: config.y - half,
        width: LAYOUT.sourceCardSize,
        height: LAYOUT.sourceCardSize,
        transform: `scale(${entrance * visible})`,
        transformOrigin: 'center center',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          width: LAYOUT.sourceCardSize,
          height: LAYOUT.sourceCardSize,
          backgroundColor: COLORS.cardBg,
          border: `2px solid ${COLORS.cardBorder}`,
          borderRadius: LAYOUT.sourceBorderRadius,
          boxShadow: LAYOUT.cardShadow,
          padding: LAYOUT.sourcePadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile(config.file)}
          style={{
            width: LAYOUT.sourceLogoSize,
            height: LAYOUT.sourceLogoSize,
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

const ConnectorLine: React.FC<{ config: SourceConfig; lineFade: number }> = ({
  config,
  lineFade,
}) => {
  const frame = useCurrentFrame();

  const lineStartFrame = config.appearFrame;
  const lineEndFrame = config.appearFrame + config.lineDrawDuration;
  const lineProgress = interpolate(
    frame,
    [lineStartFrame, lineEndFrame],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (frame < config.appearFrame) return null;

  const dx = LAYOUT.center - config.x;
  const dy = LAYOUT.center - config.y;
  const lineLength = Math.hypot(dx, dy);

  const dashOffset = lineLength * (1 - lineProgress);

  return (
    <line
      x1={config.x}
      y1={config.y}
      x2={LAYOUT.center}
      y2={LAYOUT.center}
      stroke={COLORS.connector}
      strokeWidth={1.5}
      strokeDasharray={lineLength}
      strokeDashoffset={dashOffset}
      opacity={lineFade}
    />
  );
};

const PULSE_LINE_LENGTH = 14;

const PulseStreak: React.FC<{
  config: SourceConfig;
  pulseIndex: number;
  lineFade: number;
}> = ({ config, pulseIndex, lineFade }) => {
  const frame = useCurrentFrame();

  const lineEndFrame = config.appearFrame + config.lineDrawDuration;
  const pulseDelay = pulseIndex * Math.floor(config.pulseSpeed * 1.4);
  const pulseStartFrame = lineEndFrame + pulseDelay;
  const pulseEndFrame = pulseStartFrame + config.pulseSpeed;

  const t = interpolate(frame, [pulseStartFrame, pulseEndFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < pulseStartFrame || t >= 1) return null;

  const dx = LAYOUT.center - config.x;
  const dy = LAYOUT.center - config.y;
  const lineLength = Math.hypot(dx, dy);
  const ux = dx / lineLength;
  const uy = dy / lineLength;

  const headX = config.x + dx * t;
  const headY = config.y + dy * t;
  const tailX = headX - ux * PULSE_LINE_LENGTH;
  const tailY = headY - uy * PULSE_LINE_LENGTH;

  const pulseOpacity = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;

  return (
    <line
      x1={tailX}
      y1={tailY}
      x2={headX}
      y2={headY}
      stroke={COLORS.pulseDot}
      strokeWidth={2.5}
      strokeLinecap="round"
      opacity={pulseOpacity * lineFade}
    />
  );
};

export const SourceNodes: React.FC = () => {
  const frame = useCurrentFrame();

  const lineFade = interpolate(
    frame,
    [TIMING.linesFadeStart, TIMING.linesFadeEnd],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    },
  );

  const logoFade = interpolate(
    frame,
    [TIMING.logosFadeStart, TIMING.logosFadeEnd],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    },
  );

  if (lineFade <= 0 && logoFade <= 0) return null;

  return (
    <>
      {/* SVG layer for lines and pulses */}
      {lineFade > 0 && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: LAYOUT.sceneSize,
            height: LAYOUT.sceneSize,
            pointerEvents: 'none',
          }}
        >
          {SOURCE_CONFIGS.map((config) => (
            <ConnectorLine key={config.name} config={config} lineFade={lineFade} />
          ))}
          {SOURCE_CONFIGS.map((config) =>
            Array.from({ length: config.pulseCount }, (_, i) => (
              <PulseStreak
                key={`${config.name}-pulse-${i}`}
                config={config}
                pulseIndex={i}
                lineFade={lineFade}
              />
            )),
          )}
        </svg>
      )}

      {/* Logo cards fade out after lines */}
      {logoFade > 0 &&
        SOURCE_CONFIGS.map((config) => (
          <SourceCard key={config.name} config={config} fadeOut={logoFade} />
        ))}
    </>
  );
};
