import React from 'react';
import { ShieldCheck } from 'lucide-react';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

// Tag palette per Figma node 611:886. `#15B600` is the saturated
// green used both as the 10%-alpha interior wash and as the icon /
// label / border color (rendered fully opaque at #128902 in the
// Figma source -- effectively the same hue at higher contrast).
const TAG_BORDER = '#128902';
const TAG_BACKGROUND = 'rgba(21, 182, 0, 0.1)';
const TAG_FOREGROUND = '#128902';

type ConfidenceTagProps = {
  /** 0..1 fade-in opacity controlled by the parent scene's tag window. */
  opacity?: number;
  style?: React.CSSProperties;
};

/**
 * Inline trust-signal pill rendered between the streamed dashboard
 * paragraph and the FeedbackFooter. Mirrors Figma node 611:886: a
 * soft saturated-green wash with a darker-green border, ShieldCheck
 * icon, and a "High confidence" label.
 *
 * The pill itself is non-interactive in the scene; the cursor's
 * scripted move + the sibling `ConfidencePopover` provide the hover
 * effect.
 */
export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({
  opacity = 1,
  style,
}) => {
  return (
    <div
      style={{
        // Inline-flex so the pill only takes the width of its content
        // (icon + label + padding) regardless of the parent column
        // width. `alignSelf: flex-start` keeps it left-aligned.
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 28,
        border: `1px solid ${TAG_BORDER}`,
        background: TAG_BACKGROUND,
        opacity,
        ...style,
      }}
    >
      <ShieldCheck size={14} strokeWidth={2} color={TAG_FOREGROUND} />
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 600,
          fontSize: 12,
          lineHeight: '16px',
          letterSpacing: '-0.1px',
          color: TAG_FOREGROUND,
          whiteSpace: 'nowrap',
        }}
      >
        High confidence
      </span>
    </div>
  );
};
