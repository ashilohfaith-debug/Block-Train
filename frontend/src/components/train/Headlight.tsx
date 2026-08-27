import React from 'react';
import { STATIONS } from '../../lib/stations';
import { STATION_SPACING } from '../../lib/constants';

export const Headlight = ({ totalLen, train }: { totalLen: number, train: import('../../lib/types').Train }) => {
  const frontX = totalLen / 2;
  
  let distanceToNextStation = 9999;
  for (let i = 0; i < STATIONS.length; i++) {
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + STATIONS[i].yardStartOffset;
    const yardEnd = sX + STATIONS[i].yardEndOffset;
    
    if (train.direction === 1) {
      if (yardStart > train.x) {
        distanceToNextStation = Math.min(distanceToNextStation, yardStart - train.x);
      } else if (yardEnd > train.x) {
        distanceToNextStation = 0; // inside station
      }
    } else {
      if (yardEnd < train.x) {
        distanceToNextStation = Math.min(distanceToNextStation, train.x - yardEnd);
      } else if (yardStart < train.x) {
        distanceToNextStation = 0;
      }
    }
  }

  // Intensity increases as distance drops. Max glow inside station or close to it.
  // Starts glowing at 600px away, max glow at 0px.
  const intensityFactor = Math.max(0.2, 1 - Math.min(distanceToNextStation / 600, 1));
  
  // Base opacity scales with intensity
  const opacity = 0.3 + (0.6 * intensityFactor);
  
  // Beam length also grows dynamically
  const beamLength = 30 + (70 * intensityFactor);
  // Beam width grows dynamically
  const beamWidth = 8 + (12 * intensityFactor);

  return (
    <g>
      {/* Dynamic Headlight beam */}
      <polygon 
        points={`${frontX},-3 ${frontX + beamLength},-${beamWidth} ${frontX + beamLength},${beamWidth} ${frontX},3`} 
        fill="url(#headlight-gradient)" 
        opacity={opacity} 
        style={{ mixBlendMode: 'screen' }}
      />
      {/* Headlight Bulbs */}
      <circle cx={frontX - 0.5} cy={-2} r="1" fill="#ffffff" opacity={0.5 + 0.5 * intensityFactor} />
      <circle cx={frontX - 0.5} cy={2} r="1" fill="#ffffff" opacity={0.5 + 0.5 * intensityFactor} />
    </g>
  );
};
