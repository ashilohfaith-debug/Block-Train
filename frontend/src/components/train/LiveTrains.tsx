import React, { useState } from 'react';
import { Train } from '../../lib/types';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING, pseudoRandom } from '../../lib/constants';
import { STATIONS } from '../../lib/stations';
import { Locomotive } from './Locomotive';
import { Coach } from './Coach';
import { BrakeGlow } from './BrakeGlow';
import { Headlight } from './Headlight';
import { useTrainPhysics } from '../../lib/hooks/useTrainPhysics';

const getTrainYForLane = (train: Train, x: number, mainLane: number) => {
  for (let i = 0; i < STATIONS.length; i++) {
    const station = STATIONS[i];
    const sX = 600 + i * STATION_SPACING;
    const yardStart = sX + station.yardStartOffset;
    const yardEnd = sX + station.yardEndOffset;

    if (x >= yardStart && x <= yardEnd) {
      const expectedMainY = getStationMainY(station, mainLane);
      
      // If the train does NOT stop at this station (e.g. Express run-through),
      // keep it strictly on the straight mainline track without diverting!
      const stopsHere = train.scheduledStops?.includes(station.id);
      if (!stopsHere) {
        return expectedMainY;
      }

      const r = pseudoRandom(`${train.id}-${station.id}-switch`);
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
    const SWITCH_LENGTH = 280;
    
    const dist = train.direction === 1 ? (x - train.switchStartX) : (train.switchStartX - x);
    
    if (dist <= 0) return yBase;
    if (dist >= SWITCH_LENGTH) return yTarget;
    
    const t = dist / SWITCH_LENGTH;
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
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

  return (
    <>
      {trains.map((train) => {
        const isFreight = train.type === 'freight';
        const isExpress = train.type === 'express';
        const grad = isFreight ? 'url(#freight-gradient)' : isExpress ? 'url(#express-gradient)' : 'url(#train-gradient)';
        
        const numCoaches = isFreight ? 12 : isExpress ? 6 : 4;
        const coachLen = isFreight ? 26 : 36;
        const locoLen = isFreight ? 28 : 28;
        const bodyWidth = isFreight ? 16 : 14;
        const gap = 5;
        
        // Realistic braking detection: current speed significantly below target cruising speed
        const isBraking = train.currentSpeed !== undefined && 
                          train.currentSpeed < (train.speed * 0.55) && 
                          train.currentSpeed > 0.05;

        // Front of the locomotive is exactly at train.x
        const locoFrontX = train.x;
        const locoMidX = locoFrontX - (locoLen / 2) * train.direction;
        const locoPos = getTrackPosition(train, locoMidX);
        const frontPos = getTrackPosition(train, locoFrontX);

        // Aspect color for HUD
        const aspectColor = train.signalAspect === 'red' 
          ? '#ef4444' 
          : (train.signalAspect === 'yellow' || train.signalAspect === 'double_yellow') 
          ? '#eab308' 
          : '#22c55e';

        const speedDisplay = (train.currentSpeed || 0) === 0 
          ? 'HALT' 
          : `${train.speedKmh ?? Math.round(train.speed * 100)} km/h`;

        const isSelected = selectedTrain?.id === train.id;

        return (
          <g 
            key={train.id} 
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTrain(selectedTrain?.id === train.id ? null : train);
            }}
          >
            {/* Draw Coaches */}
            {Array.from({ length: numCoaches }).map((_, cIdx) => {
              const distFromFront = locoLen + gap + cIdx * (coachLen + gap) + (coachLen / 2);
              const coachMidX = locoFrontX - distFromFront * train.direction;
              const pos = getTrackPosition(train, coachMidX);
              const isLast = cIdx === numCoaches - 1;
              
              return (
                <g 
                  key={`coach-${cIdx}`} 
                  style={{ 
                    transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.angle}deg)`, 
                    willChange: 'transform' 
                  }}
                >
                  {/* Subtle ground shadow */}
                  <rect x={-coachLen/2} y={-bodyWidth/2 + 3} width={coachLen} height={bodyWidth} fill="rgba(0,0,0,0.4)" rx="2" />
                  <Coach 
                    x={-coachLen/2} 
                    length={coachLen} 
                    width={bodyWidth} 
                    gradient={grad} 
                    isFreight={isFreight}
                    type={train.type} 
                    gap={gap}
                    isLastCoach={isLast} 
                  />
                </g>
              );
            })}

            {/* Draw Locomotive */}
            <g style={{ transform: `translate(${locoPos.x}px, ${locoPos.y}px) rotate(${locoPos.angle}deg)`, willChange: 'transform' }}>
              <rect x={-locoLen/2} y={-bodyWidth/2 + 3} width={locoLen} height={bodyWidth} fill="rgba(0,0,0,0.5)" rx="2" />
              <Locomotive 
                x={-locoLen/2} 
                length={locoLen} 
                width={bodyWidth} 
                gradient={grad} 
                type={train.type}
              />
              {isBraking && <BrakeGlow totalLen={locoLen} bodyWidth={bodyWidth} />}
            </g>

            {/* Draw Headlight at the exact front */}
            <g style={{ transform: `translate(${frontPos.x}px, ${frontPos.y}px) rotate(${frontPos.angle}deg)`, willChange: 'transform' }}>
               <Headlight totalLen={0} train={train} />
            </g>

            {/* High-Contrast Luminous Telemetry HUD Tag above Locomotive */}
            <g 
              style={{ transform: `translate(${locoPos.x}px, ${locoPos.y - 28}px)`, willChange: 'transform' }}
              className="pointer-events-auto"
            >
              {/* High-Contrast Glass Capsule Background */}
              <rect 
                x={-95} 
                y={-11} 
                width={190} 
                height={22} 
                rx={11} 
                fill="#090d16" 
                stroke={isSelected ? '#38bdf8' : '#334155'} 
                strokeWidth={isSelected ? 1.5 : 1} 
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.85))" 
              />
              
              {/* Status Aspect Beacon */}
              <circle cx={-83} cy={0} r={3.5} fill={aspectColor} className="animate-pulse" />
              <circle cx={-83} cy={0} r={1.5} fill="#ffffff" />

              {/* Train Name (High Contrast Pure White) */}
              <text 
                x={-73} 
                y={3.5} 
                fill="#f8fafc" 
                fontSize={9} 
                fontWeight="700" 
                fontFamily="monospace"
                letterSpacing="0.03em"
              >
                {train.name.length > 18 ? train.name.slice(0, 18) + '…' : train.name}
              </text>

              {/* Live Speed Badge */}
              <rect x={44} y={-7} width={45} height={14} rx={7} fill="#1e293b" />
              <text 
                x={66.5} 
                y={3} 
                fill="#38bdf8" 
                fontSize={8} 
                fontWeight="800" 
                fontFamily="monospace" 
                textAnchor="middle"
              >
                {speedDisplay}
              </text>
            </g>

            {/* Interactive Live IR Dispatch Telemetry Modal when Train is Selected */}
            {isSelected && (
              <g 
                style={{ transform: `translate(${locoPos.x}px, ${locoPos.y - 120}px)` }}
                className="pointer-events-auto z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Popover Window Card */}
                <rect 
                  x={-130} 
                  y={-50} 
                  width={260} 
                  height={115} 
                  rx={8} 
                  fill="#0b1120" 
                  stroke="#38bdf8" 
                  strokeWidth={1.5} 
                  filter="drop-shadow(0 12px 28px rgba(0,0,0,0.95))" 
                />

                {/* Header Bar */}
                <rect x={-130} y={-50} width={260} height={24} rx={8} fill="#1e293b" />
                <rect x={-130} y={-34} width={260} height={8} fill="#1e293b" />
                <circle cx={-118} cy={-38} r={3} fill={aspectColor} />
                <text x={-108} y={-35} fill="#38bdf8" fontSize={10} fontWeight="bold" fontFamily="monospace">
                  IR RBMS DIGITAL TELEMETRY
                </text>
                
                {/* Close Button */}
                <text 
                  x={116} 
                  y={-34} 
                  fill="#94a3b8" 
                  fontSize={11} 
                  fontWeight="bold" 
                  className="cursor-pointer hover:fill-white"
                  onClick={() => setSelectedTrain(null)}
                >
                  ✕
                </text>

                {/* Train Name & Type */}
                <text x={-118} y={-18} fill="#ffffff" fontSize={10} fontWeight="bold" fontFamily="sans-serif">
                  {train.name}
                </text>
                <text x={-118} y={-6} fill="#94a3b8" fontSize={8} fontFamily="monospace">
                  Loco: <tspan fill="#e2e8f0">{train.locoModel || 'WAP-7 RPM Electric'}</tspan>
                </text>

                {/* Consist & Track Section */}
                <text x={-118} y={6} fill="#94a3b8" fontSize={8} fontFamily="monospace">
                  Rake: <tspan fill="#cbd5e1">{train.consist || `${numCoaches} Coaches`}</tspan>
                </text>
                <text x={-118} y={18} fill="#94a3b8" fontSize={8} fontFamily="monospace">
                  Track: <tspan fill="#facc15">{train.baseLane === -1 ? 'Down Suburban' : train.baseLane === 0 ? 'Main Corridor' : 'Up Suburban'}</tspan> • <tspan fill="#38bdf8">{speedDisplay}</tspan>
                </text>

                {/* Operational Status Banner */}
                <rect x={-122} y={26} width={244} height={18} rx={4} fill="#111827" stroke="#374151" strokeWidth={0.8} />
                <text x={-116} y={38} fill="#a5f3fc" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
                  {train.statusText || 'Normal MPS Operation'}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};
