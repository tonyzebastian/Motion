import React from 'react';
import { COLORS } from '../constants';
import { PulsingDot } from './PulsingDot';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type PlaybookChipProps = {
  /** Name of the matched playbook (without any "Loaded ..." prefix). */
  name: string;
  /**
   * 0..1 progress of the match-out animation. At progress 0 the chip
   * reads as the matched playbook in the reel ("Long term metric
   * change"); at progress 1 it has morphed into the loaded confirmation
   * ("Loaded Long term metric change playbook"). The text swap happens
   * around the midpoint of this window with a brief opacity dip masking
   * the content change so the element reads as one thing transforming.
   */
  morphProgress?: number;
  style?: React.CSSProperties;
};

const SWAP_THRESHOLD = 0.5;
const DIP_START = 0.4;
const DIP_END = 0.6;

/**
 * The matched playbook lifted out of the reel. Renders one text span
 * whose content morphs from the bare playbook name to "Loaded {name}
 * playbook" with a quick opacity dip across the swap. Combined with the
 * upward translation applied by the parent (chip rises from the reel's
 * focus slot to the search label's slot), this reads as the same text
 * element transforming -- not a separate element fading in.
 */
export const PlaybookChip: React.FC<PlaybookChipProps> = ({
  name,
  morphProgress = 1,
  style,
}) => {
  const t = Math.max(0, Math.min(1, morphProgress));
  const text = t < SWAP_THRESHOLD ? name : `Loaded ${name} playbook`;

  // Opacity sequence: full (1) outside the dip window, smooth dip during
  // the swap. Half-sinewave keeps the dip soft instead of feeling like a
  // hard blink.
  let opacity = 1;
  if (t > DIP_START && t < DIP_END) {
    const dipT = (t - DIP_START) / (DIP_END - DIP_START);
    opacity = 1 - Math.sin(dipT * Math.PI) * 0.65;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: FONT_FAMILY,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: '20px',
        letterSpacing: '-0.3px',
        color: COLORS.iconStroke,
        whiteSpace: 'nowrap',
        opacity,
        ...style,
      }}
    >
      {/* Static green status dot, matching every other single-item tool
          call row. No pulse here -- the chip is the settled, post-match
          state. */}
      <PulsingDot variant="green" animated={false} />
      <span>{text}</span>
    </span>
  );
};
