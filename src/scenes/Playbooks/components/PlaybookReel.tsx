import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, LAYOUT, PLAYBOOKS, TIMING } from '../constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";
const SHIMMER_PERIOD = 75;

/**
 * Vertical position of the long strip (relative to the viewport top) that
 * places row index `k` in the focus slot. The focus slot is the TOP row of
 * the viewport (rows k+1, k+2 peek below as "upcoming"), so the focused
 * playbook sits flush with the bottom of the "Searching..." label with no
 * empty space above it.
 */
const centerScrollY = (k: number): number => -k * LAYOUT.reelRowPitch;

/**
 * Build the scrollY keyframes for the entire cycle. Each playbook holds in
 * the focus slot for `reelHoldFrames`, then the strip linearly scrolls to
 * the next one over `reelPlaybookInterval - reelHoldFrames` frames. After
 * the match centers, the strip is parked there (no further motion).
 */
const buildKeyframes = (): { frames: number[]; scrollYs: number[] } => {
  const frames: number[] = [];
  const scrollYs: number[] = [];
  for (let k = 0; k < PLAYBOOKS.length; k++) {
    const enter =
      TIMING.reelCycleStart + k * TIMING.reelPlaybookInterval;
    const y = centerScrollY(k);
    frames.push(enter);
    scrollYs.push(y);
    if (k < PLAYBOOKS.length - 1) {
      // Hold in the focus slot before scrolling on.
      frames.push(enter + TIMING.reelHoldFrames);
      scrollYs.push(y);
    }
  }
  return { frames, scrollYs };
};

const KEYFRAMES = buildKeyframes();

/**
 * Returns the index of the playbook currently centered in the focus slot,
 * or -1 if we're mid-scroll between two playbooks.
 */
const getFocusedIndex = (frame: number): number => {
  for (let k = PLAYBOOKS.length - 1; k >= 0; k--) {
    const enter =
      TIMING.reelCycleStart + k * TIMING.reelPlaybookInterval;
    if (frame >= enter) {
      // The match parks in the focus slot indefinitely.
      const holdEnd =
        k === PLAYBOOKS.length - 1
          ? Infinity
          : enter + TIMING.reelHoldFrames;
      return frame <= holdEnd ? k : -1;
    }
  }
  return -1;
};

type PlaybookReelProps = {
  /** 0..1 progress of the reel opening (height + opacity). */
  openProgress: number;
  /** 0..1 progress of the reel collapsing once the match is locked in. */
  collapseProgress: number;
};

/**
 * Slot-machine-style reel of playbook names. The focus slot sits at the
 * TOP of the viewport (with upcoming rows peeking below); rows scroll
 * upward, pausing on each name. The row currently in the spotlight is
 * rendered in near-black with a horizontal gradient shimmer sweeping
 * across it; rows in the peek slots are dimmed grey, no shimmer. The
 * matched (last) name parks in the focus slot like any other, then the
 * reel collapses and a chip takes its place above -- the ✓ confirmation
 * lives on the chip, never inside the reel.
 */
export const PlaybookReel: React.FC<PlaybookReelProps> = ({
  openProgress,
  collapseProgress,
}) => {
  const frame = useCurrentFrame();

  const open = Math.max(0, Math.min(1, openProgress));
  const collapse = Math.max(0, Math.min(1, collapseProgress));

  const viewportHeight = LAYOUT.reelViewportHeight * open * (1 - collapse);
  const viewportOpacity = open * (1 - collapse);

  const scrollY = interpolate(frame, KEYFRAMES.frames, KEYFRAMES.scrollYs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const focusedIdx = getFocusedIndex(frame);

  // Shimmer sweep for the focused (spotlight) row's text. Pure cycle off
  // useCurrentFrame so it stays in sync across renders.
  const shimmerT = (frame % SHIMMER_PERIOD) / SHIMMER_PERIOD;
  const shimmerPos = interpolate(shimmerT, [0, 1], [-50, 150]);

  return (
    <div
      style={{
        width: LAYOUT.bubbleWidth - 16 - 12, // align with response column padding
        maxHeight: viewportHeight,
        height: viewportHeight,
        position: 'relative',
        overflow: 'hidden',
        opacity: viewportOpacity,
        // Focus row is at the TOP, so only fade out at the bottom where
        // upcoming rows wait to scroll up into the slot.
        WebkitMaskImage:
          'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${scrollY}px)`,
        }}
      >
        {PLAYBOOKS.map((name, k) => {
          const isFocused = k === focusedIdx;

          return (
            <div
              key={k}
              style={{
                height: LAYOUT.reelRowPitch,
                display: 'flex',
                alignItems: 'center',
                // 18 = 10 (dot slot width above in the label) + 8 (gap),
                // so the playbook text lines up with the "Searching..."
                // label text.
                paddingLeft: 18,
                paddingRight: 4,
                opacity: isFocused ? 1 : 0.35,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_FAMILY,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: '20px',
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  ...(isFocused
                    ? {
                        color: 'transparent',
                        // Near-black shimmer for the spotlight row. The
                        // gradient stop position sweeps across each period
                        // so the highlight crosses the full word width.
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) ${
                          shimmerPos - 20
                        }%, rgba(0, 0, 0, 0.3) ${shimmerPos}%, rgba(0, 0, 0, 1) ${
                          shimmerPos + 20
                        }%, rgba(0, 0, 0, 1) 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }
                    : { color: COLORS.iconStroke }),
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
