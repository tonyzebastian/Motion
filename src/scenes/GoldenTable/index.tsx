import { AbsoluteFill } from 'remotion';
import { COLORS } from './constants';
import { TableView } from './components/TableView';
import { Cursor } from './components/Cursor';
import { ConnectionLines } from './components/ConnectionLines';
import { StackedImages } from './components/StackedImages';

export const GoldenTableScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.backgroundFrom} 0%, ${COLORS.backgroundTo} 100%)`,
        fontFamily: "'Work Sans', system-ui, sans-serif",
      }}
    >
      {/* Act 1–3: Table card that morphs into compact golden card */}
      <TableView />

      {/* Act 2: Animated cursor */}
      <Cursor />

      {/* Act 3: Stacked analysis images */}
      <StackedImages />

      {/* Act 3: Connection lines to highlighted images */}
      <ConnectionLines />

      {/* Diagonal white fade from bottom-right corner toward center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(315deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};

export default GoldenTableScene;
