import React from 'react';
import {Audio} from '@remotion/media';
import {LightLeak} from '@remotion/light-leaks';
import {vignette} from '@remotion/effects/vignette';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {crossZoom} from '@remotion/transitions/cross-zoom';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {AbsoluteFill, Easing, Sequence, staticFile} from 'remotion';
import {MeshBackground} from '../SundialReel2026/MeshBackground';
import {
  BrandScene,
  EverywhereScene,
  HookScene,
  OutroScene,
  ProductDemoScene,
  ProofScene,
  TrustScene,
} from './scenes';

export const SUNDIAL_LAUNCH_30_DURATION = 1800;

const TRANSITION = 45;
const transitionTiming = linearTiming({
  durationInFrames: TRANSITION,
  easing: Easing.bezier(0.65, 0, 0.35, 1),
});

const zoomPresentation = crossZoom({
  strength: 0.09,
  effects: [
    vignette({
      amount: 0.18,
      radius: 0.78,
      feather: 0.42,
      roundness: 1,
      color: '#35113A',
    }),
  ],
});

const SoundDesign: React.FC = () => (
  <>
    <Sequence name="audio · Original score" durationInFrames={SUNDIAL_LAUNCH_30_DURATION} premountFor={60}>
      <Audio
        src={staticFile('audio/sundial-launch/score.wav')}
        volume={(frame) => {
          if (frame < 60) return frame / 60 * 0.52;
          if (frame > 1680) return Math.max(0, (1800 - frame) / 120) * 0.52;
          return 0.52;
        }}
      />
    </Sequence>
    <Sequence name="audio · Brand whoosh" from={128} durationInFrames={120} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/whoosh.wav')} volume={0.2} toneFrequency={0.92} />
    </Sequence>
    <Sequence name="audio · Product whip" from={264} durationInFrames={120} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/whip.wav')} volume={0.12} toneFrequency={0.9} />
    </Sequence>
    <Sequence name="audio · Query click" from={378} durationInFrames={90} premountFor={20}>
      <Audio src={staticFile('audio/sundial-launch/mouse-click.wav')} volume={0.13} />
    </Sequence>
    <Sequence name="audio · Trust switch" from={696} durationInFrames={120} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/switch.wav')} volume={0.16} toneFrequency={0.82} />
    </Sequence>
    <Sequence name="audio · Everywhere whoosh" from={952} durationInFrames={120} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/whoosh.wav')} volume={0.13} toneFrequency={1.1} />
    </Sequence>
    <Sequence name="audio · Proof switch" from={1208} durationInFrames={120} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/switch.wav')} volume={0.14} toneFrequency={0.72} />
    </Sequence>
    <Sequence name="audio · Closing chime" from={1492} durationInFrames={180} premountFor={30}>
      <Audio src={staticFile('audio/sundial-launch/ding.wav')} volume={0.14} toneFrequency={0.86} />
    </Sequence>
  </>
);

export const SundialLaunch30Scene: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#FFF9F5'}}>
      <MeshBackground />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 78% 80% at 50% 52%, rgba(255,255,255,0.24), rgba(255,255,255,0) 62%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(83,29,89,0.02))',
          pointerEvents: 'none',
        }}
      />
      <TransitionSeries name="Sundial launch · 30 second story">
        <TransitionSeries.Sequence name="1 · Category hook" durationInFrames={180}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomPresentation} timing={transitionTiming} />

        <TransitionSeries.Sequence name="2 · Brand reveal" durationInFrames={180}>
          <BrandScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-bottom'})}
          timing={transitionTiming}
        />

        <TransitionSeries.Sequence name="3 · Agentic analysis demo" durationInFrames={480}>
          <ProductDemoScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomPresentation} timing={transitionTiming} />

        <TransitionSeries.Sequence name="4 · Confidence and citations" durationInFrames={300}>
          <TrustScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={transitionTiming}
        />

        <TransitionSeries.Sequence name="5 · Works everywhere" durationInFrames={300}>
          <EverywhereScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({direction: 'from-bottom-right'})}
          timing={transitionTiming}
        />

        <TransitionSeries.Sequence name="6 · Days to minutes proof" durationInFrames={270}>
          <ProofScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={54} offset={0}>
          <LightLeak seed={7} hueShift={316} />
        </TransitionSeries.Overlay>

        <TransitionSeries.Sequence name="7 · Final lockup and CTA" durationInFrames={315}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <SoundDesign />
    </AbsoluteFill>
  );
};
