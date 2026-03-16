import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Card } from './components/Card';
import { Legend } from './components/Legend';
import { MilestoneAxis } from './components/MilestoneAxis';
import { ProgressBars, computeSundialPct } from './components/ProgressBars';

export const ForwardDeploymentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sundialPct = computeSundialPct(frame);

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(117.9deg, #fff2f2 2.6%, #fef2eb 86.3%)',
        fontFamily: "'Work Sans', system-ui, sans-serif",
      }}
    >

      <Card>
        <Legend />
        <MilestoneAxis sundialPct={sundialPct} />
        <ProgressBars />
      </Card>
    </AbsoluteFill>
  );
};

export default ForwardDeploymentScene;
