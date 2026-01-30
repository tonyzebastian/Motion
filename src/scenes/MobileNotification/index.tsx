import { AbsoluteFill } from 'remotion';
import { COLORS } from './constants';
import { MobileScreen } from './components/MobileScreen';
import { NotificationCard } from './components/NotificationCard';

// ============================================
// Mobile Notification Scene
// ============================================
// Animation flow:
// 1. Mobile screen fades in with time and date
// 2. Notification slides down from top (collapsed state)
// 3. Notification expands to reveal message and chart
// 4. Time series line chart animates, showing declining DAU trend

export const MobileNotificationScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: "'Roboto', system-ui, sans-serif",
      }}
    >
      {/* Mobile phone frame with time/date */}
      <MobileScreen />

      {/* Animated notification card */}
      <NotificationCard />
    </AbsoluteFill>
  );
};

export default MobileNotificationScene;
