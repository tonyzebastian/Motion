import React from 'react';
import {Check, FileText, ShieldCheck} from 'lucide-react';
import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {glow} from '@remotion/effects/glow';
import {shine} from '@remotion/effects/shine';
import {COLORS, SANS, SERIF, glass, progress, softBlurEase} from './theme';

export const SoftBlurText: React.FC<{
  text: string;
  start?: number;
  fontSize: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  start = 0,
  fontSize,
  color = COLORS.plum,
  fontFamily = SANS,
  fontWeight = 500,
  letterSpacing = '-0.03em',
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        lineHeight: 1,
        ...style,
      }}
    >
      {Array.from(text).map((char, index) => {
        const p = progress(frame, start + index * 1.15, 38, softBlurEase);
        return (
          <span
            key={`${char}-${index}`}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px)`,
              filter: `blur(${(1 - p) * 12}px)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

export const Reveal: React.FC<{
  children: React.ReactNode;
  start?: number;
  duration?: number;
  y?: number;
  scale?: number;
  style?: React.CSSProperties;
}> = ({children, start = 0, duration = 32, y = 28, scale = 0.985, style}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, duration);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * y}px) scale(${scale + (1 - scale) * p})`,
        filter: `blur(${(1 - p) * 7}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{children: React.ReactNode; dark?: boolean}> = ({
  children,
  dark = false,
}) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 20,
      lineHeight: 1,
      fontWeight: 600,
      color: dark ? 'rgba(255,255,255,0.68)' : 'rgba(83,29,89,0.64)',
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

export const BrowserWindow: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({children, style}) => (
  <div
    style={{
      ...glass,
      borderRadius: 28,
      overflow: 'hidden',
      ...style,
    }}
  >
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: `1px solid ${COLORS.line}`,
        background: 'rgba(255,255,255,0.74)',
      }}
    >
      <div style={{display: 'flex', gap: 9}}>
        {['#FF8E86', '#F4C55B', '#64C985'].map((color) => (
          <div key={color} style={{width: 12, height: 12, borderRadius: 99, background: color}} />
        ))}
      </div>
      <div
        style={{
          margin: '0 auto',
          transform: 'translateX(-28px)',
          borderRadius: 999,
          background: 'rgba(83,29,89,0.055)',
          color: 'rgba(83,29,89,0.54)',
          fontFamily: SANS,
          fontSize: 16,
          padding: '8px 24px',
        }}
      >
        app.sundial.ai
      </div>
    </div>
    {children}
  </div>
);

export const Wordmark: React.FC<{
  width?: number;
  shineStart?: number;
  light?: boolean;
}> = ({width = 360, shineStart = 0, light = false}) => {
  const frame = useCurrentFrame();
  const shineProgress = interpolate(frame, [shineStart, shineStart + 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  if (light) {
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <Img src={staticFile('sundial.svg')} style={{width: 84, height: 76, filter: 'brightness(0) invert(1)'}} />
        <div style={{fontFamily: SANS, fontSize: 80, fontWeight: 500, color: '#fff', letterSpacing: '-0.055em'}}>
          sundial
        </div>
      </div>
    );
  }

  return (
    <Img
      src={staticFile('logo.svg')}
      width={1088}
      height={320}
      effects={[
        shine({
          progress: shineProgress,
          angle: 22,
          haloSigma: 180,
          coreSigma: 54,
          haloIntensity: 0.2,
          coreIntensity: 0.32,
        }),
        glow({radius: 9, intensity: 0.15, threshold: 0.56, color: '#E5B8DF'}),
      ]}
      style={{width, height: width * (320 / 1088)}}
    />
  );
};

export const ConfidenceBadge: React.FC<{start?: number; compact?: boolean}> = ({
  start = 0,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 24, Easing.bezier(0.34, 1.35, 0.64, 1));
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 8 : 12,
        color: COLORS.green,
        background: COLORS.greenSoft,
        border: '1px solid rgba(29,123,87,0.18)',
        borderRadius: 999,
        padding: compact ? '8px 12px' : '12px 18px',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: compact ? 15 : 20,
        opacity: p,
        transform: `scale(${0.82 + p * 0.18})`,
        boxShadow: `0 12px 32px rgba(29,123,87,${p * 0.13})`,
      }}
    >
      <ShieldCheck size={compact ? 17 : 22} strokeWidth={2.4} />
      High confidence
    </div>
  );
};

export const CitationRow: React.FC<{
  index: number;
  label: string;
  detail: string;
  start: number;
}> = ({index, label, detail, start}) => (
  <Reveal start={start} duration={24} y={14}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 16,
        background: 'rgba(83,29,89,0.045)',
        border: `1px solid ${COLORS.line}`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          background: COLORS.white,
          color: COLORS.plum,
          boxShadow: '0 5px 14px rgba(60,30,70,0.08)',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {index}
      </div>
      <FileText size={20} color={COLORS.plum} />
      <div style={{flex: 1}}>
        <div style={{fontFamily: SANS, fontSize: 18, fontWeight: 600, color: COLORS.ink}}>{label}</div>
        <div style={{fontFamily: SANS, fontSize: 14, color: COLORS.muted, marginTop: 2}}>{detail}</div>
      </div>
      <Check size={18} color={COLORS.green} strokeWidth={3} />
    </div>
  </Reveal>
);

export const CustomerLogos: React.FC<{start?: number; dark?: boolean}> = ({
  start = 0,
  dark = false,
}) => {
  const logos = [
    ['customer-logos/openai.png', 120],
    ['customer-logos/character-ai.png', 150],
    ['customer-logos/gamma.png', 132],
    ['customer-logos/picsart.png', 112],
    ['customer-logos/mirage.png', 112],
  ] as const;
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56}}>
      {logos.map(([src, width], index) => (
        <Reveal key={src} start={start + index * 8} duration={25} y={10}>
          <Img
            src={staticFile(src)}
            style={{
              width,
              height: 40,
              objectFit: 'contain',
              opacity: dark ? 0.68 : 0.55,
              filter: dark ? 'brightness(0) invert(1)' : 'grayscale(1)',
            }}
          />
        </Reveal>
      ))}
    </div>
  );
};

export const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  serifAccent?: React.ReactNode;
  align?: 'left' | 'center';
}> = ({children, size = 82, color = COLORS.plum, serifAccent, align = 'left'}) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: size,
      lineHeight: 0.98,
      letterSpacing: '-0.055em',
      fontWeight: 500,
      color,
      textAlign: align,
    }}
  >
    {children}
    {serifAccent ? <span style={{fontFamily: SERIF, fontWeight: 700}}>{serifAccent}</span> : null}
  </div>
);
