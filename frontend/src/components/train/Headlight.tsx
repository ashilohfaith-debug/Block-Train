import React, { memo } from 'react';
import { STATIONS } from '../../lib/stations';
import { STATION_SPACING } from '../../lib/constants';
import { Train } from '../../lib/types';

export const Headlight = memo(({ totalLen, train }: { totalLen: number, train: Train }) => {
  const frontX = totalLen / 2;
  const isStopped = (train.currentSpeed || 0) === 0;
  
  let distanceToNextStation = 9999;
  for (let i = 0; i < STATIONS.length; i++) {
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + STATIONS[i].yardStartOffset;
    const yardEnd = sX + STATIONS[i].yardEndOffset;
    
    if (train.direction === 1) {
      if (yardStart > train.x) {
        distanceToNextStation = Math.min(distanceToNextStation, yardStart - train.x);
      } else if (yardEnd > train.x) {
        distanceToNextStation = 0;
      }
    } else {
      if (yardEnd < train.x) {
        distanceToNextStation = Math.min(distanceToNextStation, train.x - yardEnd);
      } else if (yardStart < train.x) {
        distanceToNextStation = 0;
      }
    }
  }

  // Intensity increases at speed and at station approaches
  const intensityFactor = Math.max(0.3, 1 - Math.min(distanceToNextStation / 800, 1));
  const beamLength = isStopped ? 25 : 65 + 35 * intensityFactor;
  const beamSpread = isStopped ? 6 : 14;
  const opacity = isStopped ? 0.35 : 0.75 + 0.2 * intensityFactor;

  return (
    <g className="headlight-beam-group pointer-events-none">
      {/* High-Beam Volumetric Light Fan */}
      <polygon 
        points={`${frontX},-2 ${frontX + beamLength},-${beamSpread} ${frontX + beamLength},${beamSpread} ${frontX},2`} 
        fill="url(#headlight-gradient)" 
        opacity={opacity} 
        style={{ mixBlendMode: 'screen' }}
      />

      {/* High-Intensity Twin Center Halogen Bulbs */}
      <circle cx={frontX + 0.5} cy={-1.5} r="1.3" fill="#ffffff" filter="drop-shadow(0 0 3px #ffffff)" />
      <circle cx={frontX + 0.5} cy={1.5} r="1.3" fill="#ffffff" filter="drop-shadow(0 0 3px #ffffff)" />

      {/* Ditch / Marker Lights on Pilot Beam */}
      <circle cx={frontX} cy={-5} r="1.0" fill="#fef08a" opacity={0.9} />
      <circle cx={frontX} cy={5} r="1.0" fill="#fef08a" opacity={0.9} />
    </g>
  );
});

Headlight.displayName = 'Headlight';
