import { AbsoluteFill } from 'remotion';
import { COLORS } from './constants';
import { ChatBox } from './components/ChatBox';
import { StatusIndicator } from './components/StatusIndicator';
import { SQLCard } from './components/SQLCard';

// ============================================
// Chat to SQL Voice Mode Scene
// ============================================
// Animation flow:
// 1. Centered chat input with blinking cursor
// 2. Typing animation: "How many power users care about voice mode?"
// 3. Chat input morphs to left bubble (hugging content)
// 4. Status indicators appear with jumping dots animation
// 5. Status indicators complete with checkmarks
// 6. SQL card slides up (status indicators fade out)
// 7. SQL code streams with syntax highlighting
// 8. SQL section collapses
// 9. Snapshot message appears
// 10. Table preview appears

export const ChatToSQLVoiceModeScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: "'Work Sans', system-ui, sans-serif",
      }}
    >
      {/* ChatBox: unified component that morphs from input to bubble */}
      <ChatBox />

      {/* Status indicators (appear after bubble transition) */}
      <StatusIndicator />

      {/* SQL Card (slides up, contains SQL, Snapshot, and Table) */}
      <SQLCard />
    </AbsoluteFill>
  );
};

export default ChatToSQLVoiceModeScene;
