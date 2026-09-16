import React from 'react';
import { staticFile } from 'remotion';
import {
  fontFamily as funnelSans,
  loadFont as loadFunnelSans,
} from '@remotion/google-fonts/FunnelSans';

loadFunnelSans('normal', {
  weights: ['500', '600'],
  subsets: ['latin'],
});

const FUNNEL_STACK = `"${funnelSans}", -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`;

// Brand logos are real transparent PNGs (kept in public/logos/) rather than
// hand-drawn SVG approximations. Each component renders a single <img> at the
// caller's chosen height; width auto-scales from the asset's aspect ratio.

type LogoProps = {
  // Rendered height in px. Width auto-scales from the image's aspect.
  height?: number;
};

const claudeSrc = staticFile('logos/claude.png');
// 300x65 transparent PNG — dark wordmark + orange star.
const CLAUDE_ASPECT = 300 / 65;

const chatgptSrc = staticFile('logos/chatgpt.png');
// 800x800 transparent PNG — WHITE ChatGPT mark on transparent background.
// We invert it via CSS so it reads as black on the light title bar; alpha
// is preserved through the invert filter, so transparency stays clean.
const CHATGPT_ASPECT = 1;

export const ClaudeLogo: React.FC<LogoProps> = ({ height = 32 }) => (
  <img
    src={claudeSrc}
    alt="Claude"
    style={{
      height,
      width: Math.round(height * CLAUDE_ASPECT),
      display: 'block',
    }}
  />
);

export const ChatGPTLogo: React.FC<LogoProps> = ({ height = 32 }) => {
  // The Claude asset already bakes in its "Claude" wordmark, so we add
  // a matching "ChatGPT" wordmark next to the flower mark to keep the
  // lockup symmetrical. Wordmark height tracks the icon for visual balance.
  const iconSize = Math.round(height * 0.9);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: Math.max(8, Math.round(height * 0.28)),
      }}
    >
      <img
        src={chatgptSrc}
        alt=""
        style={{
          height: iconSize,
          width: Math.round(iconSize * CHATGPT_ASPECT),
          display: 'block',
          // The source PNG is white-on-transparent (designed for dark UIs).
          // Inverting flips the white shape to black so it reads on the
          // light title bar; alpha is preserved through the invert filter.
          filter: 'invert(1)',
        }}
      />
      <span
        style={{
          fontFamily: FUNNEL_STACK,
          fontWeight: 600,
          // The Claude wordmark is a serifed display face. Funnel Sans at
          // 600 reads as a confident sans counterpart without trying to
          // imitate OpenAI's proprietary type.
          fontSize: Math.round(height * 0.78),
          lineHeight: 1,
          color: '#000',
          letterSpacing: '-0.01em',
        }}
      >
        ChatGPT
      </span>
    </div>
  );
};
