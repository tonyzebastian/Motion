import { AbsoluteFill } from 'remotion';
import { SundialNode } from './components/SundialNode';
import { SourceNodes } from './components/SourceNodes';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { COLORS } from './constants';

export const RichContextScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <KnowledgeGraph />
      <SourceNodes />
      <SundialNode />
    </AbsoluteFill>
  );
};

export default RichContextScene;
