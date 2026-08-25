import React from 'react';
import { Train } from '../../lib/types';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING, pseudoRandom } from '../../lib/constants';
import { STATIONS } from '../../lib/stations';
import { Locomotive } from './Locomotive';
import { Coach } from './Coach';
import { BrakeGlow } from './BrakeGlow';
import { Headlight } from './Headlight';
import { TelemetryTag } from './TelemetryTag';

const getTrainY = (train: Train, x: number) => {
  const mainLane = train.baseLane; 

  for (let i = 0; i < STATIONS.length; i++) {
    const station = STATIONS[i];
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + station.yardStartOffset;
    const yardEnd = sX + station.yardEndOffset;

    // Inside station yard boundaries
    if (x >= yardStart && x <= yardEnd) {
      // Deterministically pick a platform lane based on train ID and station ID
      const r = pseudoRandom(`${train.id}-${station.id}-switch`);
      const expectedMainY = getStationMainY(station, mainLane);
      
      const validPlatforms = station.platforms.filter(p => Math.abs(p.mainLineY - expectedMainY) < 1);
      const p = validPlatforms.length > 0 
        ? validPlatforms[Math.floor(r * validPlatforms.length)] 
        : station.platforms[0];

      const divergeStart = sX + p.divergeStartOffset;
      const convergeEnd = sX + p.convergeEndOffset;
      const sZoneStart = sX + p.sZoneStartOffset;
      const sZoneEnd = sX + p.sZoneEndOffset;

      if (!p.isMainline) {
        if (x >= divergeStart && x < sZoneStart) {
          const t = (x - divergeStart) / (sZoneStart - divergeStart);
          return p.mainLineY + (p.y - p.mainLineY) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
        if (x >= sZoneStart && x <= sZoneEnd) {
          return p.y;
        }
        if (x > sZoneEnd && x <= convergeEnd) {
          const t = (x - sZoneEnd) / (convergeEnd - sZoneEnd);
          return p.y + (p.mainLineY - p.y) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
      }
      return expectedMainY;
    }
    
    // Between stations S-curve
    if (i < STATIONS.length - 1) {
      const nextStation = STATIONS[i+1];
      const nextYardStart = sX + STATION_SPACING + nextStation.yardStartOffset;
      if (x > yardEnd && x < nextYardStart) {
        const startY = getStationMainY(station, mainLane);
        const endY = getStationMainY(nextStation, mainLane);
        const t = (x - yardEnd) / (nextYardStart - yardEnd);
        return startY + (endY - startY) * ((1 - Math.cos(Math.PI * t)) / 2);
      }
    }
  }

  if (x < 600 + STATIONS[0].yardStartOffset) {
    return getStationMainY(STATIONS[0], mainLane);
  }
  return getStationMainY(STATIONS[STATIONS.length - 1], mainLane);
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

        const grad = 'url(#metal-passenger)';
        const isFreight = false;
        
        const numCoaches = 4;
        const coachLen = 18;
        const locoLen = 22;
        const gap = 3;
        const totalLen = locoLen + numCoaches * (coachLen + gap);
        const bodyWidth = 16;

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
