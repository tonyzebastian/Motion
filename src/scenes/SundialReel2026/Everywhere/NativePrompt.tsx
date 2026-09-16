import React from 'react';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';

loadFunnelSans('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

// "What's on the agenda today?" sits 32px above the chatbox in the Figma
// reference. Layout for this is handled by the parent beat, which stacks the
// prompt above the Chatbox in a flex column with a 32px gap.
export const NativePrompt: React.FC = () => {
  return (
    <div
      style={{
        fontFamily: FUNNEL_STACK,
        fontWeight: 400,
        fontSize: 24,
        lineHeight: 1.25,
        color: '#000000',
        textAlign: 'center',
        letterSpacing: '-0.2px',
      }}
    >
      What&rsquo;s on the agenda today?
    </div>
  );
};
