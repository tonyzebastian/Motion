import { AbsoluteFill } from 'remotion';
import { COLORS } from './constants';
import { ChatBubble } from './components/ChatBubble';
import { StatusIndicator } from './components/StatusIndicator';
import { InsightHeading } from './components/InsightHeading';
import { ChartCard } from './components/ChartCard';

// ============================================
// Chat to DAU Analysis Scene
// ============================================
// Animation flow:
// 1. Chat bubble appears centered with question about DAU
// 2. Bubble moves up to top position
// 3. Status indicators appear with loading/complete states
// 4. Status indicators fade out
// 5. Insight heading appears with highlighted text
// 6. Chart card slides up with waterfall visualization

export const ChatToDAUScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: "'Work Sans', system-ui, sans-serif",
      }}
    >
      {/* Chat bubble (appears centered, moves up) */}
      <ChatBubble />

      {/* Status indicators (appear after bubble moves up) */}
      <StatusIndicator />

      {/* Insight heading (appears after indicators fade) */}
      <InsightHeading />

      {/* Chart card with waterfall visualization */}
      <ChartCard />
    </AbsoluteFill>
  );
};

export default ChatToDAUScene;
