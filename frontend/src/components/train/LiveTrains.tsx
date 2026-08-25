import React from 'react';
import { Train } from '../../lib/types';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING } from '../../lib/constants';
import { STATIONS } from '../../lib/stations';
import { Locomotive } from './Locomotive';
import { Coach } from './Coach';
import { BrakeGlow } from './BrakeGlow';
import { Headlight } from './Headlight';
import { TelemetryTag } from './TelemetryTag';

const getTrainY = (train: Train, x: number) => {
  const effectiveLane = train.baseLane; // We enforce strict no-switching, so baseLane is all we need.

  for (let i = 0; i < STATIONS.length; i++) {
    const station = STATIONS[i];
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + station.yardStartOffset;
    const yardEnd = sX + station.yardEndOffset;

    if (x >= yardStart && x <= yardEnd) {
      return getStationMainY(station, effectiveLane);
    }
    
    if (i < STATIONS.length - 1) {
      const nextStation = STATIONS[i+1];
      const nextYardStart = sX + STATION_SPACING + nextStation.yardStartOffset;
      if (x > yardEnd && x < nextYardStart) {
        const startY = getStationMainY(station, effectiveLane);
        const endY = getStationMainY(nextStation, effectiveLane);
        const t = (x - yardEnd) / (nextYardStart - yardEnd);
        return startY + (endY - startY) * ((1 - Math.cos(Math.PI * t)) / 2);
      }
    }
  }

  if (x < 600 + STATIONS[0].yardStartOffset) {
    return getStationMainY(STATIONS[0], effectiveLane);
  }
  return getStationMainY(STATIONS[STATIONS.length - 1], effectiveLane);
};

export const LiveTrains = ({ trains }: { trains: Train[] }) => {
  return (
    <>
      {trains.map((train) => {
        const y = getTrainY(train, train.x);
        
        const dx = train.direction * 3; 
        const nextY = getTrainY(train, train.x + dx);
        const dy = nextY - y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const isExpress = train.type === 'express';
        const isFreight = train.type === 'freight';
        const grad = isExpress ? 'url(#metal-express)' : (isFreight ? 'url(#metal-freight)' : 'url(#metal-passenger)');
        
        const numCoaches = isFreight ? 4 : 3;
        const coachLen = 14;
        const locoLen = 16;
        const gap = 2;
        const totalLen = locoLen + numCoaches * (coachLen + gap);
        const bodyWidth = 12;

        const distToStation = Math.abs(((train.x - 600) % STATION_SPACING + STATION_SPACING) % STATION_SPACING);
        const isBraking = (distToStation > STATION_SPACING - 300 || distToStation < 300) && !train.stopUntil;

        return (
          <g key={train.id} style={{ transform: `translate(${train.x}px, ${y}px) rotate(${angle}deg)`, willChange: 'transform' }} className="cursor-pointer group">
            <Headlight totalLen={totalLen} />
            {isBraking && <BrakeGlow totalLen={totalLen} bodyWidth={bodyWidth} />}
            
            {/* Ultra-Fast Fake Drop Shadow */}
            <rect x={-totalLen/2} y={-bodyWidth/2 + 4} width={totalLen} height={bodyWidth} fill="rgba(0,0,0,0.5)" rx="2" />
            
            <g>
              <Locomotive x={totalLen/2 - locoLen} length={locoLen} width={bodyWidth} gradient={grad} />
              
              {Array.from({ length: numCoaches }).map((_, cIdx) => {
                const cX = totalLen/2 - locoLen - gap - (cIdx + 1) * coachLen - (cIdx * gap);
                return (
                  <Coach 
                    key={`coach-${cIdx}`} 
                    x={cX} 
                    length={coachLen} 
                    width={bodyWidth} 
                    gradient={grad} 
                    isFreight={isFreight} 
                    gap={gap} 
                  />
                );
              })}
            </g>

            <TelemetryTag id={train.id} angle={angle} />
          </g>
        );
      })}
    </>
  );
};
