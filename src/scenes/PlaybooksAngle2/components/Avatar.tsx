import React from 'react';
import { AvatarSpec } from '../data';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type AvatarProps = {
  /** Author display name -- used to derive the initial when `spec.kind` is `'initial'`. */
  name: string;
  spec: AvatarSpec;
  /** Diameter in px. Defaults to 22 (matches the row design). */
  size?: number;
};

/**
 * Tiny circular author avatar. Three variants:
 *
 *   - `initial`: solid-colored circle with the first letter of the
 *     author's name in white. Used for human authors whose photo we
 *     don't have on hand.
 *   - `sundial`: dark teal circle with the brand glyph used for any
 *     artifact authored by the Sundial system itself.
 *   - `photo`: neutral grey circle with no glyph. Stands in for "this
 *     person has a real profile photo elsewhere" and mirrors how a
 *     dimmed photo reads on the source screenshot at small size.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, spec, size = 22 }) => {
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  if (spec.kind === 'sundial') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#264B47',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SundialGlyph size={Math.round(size * 0.62)} />
      </div>
    );
  }

  if (spec.kind === 'photo') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          // Soft neutral disc -- gestures at "profile photo" without
          // requiring a real image asset.
          background:
            'radial-gradient(circle at 35% 30%, #C9C9C9 0%, #9C9C9C 65%, #7E7E7E 100%)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: spec.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        // Quiet grey character on a soft colored disc instead of a
        // bold white initial -- the avatar reads as an identifier, not
        // a badge.
        color: 'rgba(0, 0, 0, 0.55)',
        fontFamily: FONT_FAMILY,
        fontWeight: 400,
        fontSize: Math.round(size * 0.5),
        letterSpacing: '-0.2px',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
};

/**
 * Compact stand-in for the Sundial brand mark at avatar scale. A pale
 * crescent + gnomon dot inside the dark teal disc -- enough to read as
 * "the Sundial logo" at 14-22px without needing the full asset.
 */
const SundialGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.5 17.5 C 5.5 9, 13 4.5, 20.5 6.5"
      stroke="#E6F0EE"
      strokeWidth={2.2}
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="9.5" cy="13.5" r="2.1" fill="#E6F0EE" />
  </svg>
);
