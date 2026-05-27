import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';

loadFunnelSans('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;
const PLUM = '#531D59';

const CAPTION_TEXT = 'Ask in Slack, on web, anywhere. Sundial answers and remembers.';

// Caption sits at canvas y ≈ 890 (Figma reference). Centered horizontally.
const CAPTION_TOP = 868;

export const Caption: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: CAPTION_TOP,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 400,
          fontSize: 36,
          lineHeight: 1.2,
          color: PLUM,
          textAlign: 'center',
          maxWidth: 920,
          letterSpacing: '-0.2px',
        }}
      >
        {CAPTION_TEXT}
      </div>
    </AbsoluteFill>
  );
};
