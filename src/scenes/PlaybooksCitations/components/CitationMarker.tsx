import React from 'react';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// Book-style footnote marker color. Muted magenta pulled from the brand
// purple so the markers read as a deliberate annotation layer rather
// than part of the value text.
const MARKER_COLOR = '#C879F5';
const MARKER_COLOR_ACTIVE = '#A43DF5';

type CitationMarkerProps = {
  index: number;
  /** 0..1 fade-in controlled by the parent. */
  opacity?: number;
  /** When true the marker reads as the actively-hovered citation. */
  highlighted?: boolean;
};

/**
 * Inline `[N]` reference marker rendered immediately after a cited
 * value (no leading whitespace). Superscript-style, slightly smaller
 * than the surrounding text. When `highlighted`, it brightens and
 * scales up a touch so the hovered citation reads as active.
 */
export const CitationMarker: React.FC<CitationMarkerProps> = ({
  index,
  opacity = 1,
  highlighted = false,
}) => {
  return (
    <sup
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: highlighted ? '0.72em' : '0.66em',
        fontWeight: 600,
        lineHeight: 0,
        color: highlighted ? MARKER_COLOR_ACTIVE : MARKER_COLOR,
        letterSpacing: '-0.2px',
        marginLeft: 1,
        verticalAlign: 'super',
        opacity,
        whiteSpace: 'nowrap',
        transition: 'none',
      }}
    >
      [{index}]
    </sup>
  );
};
