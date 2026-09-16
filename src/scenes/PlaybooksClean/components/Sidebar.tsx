import React from 'react';
import {
  Book,
  BookOpen,
  Hexagon,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shapes,
} from 'lucide-react';
import { staticFile } from 'remotion';

// ============================================
// Collapsed product sidebar
// ============================================
// Mirrors the Sundial product-shell left rail in its collapsed state
// (Figma: Context-Engine / Sidebar / node 319:4560). Width, rhythm and
// the translucent lavender wash are matched 1:1 with the Figma frame
// so the rail reads as real product chrome.

export const SIDEBAR_WIDTH = 48;

// Warm cream base that integrates with the body's warm peach
// gradient. The Figma reference uses rgba(0,0,0,0.02) over a near-
// white canvas, but in our scene the body bg is a warm
// peach->lavender gradient, so an opaque neutral gray reads as a
// disconnected panel. This warm off-white sits naturally next to the
// chat content.
const SIDEBAR_BG = '#f4ece1';
const ICON_COLOR = 'rgba(0, 0, 0, 0.62)';
const ICON_COLOR_ACTIVE = 'rgba(0, 0, 0, 0.85)';
const DIVIDER_COLOR = 'rgba(0, 0, 0, 0.08)';

const ICON_SIZE = 14;
const ICON_STROKE_WIDTH = 1.5;

type IconButtonProps = {
  children: React.ReactNode;
  active?: boolean;
};

const IconButton: React.FC<IconButtonProps> = ({ children, active = false }) => {
  if (active) {
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow:
            '0 1px 1.5px rgba(60, 40, 80, 0.06), inset 0 0 0 0.5px rgba(0, 0, 0, 0.03)',
          color: ICON_COLOR_ACTIVE,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ICON_COLOR,
      }}
    >
      {children}
    </div>
  );
};

const Divider: React.FC = () => (
  <div
    style={{
      height: 1,
      width: 36,
      background: DIVIDER_COLOR,
    }}
  />
);

const SundialLogo: React.FC = () => (
  <div
    style={{
      width: 32,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <img
      src={staticFile('sundial_logo.png')}
      alt="Sundial"
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        objectFit: 'cover',
        boxShadow: '0 1px 2px rgba(60, 40, 80, 0.18)',
      }}
    />
  </div>
);

const Avatar: React.FC = () => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      boxSizing: 'border-box',
    }}
  >
    <img
      src={staticFile('avatar.png')}
      alt=""
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        objectFit: 'cover',
        boxShadow:
          '0 0 0 1.5px #ffffff, 0 0 0 2.5px rgba(0, 0, 0, 0.12)',
      }}
    />
  </div>
);

export const Sidebar: React.FC = () => {
  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        flexShrink: 0,
        flexGrow: 0,
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingBottom: 16,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      {/* Lavender wash bleeding in from the top-left (Figma: Ellipse 46
          at (-72, -60), 286x286). Sits behind the icon stack so the
          rail reads as translucent product chrome instead of a flat
          gray panel. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -72,
          top: -60,
          width: 286,
          height: 286,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(245, 220, 200, 0.8) 0%, rgba(245, 220, 200, 0.35) 45%, rgba(245, 220, 200, 0) 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top stack: logo + nav icons. zIndex keeps it above the blob. */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <SundialLogo />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <IconButton active>
              <Plus size={12} strokeWidth={2} />
            </IconButton>
            <IconButton>
              <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
            <IconButton>
              <Hexagon size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
            <IconButton>
              <MessageSquare size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
          </div>

          <Divider />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <IconButton>
              <Shapes size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
            <IconButton>
              <Search size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
            <IconButton>
              <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
            <IconButton>
              <Book size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Bottom stack: avatar only */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar />
      </div>
    </div>
  );
};
