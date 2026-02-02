import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { COLORS, TIMING, LAYOUT, CONTENT } from '../constants';

// ============================================
// NotificationCard Component
// ============================================
// Animated notification that slides in from bottom
// Stacks with other notifications using index-based positioning

interface NotificationCardProps {
  index: number; // 0, 1, or 2 for stacking position
  message: string;
}

// Sundial logo SVG (larger version - 24x24)
const SundialLogo: React.FC = () => (
  <svg width={LAYOUT.logoSize} height={LAYOUT.logoSize} viewBox="0 0 16 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.5757 4.85974C8.56842 4.85931 8.55916 4.85897 8.54831 4.8587C8.45125 4.85623 8.22656 4.85909 8.14968 4.85714C8.22144 4.85891 8.44535 4.85591 8.54831 4.8587C8.55879 4.85898 8.56801 4.85932 8.5757 4.85974Z"
      fill="#665beb"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.284668 9.42209C0.284668 6.34537 3.74585 3.83541 7.99817 3.83541C8.38347 3.83541 8.76224 3.85593 9.13249 3.89554C9.59698 3.05418 10.0138 2.18218 10.3789 1.28373C10.5015 0.981843 11.0009 1.06787 11.0009 1.39375V4.27519C13.7725 5.12507 15.7184 7.11412 15.7117 9.42209C15.7117 12.4988 12.2505 14.9998 7.99817 14.9998C3.74585 14.9998 0.284668 12.4988 0.284668 9.42209ZM1.28257 9.42209C1.28257 6.89414 4.43789 4.8569 8.14181 4.8569C8.08125 4.85572 8.20978 4.8573 8.14968 4.85714C8.14742 4.85714 8.14481 4.8569 8.14181 4.8569C8.09688 4.85531 8.17794 4.85764 8.14968 4.85714C8.14742 4.85714 8.14481 4.8569 8.14181 4.8569C8.14423 4.85699 8.14685 4.85707 8.14968 4.85714C8.22144 4.85891 8.44535 4.85591 8.54831 4.8587C8.55879 4.85898 8.56801 4.85932 8.5757 4.85974C7.60608 6.43067 6.46108 7.87636 5.16725 9.17094C4.2338 10.1049 3.07907 10.7754 1.85784 11.2776C1.48811 10.7104 1.28257 10.0825 1.28257 9.42209ZM14.7138 9.42209C14.7138 11.95 11.7021 14.0012 7.99817 14.0012C5.74692 14.0012 3.75141 13.2434 2.53241 12.0815L10.2941 8.87703C10.7218 8.70057 11.0009 8.28338 11.0009 7.82047V5.32602C13.2009 6.07816 14.7138 7.63036 14.7138 9.42209Z"
      fill="#665beb"
    />
  </svg>
);

export const NotificationCard: React.FC<NotificationCardProps> = ({ index, message }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate slide start time based on index (staggered)
  const slideStartTimes = [
    TIMING.notification1SlideStart,
    TIMING.notification2SlideStart,
    TIMING.notification3SlideStart,
  ];
  const slideStart = slideStartTimes[index];

  // Slide in animation from bottom
  const slideProgress = frame >= slideStart
    ? spring({
        frame: frame - slideStart,
        fps,
        config: { damping: 200, stiffness: 100 },
      })
    : 0;

  // Calculate top position based on index with overlap
  // First notification at base position, subsequent ones stack below with overlap
  const baseTop = LAYOUT.notificationTop;
  const stackOffset = (LAYOUT.cardHeight - LAYOUT.stackOverlap) * index;
  const topPosition = baseTop + stackOffset;

  // Calculate positions - slide from bottom (positive to 0)
  const slideY = interpolate(slideProgress, [0, 1], [200, 0]);

  // Don't render until slide starts
  if (frame < slideStart) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.notificationLeft,
        top: topPosition,
        width: LAYOUT.notificationWidth,
        transform: `translateY(${slideY}px)`,
        opacity: slideProgress,
        zIndex: 10 + index, // Newer notifications on top
      }}
    >
      {/* Main card container */}
      <div
        style={{
          backgroundColor: COLORS.cardBg,
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          borderRadius: LAYOUT.notificationBorderRadius,
          overflow: 'hidden',
          height: LAYOUT.cardHeight,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Logo */}
          <SundialLogo />
          
          {/* App name */}
          <span
            style={{
              fontFamily: "'Roboto', system-ui, sans-serif",
              fontSize: LAYOUT.appNameFontSize,
              fontWeight: 500,
              color: COLORS.appName,
            }}
          >
            {CONTENT.appName}
          </span>
          
          {/* Timestamp */}
          <span
            style={{
              fontFamily: "'Roboto', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: COLORS.timestamp,
            }}
          >
            {CONTENT.timestamp}
          </span>
        </div>

        {/* Message text */}
        <div
          style={{
            padding: '0 16px 20px 16px',
          }}
        >
          <div
            style={{
              fontFamily: "'Roboto', system-ui, sans-serif",
              fontSize: LAYOUT.messageFontSize,
              fontWeight: 400,
              color: COLORS.messageText,
              lineHeight: '24px',
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
