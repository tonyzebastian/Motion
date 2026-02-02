import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, TIMING, LAYOUT, STATUS_MESSAGES } from '../constants';

// ============================================
// Jumping Dots Component (Active State)
// ============================================

const JumpingDots: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {[0, 1, 2].map((i) => {
        // Each dot jumps with a phase offset (slower, smoother animation)
        const offset = i * 10; // Stagger by 10 frames
        const bounce = Math.sin(((frame + offset) / 18) * Math.PI) * 3;
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: COLORS.purple,
              transform: `translateY(${-Math.abs(bounce)}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================
// Check Icon Component (Complete State - from Figma)
// ============================================

const CheckIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <rect
      width="24"
      height="24"
      rx="12"
      fill={COLORS.purple}
      fillOpacity="0.1"
    />
    <path
      d="M7 13.5L9.5 16L16.5 9"
      stroke={COLORS.purple}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// Status Step Component
// ============================================

interface StatusStepProps {
  activeLabel: string;
  completeLabel: string;
  status: 'loading' | 'complete';
  opacity: number;
}

const StatusStep: React.FC<StatusStepProps> = ({
  activeLabel,
  completeLabel,
  status,
  opacity,
}) => {
  if (opacity <= 0) return null;

  const label = status === 'loading' ? activeLabel : completeLabel;
  const textOpacity = status === 'loading' ? 1 : 0.5;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity,
      }}
    >
      {status === 'loading' ? <JumpingDots /> : <CheckIcon />}
      <span
        style={{
          fontSize: 16,
          fontFamily: "'Work Sans', system-ui, sans-serif",
          fontWeight: 400,
          color: COLORS.text,
          letterSpacing: -0.5,
          opacity: textOpacity,
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ============================================
// Main StatusIndicator Component
// ============================================

export const StatusIndicator: React.FC = () => {
  const frame = useCurrentFrame();

  // Hide before indicators should appear
  if (frame < TIMING.indicatorStart) {
    return null;
  }

  // Hide after they fade out
  if (frame >= TIMING.indicatorFadeEnd) {
    return null;
  }

  // Step 1: appears at indicatorStart, becomes complete at indicator1CompleteAt
  const step1FadeIn = interpolate(
    frame,
    [TIMING.indicatorStart, TIMING.indicatorStart + 8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const step1Status: 'loading' | 'complete' =
    frame >= TIMING.indicator1CompleteAt ? 'complete' : 'loading';

  // Step 2: appears at indicator2Start, becomes complete at indicator2CompleteAt
  const showStep2 = frame >= TIMING.indicator2Start;
  
  const step2FadeIn = showStep2
    ? interpolate(
        frame,
        [TIMING.indicator2Start, TIMING.indicator2Start + 8],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  const step2Status: 'loading' | 'complete' =
    frame >= TIMING.indicator2CompleteAt ? 'complete' : 'loading';

  // Container fade out as SQL card enters
  const containerFadeOut = interpolate(
    frame,
    [TIMING.sqlEntranceStart, TIMING.indicatorFadeEnd],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.chatBubbleLeft,
        top: LAYOUT.statusIndicatorTop,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        opacity: containerFadeOut,
      }}
    >
      <StatusStep
        activeLabel={STATUS_MESSAGES.step1Active}
        completeLabel={STATUS_MESSAGES.step1Complete}
        status={step1Status}
        opacity={step1FadeIn}
      />
      {showStep2 && (
        <StatusStep
          activeLabel={STATUS_MESSAGES.step2Active}
          completeLabel={STATUS_MESSAGES.step2Complete}
          status={step2Status}
          opacity={step2FadeIn}
        />
      )}
    </div>
  );
};

export default StatusIndicator;
