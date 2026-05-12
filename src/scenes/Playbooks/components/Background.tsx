import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

export const Background: React.FC = () => {
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(
          'product-video/ChatGPT Image May 7, 2026, 03_56_14 PM.png',
        )}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
};
