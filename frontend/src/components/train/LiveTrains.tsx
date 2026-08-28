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
import { useTrainPhysics } from '../../lib/hooks/useTrainPhysics';

const getTrainYForLane = (train: Train, x: number, mainLane: number) => {
  for (let i = 0; i < STATIONS.length; i++) {
    const station = STATIONS[i];
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + station.yardStartOffset;
    const yardEnd = sX + station.yardEndOffset;

    if (x >= yardStart && x <= yardEnd) {
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

const getTrainY = (train: Train, x: number) => {
  const yBase = getTrainYForLane(train, x, train.baseLane);
  if (train.targetLane !== undefined && train.switchStartX !== undefined) {
    const yTarget = getTrainYForLane(train, x, train.targetLane);
    const SWITCH_LENGTH = 150;
    
    const dist = train.direction === 1 ? (x - train.switchStartX) : (train.switchStartX - x);
    
    if (dist <= 0) return yBase;
    if (dist >= SWITCH_LENGTH) return yTarget;
    
    const t = dist / SWITCH_LENGTH;
    // Cosine interpolation for ultra-smooth switching
    return yBase + (yTarget - yBase) * ((1 - Math.cos(Math.PI * t)) / 2);
  }
  return yBase;
};

// Calculate position and angle for a specific point on the track
const getTrackPosition = (train: Train, x: number) => {
  const y = getTrainY(train, x);
  const dx = train.direction * 3; 
  const nextY = getTrainY(train, x + dx);
  const dy = nextY - y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return { x, y, angle };
};

export const LiveTrains = ({ speedMultiplier }: { speedMultiplier: number }) => {
  const trains = useTrainPhysics(speedMultiplier);

  return (
    <>
      {trains.map((train) => {
        const isFreight = train.type === 'freight';
        const grad = isFreight ? 'url(#freight-gradient)' : train.type === 'express' ? 'url(#express-gradient)' : 'url(#train-gradient)';
        const filterId = isFreight ? 'url(#glow-freight)' : train.type === 'express' ? 'url(#glow-express)' : 'url(#glow-passenger)';
        
        const numCoaches = isFreight ? 12 : train.type === 'express' ? 6 : 4;
        const coachLen = isFreight ? 18 : 26;
        const locoLen = isFreight ? 20 : 18;
        const bodyWidth = isFreight ? 12 : 10;
        
        const gap = 4;
        
        const isBraking = Math.abs(train.speed) < 0.2 && train.speed !== 0;

        // Front of the locomotive is exactly at train.x.
        // We will calculate exact coordinates for each coach independently so they bend around curves!
        const locoFrontX = train.x;
        const locoMidX = locoFrontX - (locoLen / 2) * train.direction;
        const locoPos = getTrackPosition(train, locoMidX);
        const frontPos = getTrackPosition(train, locoFrontX);

        return (
          <g key={train.id} className="cursor-pointer group">
            
            {/* Draw Coaches */}
            {Array.from({ length: numCoaches }).map((_, cIdx) => {
              // Calculate center of this specific coach
              const distFromFront = locoLen + gap + cIdx * (coachLen + gap) + (coachLen / 2);
              const coachMidX = locoFrontX - distFromFront * train.direction;
              const pos = getTrackPosition(train, coachMidX);
              
              return (
                <g key={`coach-${cIdx}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.angle}deg)`, willChange: 'transform' }}>
                  <rect x={-coachLen/2} y={-bodyWidth/2 + 4} width={coachLen} height={bodyWidth} fill="rgba(0,0,0,0.5)" rx="2" />
                  <Coach 
                    x={-coachLen/2} 
                    length={coachLen} 
                    width={bodyWidth} 
                    gradient={grad} 
                    isFreight={isFreight} 
                    gap={gap} 
                  />
                </g>
              );
            })}

            {/* Draw Locomotive */}
            <g style={{ transform: `translate(${locoPos.x}px, ${locoPos.y}px) rotate(${locoPos.angle}deg)`, willChange: 'transform' }} filter={filterId}>
              {/* Fake Drop Shadow for Locomotive */}
              <rect x={-locoLen/2} y={-bodyWidth/2 + 4} width={locoLen} height={bodyWidth} fill="rgba(0,0,0,0.5)" rx="2" />
              
              <Locomotive x={-locoLen/2} length={locoLen} width={bodyWidth} gradient={grad} />
              {isBraking && <BrakeGlow totalLen={locoLen} bodyWidth={bodyWidth} />}
            </g>

            {/* Draw Headlight at the exact front */}
            <g style={{ transform: `translate(${frontPos.x}px, ${frontPos.y}px) rotate(${frontPos.angle}deg)`, willChange: 'transform' }}>
               <Headlight totalLen={0} train={train} />
            </g>

            {/* Draw Telemetry & Name on the Locomotive */}
            <g style={{ transform: `translate(${locoPos.x}px, ${locoPos.y}px)`, willChange: 'transform' }}>
              <TelemetryTag id={train.id} angle={0} />
              <text 
                x={0} 
                y={-18} 
                textAnchor="middle" 
                className="text-[10px] font-bold fill-slate-800 drop-shadow-md tracking-wider font-mono"
              >
                {train.name}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
};
