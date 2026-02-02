import { AbsoluteFill } from 'remotion';
import { COLORS, CONTENT } from './constants';
import { MobileScreen } from './components/MobileScreen';
import { NotificationCard } from './components/NotificationCard';

// ============================================
// Mobile Notification Compact Scene
// ============================================
// Animation flow:
// 1. Mobile screen shows time and date (always visible)
// 2. Three notifications slide in sequentially, stacking on top of each other
// 3. Each notification has a different message

export const MobileNotificationCompactScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: "'Roboto', system-ui, sans-serif",
      }}
    >
      {/* Mobile phone frame with time/date */}
      <MobileScreen />

      {/* Three stacked notification cards */}
      {CONTENT.notifications.map((message, index) => (
        <NotificationCard key={index} index={index} message={message} />
      ))}
    </AbsoluteFill>
  );
};

export default MobileNotificationCompactScene;
