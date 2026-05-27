import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS, LAYOUT } from '../constants';
import { BrowserHeader } from './BrowserHeader';

type BrowserWindowProps = {
  /** Scale applied around (focusX, focusY). Defaults to 1 (no zoom). */
  zoom?: number;
  /** Focus X in 0..1 of the window's own width (0.5 = center). */
  focusX?: number;
  /** Focus Y in 0..1 of the window's own height (0.5 = center). */
  focusY?: number;
  /** URL displayed in the address bar. */
  url?: string;
  /** Body content rendered below the header. */
  children?: React.ReactNode;
  /**
   * Optional inset between the window and the composition edges. Defaults
   * to the Screen-Studio-style padding from LAYOUT. Set all to 0 to make
   * the window fill the composition (used by the trimmed clean scene).
   */
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  /**
   * Whether to render the Safari-style header (nav controls + address
   * bar) on top of the body. Defaults to true. Set to false for trimmed
   * scenes that just want the body content with no chrome.
   */
  showHeader?: boolean;
};

/**
 * Safari-style window that floats over the background with Screen-Studio-style
 * inset padding. Renders a header on top and a slot for the body content.
 *
 * The wrapper exposes `zoom` / `focusX` / `focusY` so future scenes can animate
 * camera-style zoom-ins on regions of the body without each body component
 * needing to know about it.
 */
export const BrowserWindow: React.FC<BrowserWindowProps> = ({
  zoom = 1,
  focusX = 0.5,
  focusY = 0.5,
  url,
  children,
  paddingX = LAYOUT.windowPaddingX,
  paddingTop = LAYOUT.windowPaddingTop,
  paddingBottom = LAYOUT.windowPaddingBottom,
  showHeader = true,
}) => {
  return (
    <AbsoluteFill
      style={{
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop,
        paddingBottom,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.white,
            borderRadius: LAYOUT.windowRadius,
            boxShadow: [
              '0 1px 0 rgba(255,255,255,0.6) inset',
              '0 30px 60px -15px rgba(60,40,80,0.25)',
              '0 12px 30px -10px rgba(60,40,80,0.18)',
            ].join(', '),
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {showHeader ? <BrowserHeader url={url} /> : null}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
