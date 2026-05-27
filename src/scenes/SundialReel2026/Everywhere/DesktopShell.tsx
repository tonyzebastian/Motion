import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ChatGPTLogo, ClaudeLogo } from './AppLogos';

// ---------------------------------------------------------------------------
// Phone frame — geometry kept identical to SlackShell so the Slack → Claude
// seam morph is a re-skin (logos swap in, conversation thread fades out)
// rather than a frame resize. The chatbox is the only filled element; the
// phone outline + logo header read as scaffolding around it.
// ---------------------------------------------------------------------------

const PHONE_WIDTH = 960;
// Matches SlackShell's frame exactly so the Slack → Claude seam is a pure
// re-skin (only the content inside the outline changes).
const PHONE_HEIGHT = 700;
const PHONE_TOP = -40;
const PHONE_LEFT = (1920 - PHONE_WIDTH) / 2;
const PHONE_RADIUS = 40;

// Where the logo header sits inside the visible portion of the phone. Set
// so the logos land at roughly canvas y=200 — well clear of the canvas
// top edge so they read as a confident header rather than something
// pinned to the corner, and with plenty of space below before the chatbox
// at canvas y=540.
const HEADER_TOP_IN_PHONE = 240; // canvas y = PHONE_TOP + 240 = 200

const WIREFRAME_LINE = 'rgba(0, 0, 0, 0.28)';
const DIVIDER = 'rgba(0, 0, 0, 0.18)';

export const DesktopShell: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Wireframe phone outline — same dimensions as SlackShell. No fill,
          no shadow, no inner chrome other than the logo header. */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT,
          top: PHONE_TOP,
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          backgroundColor: 'transparent',
          borderRadius: PHONE_RADIUS,
          border: `1.5px solid ${WIREFRAME_LINE}`,
          overflow: 'hidden',
        }}
      >
        {/* Logo header — Claude + thin divider + ChatGPT, horizontally
            centered. Replaces the title bar / sidebar from the previous
            desktop shell so this beat reads as a "mobile chat app" with
            both host brands as the chrome. */}
        <div
          style={{
            position: 'absolute',
            top: HEADER_TOP_IN_PHONE,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          <ClaudeLogo height={56} />
          <div
            style={{
              width: 1.5,
              height: 40,
              backgroundColor: DIVIDER,
            }}
          />
          <ChatGPTLogo height={56} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
