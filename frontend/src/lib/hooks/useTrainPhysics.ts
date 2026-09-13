import { useState, useEffect } from 'react';
import { Train } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';
import { useMaintenanceStore } from '../store';

export const getTrainLength = (type: Train['type']): number => {
  if (type === 'freight') return 405; // 28 + 5 + 12*(26+5)
  if (type === 'express') return 279; // 28 + 5 + 6*(36+5)
  return 187; // passenger: 26 + 5 + 4*(34+5)
};

export const generateTrains = (speedMultiplier: number): Train[] => {
  return [
    // Southbound Fleet (Direction: 1, MSB -> CGL)
    { 
      id: 'T1', 
      name: 'EMU 40001 (MSB-TBM)', 
      x: 1500, 
      direction: 1, 
      baseLane: -1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['MSB', 'MSF', 'MPK', 'MS', 'MSC', 'NBK', 'MKK', 'MBM', 'SP', 'GDY', 'STM', 'PZA', 'MN', 'TLM', 'PV', 'CMP', 'TBMS', 'TBM'],
      locoModel: 'SR EMU 12-Car (Medha AC Rake)',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T2', 
      name: 'EMU 40003 (MS-GDY Fast)', 
      x: 9000, 
      direction: 1, 
      baseLane: -1, 
      switchDirection: 0, 
      speed: 0.85, 
      type: 'passenger',
      scheduledStops: ['MS', 'MBM', 'GDY'],
      locoModel: 'SR EMU 12-Car (BEML)',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T3', 
      name: 'EXP 12635 Vaigai Superfast', 
      x: 14000, 
      direction: 1, 
      baseLane: 0, 
      switchDirection: 0, 
      speed: 1.1, 
      type: 'express',
      scheduledStops: ['MSB', 'MS', 'MBM', 'TBM', 'CGL'],
      locoModel: 'WAP-7 #30452 (Royapuram RPM Shed)',
      consist: '6 LHB AC Coaches (Crimson/Silver)',
      length: 279
    },
    { 
      id: 'T4', 
      name: 'EMU 40005 (STM-TBM)', 
      x: 26000, 
      direction: 1, 
      baseLane: -1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['STM', 'PZA', 'MN', 'TLM', 'PV', 'CMP', 'TBMS', 'TBM'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T5', 
      name: 'FRT 90021 Auto Rake', 
      x: 33000, 
      direction: 1, 
      baseLane: 0, 
      switchDirection: 0, 
      speed: 0.65, 
      type: 'freight',
      scheduledStops: [],
      locoModel: 'WAG-9 #31189 (Arakkonam AJJ Shed)',
      consist: '12 Double-Decker Auto Wagons',
      length: 405
    },
    { 
      id: 'T6', 
      name: 'EMU 40007 (TBM-GI)', 
      x: 43000, 
      direction: 1, 
      baseLane: -1, 
      switchDirection: 0, 
      speed: 0.78, 
      type: 'passenger',
      scheduledStops: ['TBM', 'PRGL', 'VDR', 'UPM', 'GI'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T7', 
      name: 'EXP 12605 Pallavan Superfast', 
      x: 49000, 
      direction: 1, 
      baseLane: 0, 
      switchDirection: 0, 
      speed: 1.12, 
      type: 'express',
      scheduledStops: ['MSB', 'MS', 'MBM', 'TBM', 'CGL'],
      locoModel: 'WAP-7 #30488 (Erode ED Shed)',
      consist: '6 LHB Coaches',
      length: 279
    },
    { 
      id: 'T8', 
      name: 'EMU 40009 (MMNK-CGL)', 
      x: 56500, 
      direction: 1, 
      baseLane: -1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['MMNK', 'SKL', 'CGL'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },

    // Northbound Fleet (Direction: -1, CGL -> MSB)
    { 
      id: 'T9', 
      name: 'EMU 40012 (CGL-TBM)', 
      x: 59000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['CGL', 'SKL', 'MMNK', 'POTI', 'GI', 'UPM', 'VDR', 'PRGL', 'TBM'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T10', 
      name: 'EXP 12636 Pandian Superfast', 
      x: 52000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 1.1, 
      type: 'express',
      scheduledStops: ['CGL', 'TBM', 'MBM', 'MS', 'MSB'],
      locoModel: 'WAP-7 #30221 (Royapuram RPM Shed)',
      consist: '6 LHB Coaches',
      length: 279
    },
    { 
      id: 'T11', 
      name: 'EMU 40010 (SKL-GI)', 
      x: 45000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.78, 
      type: 'passenger',
      scheduledStops: ['SKL', 'MMNK', 'POTI', 'GI'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T12', 
      name: 'FRT 90022 BTPN Petroleum Tanker', 
      x: 36000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.65, 
      type: 'freight',
      scheduledStops: [],
      locoModel: 'WAG-9 #31245 (Tughlakabad TKD Shed)',
      consist: '12 BTPN Petroleum Tankers',
      length: 405
    },
    { 
      id: 'T13', 
      name: 'EMU 40008 (TBM-STM)', 
      x: 39000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['TBM', 'TBMS', 'CMP', 'PV', 'TLM', 'MN', 'PZA', 'STM'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T14', 
      name: 'EMU 40006 (CMP-GDY Fast)', 
      x: 21500, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.85, 
      type: 'passenger',
      scheduledStops: ['CMP', 'PV', 'GDY'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T15', 
      name: 'EXP 16128 Guruvayur Express', 
      x: 16000, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 1.05, 
      type: 'express',
      scheduledStops: ['CGL', 'TBM', 'MS'],
      locoModel: 'WAP-4 #22510 (Arakkonam AJJ Shed)',
      consist: '6 LHB Coaches',
      length: 279
    },
    { 
      id: 'T16', 
      name: 'EMU 40004 (GDY-MS)', 
      x: 7500, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.8, 
      type: 'passenger',
      scheduledStops: ['GDY', 'SP', 'MBM', 'MKK', 'NBK', 'MSC', 'MS'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    },
    { 
      id: 'T17', 
      name: 'EMU 40002 (MS-MSB)', 
      x: 3200, 
      direction: -1, 
      baseLane: 1, 
      switchDirection: 0, 
      speed: 0.75, 
      type: 'passenger',
      scheduledStops: ['MS', 'MPK', 'MSF', 'MSB'],
      locoModel: 'SR EMU 12-Car',
      consist: '12 Suburban Coaches',
      length: 187
    }
  ];
};

const getHazardZones = (activeBlocks: any[]) => {
  const zones: { minX: number, maxX: number, laneId: number, urgency: string }[] = [];
  
  for (const block of activeBlocks) {
    const bid = block.id;
    const urgency = block.urgency || 'Critical';
    
    let laneId = 0;
    if (bid.includes('Down Line') || bid.includes('Main Line Down') || bid.includes('Loop Line 1')) laneId = -1;
    else if (bid.includes('Up Line') || bid.includes('Main Line Up') || bid.includes('Loop Line 2')) laneId = 1;
    else laneId = 0;

    let minX = 0;
    let maxX = CANVAS_WIDTH;
    
    let found = false;
    for (let i = 0; i < STATIONS.length - 1; i++) {
       const st = STATIONS[i];
       const nxt = STATIONS[i+1];
       if (bid.includes(`${st.name} to ${nxt.name}`)) {
          const sX = 600 + i * STATION_SPACING;
          minX = sX + st.yardEndOffset;
          maxX = sX + STATION_SPACING + nxt.yardStartOffset;
          found = true;
          break;
       }
    }
    
    if (!found) {
       for (let i = 0; i < STATIONS.length; i++) {
         const st = STATIONS[i];
         if (bid.includes(st.name)) {
            const sX = 600 + i * STATION_SPACING;
            minX = sX + st.yardStartOffset;
            maxX = sX + st.yardEndOffset;
             if (bid.includes('Loop')) {
                 const pfMatch = bid.match(/PF(\d+)/);
                 if (pfMatch) {
                     const pIdx = parseInt(pfMatch[1], 10) - 1;
                     if (st.platforms[pIdx]) {
                         minX = sX + st.platforms[pIdx].sZoneStartOffset;
                         maxX = sX + st.platforms[pIdx].sZoneEndOffset;
                     }
                 }
             }
            break;
         }
       }
    }
    
    zones.push({ minX, maxX, laneId, urgency });
  }
  return zones;
};

export const useTrainPhysics = (userSpeedMultiplier: number = DEFAULT_SPEED_MULTIPLIER) => {
  const [trains, setTrains] = useState<Train[]>([]);
  
  useEffect(() => {
    setTrains(generateTrains(userSpeedMultiplier));
  }, []);

  useEffect(() => {
    const physicsFactor = Math.min(10, Math.max(0.1, userSpeedMultiplier)); 
    
    const interval = setInterval(() => {
      const state = useMaintenanceStore.getState();
      const hazardZones = getHazardZones(state.activeBlocks);
      const now = Date.now();

      setTrains(curr => {
        const nextTrains: Train[] = curr.map((t): Train => {
          const tLen = t.length || getTrainLength(t.type);

          // 1. Station Dwell Timer Check
          if (t.stopUntil && now < t.stopUntil) {
            const remainingSec = Math.ceil((t.stopUntil - now) / 1000);
            return {
              ...t,
              currentSpeed: 0,
              speedKmh: 0,
              signalAspect: 'red' as const,
              statusText: `Station Dwell • Departs in ${remainingSec}s`
            };
          }
          
          let newStopUntil = undefined;
          let appliedSpeed = t.speed;
          let currentBaseLane = t.baseLane;
          let newTargetLane = t.targetLane;
          let newSwitchStartX = t.switchStartX;
          let activeLane = newTargetLane !== undefined ? newTargetLane : currentBaseLane;
          const SWITCH_LENGTH = 280;
          
          // Complete track switch if distance traversed exceeds switch length
          if (newTargetLane !== undefined && newSwitchStartX !== undefined) {
             const distSwitched = Math.abs(t.x - newSwitchStartX);
             if (distSwitched >= SWITCH_LENGTH + 400) {
                currentBaseLane = newTargetLane;
                newTargetLane = undefined;
                newSwitchStartX = undefined;
                activeLane = currentBaseLane;
             }
          }

          const LOOKAHEAD = 5500;
          let lookaheadMin = t.direction === 1 ? t.x : t.x - LOOKAHEAD;
          let lookaheadMax = t.direction === 1 ? t.x + LOOKAHEAD : t.x;

          // 2. Find nearest physical crossover in front of train for emergency detour
          const validSwitches: number[] = [];
          for (let i = 0; i < STATIONS.length; i++) {
              const sX = 600 + i * STATION_SPACING;
              const st = STATIONS[i];
              if (t.direction === 1) {
                  validSwitches.push(sX + st.yardStartOffset + 50);
                  validSwitches.push(sX + st.yardEndOffset - 300);
              } else {
                  validSwitches.push(sX + st.yardStartOffset + 300);
                  validSwitches.push(sX + st.yardEndOffset - 50);
              }
          }
          
          let targetSwitchX = -1;
          let distToSwitch = Infinity;
          for (const sx of validSwitches) {
              const dist = t.direction === 1 ? (sx - t.x) : (t.x - sx);
              if (dist > -50 && dist < distToSwitch) {
                  distToSwitch = dist;
                  targetSwitchX = sx;
              }
          }

          // 3. Evaluate if an escape crossover lane is safe
          let escapeIsSafe = false;
          let proposedTargetLane = activeLane;
          if (targetSwitchX !== -1 && newTargetLane === undefined) {
              proposedTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
              
              const targetLaneHazards = hazardZones.filter(z => 
                  z.laneId === proposedTargetLane && (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
              );
              const targetLaneTrains = curr.filter(other => {
                  if (other.id === t.id) return false;
                  const oLen = other.length || getTrainLength(other.type);
                  const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
                  const inTargetLane = other.baseLane === proposedTargetLane || other.targetLane === proposedTargetLane || (otherIsSwitching && other.baseLane === proposedTargetLane);
                  if (!inTargetLane) return false;
                  
                  const otherMin = other.direction === 1 ? other.x - oLen : other.x;
                  const otherMax = other.direction === 1 ? other.x : other.x + oLen;
                  return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
              });
              
              if (targetLaneHazards.length === 0 && targetLaneTrains.length === 0) {
                  escapeIsSafe = true;
              }
          }

          // 4. Threats on current active lane
          let threatLookaheadMin = lookaheadMin;
          let threatLookaheadMax = lookaheadMax;
          if (escapeIsSafe) {
              if (t.direction === 1) threatLookaheadMax = targetSwitchX;
              else threatLookaheadMin = targetSwitchX;
          }

          const trainsAhead = curr.filter(other => {
             if (other.id === t.id) return false;
             const oLen = other.length || getTrainLength(other.type);
             const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
             const inMyLane = other.baseLane === activeLane || other.targetLane === activeLane || (otherIsSwitching && other.baseLane === activeLane);
             if (!inMyLane) return false;
             
             const otherMin = other.direction === 1 ? other.x - oLen : other.x;
             const otherMax = other.direction === 1 ? other.x : other.x + oLen;
             return Math.max(threatLookaheadMin, otherMin) <= Math.min(threatLookaheadMax, otherMax);
          });

          const hazardsAhead = hazardZones.filter(z => 
             z.laneId === activeLane &&
             (Math.max(threatLookaheadMin, z.minX) <= Math.min(threatLookaheadMax, z.maxX))
          );

          // Turnout speed restriction (PSR 30 km/h) if currently switching
          if (newTargetLane !== undefined) {
             appliedSpeed = Math.min(appliedSpeed, 0.45);
          }

          // 5. Calculate Distance to Threat & 4-Aspect Signal State
          let minDistanceToThreat = LOOKAHEAD;
          let activeSignalAspect: 'green' | 'double_yellow' | 'yellow' | 'red' = 'green';
          let statusText = 'Line Clear • Speed MPS';

          hazardsAhead.forEach(z => {
              const myFront = t.x;
              const myBack = t.direction === 1 ? t.x - tLen : t.x + tLen;
              const myMin = Math.min(myFront, myBack);
              const myMax = Math.max(myFront, myBack);
              
              if (Math.max(myMin, z.minX) <= Math.min(myMax, z.maxX)) {
                  minDistanceToThreat = 0;
              } else {
                  let dist = t.direction === 1 ? (z.minX - t.x) : (t.x - z.maxX);
                  if (dist > 0 && dist < minDistanceToThreat) minDistanceToThreat = dist;
              }
          });

          trainsAhead.forEach(other => {
              const oLen = other.length || getTrainLength(other.type);
              let dist = 0;
              if (t.direction === 1) {
                  const otherTail = other.direction === 1 ? other.x - oLen : other.x - oLen;
                  dist = otherTail - t.x;
              } else {
                  const otherTail = other.direction === -1 ? other.x + oLen : other.x + oLen;
                  dist = t.x - otherTail;
              }
              if (dist > 0 && dist < minDistanceToThreat) {
                  minDistanceToThreat = dist;
              }
          });

          // 4-Aspect Automatic Signaling Rules:
          if (minDistanceToThreat <= 350) {
              appliedSpeed = 0;
              activeSignalAspect = 'red';
              statusText = 'Danger Aspect (RED) • Stop at Fouling Mark';
          } else if (minDistanceToThreat < 1200) {
              // Yellow: Caution 30 km/h
              const factor = Math.max(0.08, (minDistanceToThreat - 350) / 850);
              appliedSpeed *= (factor * 0.4);
              activeSignalAspect = 'yellow';
              statusText = 'Caution Aspect (YELLOW) • Speed Restricted to 30 km/h';
          } else if (minDistanceToThreat < 2800) {
              // Double Yellow: Attention 60 km/h
              const factor = 0.4 + 0.3 * ((minDistanceToThreat - 1200) / 1600);
              appliedSpeed *= factor;
              activeSignalAspect = 'double_yellow';
              statusText = 'Attention Aspect (DOUBLE YELLOW) • Approach Caution';
          } else {
              activeSignalAspect = 'green';
              statusText = 'Line Clear (GREEN) • Normal MPS Track Speed';
          }

          // 6. Trigger Crossover Switch if safe and reached
          if (escapeIsSafe && newTargetLane === undefined && hazardsAhead.length > 0) {
              const passedSwitch = (t.direction === 1 && t.x >= targetSwitchX && (t.x - 70.0) <= targetSwitchX) ||
                                   (t.direction === -1 && t.x <= targetSwitchX && (t.x + 70.0) >= targetSwitchX);
              if (passedSwitch) {
                  newTargetLane = proposedTargetLane;
                  newSwitchStartX = targetSwitchX;
                  statusText = 'Negotiating Crossover • Detour via Interlocking';
              }
          }

          let targetSpeed = appliedSpeed;

          // 7. Authentic Station Stoppages & Dwell Scheduling
          let nearestStationName = 'Open Section';
          if (!newStopUntil && targetSpeed > 0 && t.scheduledStops && t.scheduledStops.length > 0) {
              let distToNextScheduledStop = LOOKAHEAD;
              let targetStation = null;
              let stopTargetX = 0;

              for (let i = 0; i < STATIONS.length; i++) {
                  const st = STATIONS[i];
                  if (!t.scheduledStops.includes(st.id)) continue;

                  const sX = 600 + i * STATION_SPACING;
                  const tx = sX + (95 * t.direction);
                  const dist = t.direction === 1 ? (tx - t.x) : (t.x - tx);
                  
                  if (dist > 0 && dist < distToNextScheduledStop) {
                      distToNextScheduledStop = dist;
                      targetStation = st;
                      stopTargetX = tx;
                  }
              }

              if (targetStation) {
                  nearestStationName = targetStation.name;
                  if (distToNextScheduledStop < 900) {
                      const brakeFactor = Math.max(0.12, Math.pow(distToNextScheduledStop / 900, 1.4));
                      targetSpeed *= brakeFactor;
                      statusText = `Approaching ${targetStation.name} • Decelerating for Halt`;
                  }
              }
          }

          // 8. Authentic Physics Engine: Inertia, Acceleration & Smooth Braking
          let cur = t.currentSpeed !== undefined ? t.currentSpeed : 0;
          
          let accelRate = 0.0025;
          let decelRate = 0.012;
          if (t.type === 'express') {
              accelRate = 0.0018;
              decelRate = 0.008;
          } else if (t.type === 'freight') {
              accelRate = 0.0008;
              decelRate = 0.005;
          }

          if (cur < targetSpeed) {
              cur += accelRate * physicsFactor;
              if (cur > targetSpeed) cur = targetSpeed;
          } else if (cur > targetSpeed) {
              cur -= decelRate * physicsFactor;
              if (cur < targetSpeed) cur = targetSpeed;
          }
          if (cur < 0.005) cur = 0;

          // 9. Absolute Anti-Collision Bounding Box Shield
          curr.forEach(other => {
              if (other.id === t.id) return;
              const oLen = other.length || getTrainLength(other.type);
              const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
              const inMyLane = other.baseLane === activeLane || other.targetLane === activeLane || (otherIsSwitching && other.baseLane === activeLane);
              
              if (inMyLane) {
                  const myFront = t.x;
                  const otherFront = other.x;
                  const separation = t.direction === 1 ? (otherFront - oLen) - myFront : myFront - (otherFront + oLen);
                  
                  if (separation > 0 && separation < 180) {
                      cur = 0;
                  }
              }
          });

          let actualApplied = cur * physicsFactor;
          let newX = t.x + t.direction * actualApplied;

          // 10. Platform Arrival Detection & Dwell Trigger
          if (!newStopUntil && actualApplied > 0 && t.scheduledStops && t.scheduledStops.length > 0) {
              for (let i = 0; i < STATIONS.length; i++) {
                  const st = STATIONS[i];
                  if (!t.scheduledStops.includes(st.id)) continue;

                  const sX = 600 + i * STATION_SPACING;
                  const targetX = sX + (95 * t.direction);

                  if ((t.direction === 1 && t.x < targetX && newX >= targetX) ||
                      (t.direction === -1 && t.x > targetX && newX <= targetX)) {
                      newX = targetX;
                      cur = 0;
                      const dwellTimeMs = t.type === 'express' ? 14000 : 8000;
                      const scaledDwell = dwellTimeMs / Math.max(1, userSpeedMultiplier);
                      newStopUntil = now + scaledDwell;
                      activeSignalAspect = 'red';
                      statusText = `Platform Dwell at ${st.name} • Passenger Interchange`;
                      break;
                  }
              }
          }

          // 11. Terminal Turnaround Mechanics (Chennai Beach & Chengalpattu Junction)
          const MAX_TERMINAL_X = CANVAS_WIDTH - 450;
          const MIN_TERMINAL_X = 450;

          if (newX > MAX_TERMINAL_X) {
              return {
                 ...t,
                 x: MAX_TERMINAL_X,
                 direction: -1,
                 baseLane: 1,
                 targetLane: undefined,
                 switchStartX: undefined,
                 stopUntil: now + 8000,
                 currentSpeed: 0,
                 speedKmh: 0,
                 signalAspect: 'red' as const,
                 statusText: 'Chengalpattu Terminal • Reversing Direction'
              };
          }
          if (newX < MIN_TERMINAL_X) {
              return {
                 ...t,
                 x: MIN_TERMINAL_X,
                 direction: 1,
                 baseLane: -1,
                 targetLane: undefined,
                 switchStartX: undefined,
                 stopUntil: now + 8000,
                 currentSpeed: 0,
                 speedKmh: 0,
                 signalAspect: 'red' as const,
                 statusText: 'Chennai Beach Terminal • Reversing Direction'
              };
          }

          const maxKmh = t.type === 'express' ? 110 : t.type === 'passenger' ? 80 : 65;
          const speedKmh = Math.round((cur / t.speed) * maxKmh);

          if (cur > 0 && statusText === 'Line Clear • Speed MPS') {
              statusText = `Cruising • ${speedKmh} km/h • Speed MPS`;
          }
          
          return { 
            ...t, 
            x: newX, 
            stopUntil: newStopUntil,
            baseLane: currentBaseLane,
            targetLane: newTargetLane,
            switchStartX: newSwitchStartX,
            currentSpeed: cur,
            speedKmh,
            signalAspect: activeSignalAspect,
            statusText,
            currentStation: nearestStationName,
            length: tLen
          };
        });
        
        useMaintenanceStore.getState().setTrains(nextTrains);
        return nextTrains;
      });
    }, 16); 
    
    return () => clearInterval(interval);
  }, [userSpeedMultiplier]);

  return trains;
};
