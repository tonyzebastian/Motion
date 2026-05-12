import React from 'react';
import {
  AlignJustify,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Plus,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { COLORS, LAYOUT } from '../constants';

type BrowserHeaderProps = {
  url?: string;
};

export const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  url = 'app.sundial.ai',
}) => {
  const stroke = COLORS.iconStroke;

  return (
    <div
      style={{
        height: LAYOUT.headerHeight,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: LAYOUT.windowRadius,
        borderTopRightRadius: LAYOUT.windowRadius,
        borderBottom: `1px solid ${COLORS.headerBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        gap: 16,
      }}
    >
      {/* Left: nav controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          flexShrink: 0,
        }}
      >
        <PanelLeft size={18} strokeWidth={1.6} color={stroke} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <ChevronLeft size={18} strokeWidth={1.8} color={stroke} />
          <ChevronRight size={18} strokeWidth={1.8} color={stroke} />
        </div>
      </div>

      {/* Center: address bar */}
      <div
        style={{
          flex: 1,
          maxWidth: 620,
          height: LAYOUT.addressBarHeight,
          backgroundColor: COLORS.chrome,
          borderRadius: LAYOUT.addressBarRadius,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 10,
          paddingRight: 10,
          position: 'relative',
        }}
      >
        {/* Left: website settings / reader-style glyph */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlignJustify size={14} strokeWidth={1.6} color={stroke} />
        </div>

        {/* Center: url */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: COLORS.addressText,
              letterSpacing: '-0.1px',
              lineHeight: 1,
            }}
          >
            {url}
          </span>
        </div>

        {/* Right: refresh */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RotateCcw size={13} strokeWidth={1.6} color={stroke} />
        </div>
      </div>

      {/* Right: action icons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexShrink: 0,
        }}
      >
        <Plus size={18} strokeWidth={1.6} color={stroke} />
        <Upload size={17} strokeWidth={1.6} color={stroke} />
      </div>
    </div>
  );
};
