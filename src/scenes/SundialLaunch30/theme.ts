import {Easing, interpolate} from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';
import {fontFamily as aleo, loadFont as loadAleo} from '@remotion/google-fonts/Aleo';

loadFunnelSans('normal', {
  weights: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
});

loadAleo('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

export const SANS = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`;
export const SERIF = `"${aleo}", Georgia, serif`;

export const COLORS = {
  plum: '#531D59',
  plumDark: '#241028',
  ink: '#1E1720',
  muted: '#776C78',
  lilac: '#EADFF5',
  pink: '#F7D7D3',
  peach: '#FFD9C2',
  cream: '#FFF9F5',
  white: '#FFFFFF',
  green: '#1D7B57',
  greenSoft: '#E0F4E9',
  orange: '#D66C33',
  line: 'rgba(83, 29, 89, 0.13)',
} as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const softBlurEase = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (value: number) => number = easeOut,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export const glass = {
  background: 'rgba(255,255,255,0.82)',
  border: `1px solid ${COLORS.line}`,
  boxShadow:
    '0 32px 90px rgba(66, 35, 78, 0.14), 0 4px 18px rgba(46, 22, 54, 0.08)',
  backdropFilter: 'blur(22px)',
} as const;
