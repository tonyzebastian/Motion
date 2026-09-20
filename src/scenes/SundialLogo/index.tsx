import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {MeshBackground} from '../SundialReel2026/MeshBackground';

const LOGO_WIDTH = 280;
const LOGO_HEIGHT = 82;

export const SUNDIAL_LOGO_DURATION = 300;

export const SundialLogoScene: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#FFFFFF'}}>
      <MeshBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            display: 'block',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
