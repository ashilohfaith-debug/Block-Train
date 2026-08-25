import React from 'react';
import { Train } from '../../lib/types';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING } from '../../lib/constants';
import { Locomotive } from './Locomotive';
import { Coach } from './Coach';
import { BrakeGlow } from './BrakeGlow';
import { Headlight } from './Headlight';
import { TelemetryTag } from './TelemetryTag';

export const LiveTrains = ({ trains }: { trains: Train[] }) => {
  return (
    <>
      {trains.map((train) => {
        const dummyStation = { p: 3, yOffset: 0, platforms: [] }; 
        const effectiveLane = train.baseLane + train.switchDirection;
        const y = getStationMainY(dummyStation, effectiveLane);
        
        const dx = train.direction * 3; 
        const nextY = getStationMainY(dummyStation, effectiveLane);
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
              <Locomotive length={locoLen} width={bodyWidth} gradient={grad} />
              
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
