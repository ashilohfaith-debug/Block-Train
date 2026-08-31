import { useState, useEffect } from 'react';
import { Train } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';
import { useMaintenanceStore } from '../store';

const generateTrains = (speedMultiplier: number): Train[] => {
  // 1. Made every train the exact same type ("passenger")
  // 2. Significantly reduced base speeds (0.8 to 1.1)
  // 3. Spaced them out perfectly on their dedicated lanes to prevent spawn overlap
  return [
    { id: 'T1', name: 'Local 101', x: 600, direction: 1, baseLane: -1, switchDirection: 0, speed: 0.8, type: 'passenger' },
    { id: 'T2', name: 'Local 202', x: 2800, direction: 1, baseLane: -1, switchDirection: 0, speed: 0.7, type: 'passenger' },
    { id: 'T3', name: 'Local 303', x: 5000, direction: 1, baseLane: -1, switchDirection: 0, speed: 0.65, type: 'passenger' },
    { id: 'T4', name: 'Local 404', x: 7200, direction: 1, baseLane: -1, switchDirection: 0, speed: 0.75, type: 'passenger' },
    
    { id: 'T5', name: 'Local 505', x: 8000, direction: -1, baseLane: 1, switchDirection: 0, speed: 0.8, type: 'passenger' },
    { id: 'T6', name: 'Local 606', x: 5800, direction: -1, baseLane: 1, switchDirection: 0, speed: 0.7, type: 'passenger' },
    { id: 'T7', name: 'Local 707', x: 3600, direction: -1, baseLane: 1, switchDirection: 0, speed: 0.65, type: 'passenger' },
    { id: 'T8', name: 'Local 808', x: 1400, direction: -1, baseLane: 1, switchDirection: 0, speed: 0.75, type: 'passenger' }
  ];
};

const getHazardZones = (activeBlocks: any[]) => {
  const zones: { minX: number, maxX: number, laneId: number, urgency: string }[] = [];
  
  for (const block of activeBlocks) {
    const bid = block.id;
    const urgency = block.urgency || 'Critical';
    
    let laneId = 0;
    if (bid.includes('Down Line') || bid.includes('Main Line Down')) laneId = -1;
    else if (bid.includes('Up Line') || bid.includes('Main Line Up')) laneId = 1;
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
        const nextTrains = curr.map(t => {
        if (t.stopUntil && now < t.stopUntil) return t;
        
        let newStopUntil = undefined;
        let appliedSpeed = t.speed;
        let currentBaseLane = t.baseLane;
        let newTargetLane = t.targetLane;
        let newSwitchStartX = t.switchStartX;
        let activeLane = newTargetLane !== undefined ? newTargetLane : currentBaseLane;
        const SWITCH_LENGTH = 250;
        
        if (newTargetLane !== undefined && newSwitchStartX !== undefined) {
           const distSwitched = Math.abs(t.x - newSwitchStartX);
           if (distSwitched >= SWITCH_LENGTH + 500) {
              currentBaseLane = newTargetLane;
              newTargetLane = undefined;
              newSwitchStartX = undefined;
              activeLane = currentBaseLane;
           }
        }

        const LOOKAHEAD = 5000;
        let lookaheadMin = t.direction === 1 ? t.x : t.x - LOOKAHEAD;
        let lookaheadMax = t.direction === 1 ? t.x + LOOKAHEAD : t.x;

        // 1. Find the absolute nearest physical crossover in front of the train
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

        // 2. Evaluate if an escape lane is safe
        let escapeIsSafe = false;
        let proposedTargetLane = activeLane;
        if (targetSwitchX !== -1 && newTargetLane === undefined) {
            proposedTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
            const targetLaneHazards = hazardZones.filter(z => 
                z.laneId === proposedTargetLane && (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
            );
            const targetLaneTrains = curr.filter(other => {
                if (other.id === t.id) return false;
                const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
                const inTargetLane = other.baseLane === proposedTargetLane || other.targetLane === proposedTargetLane || (otherIsSwitching && other.baseLane === proposedTargetLane);
                if (!inTargetLane) return false;
                const otherMin = other.direction === 1 ? other.x - 200 : other.x;
                const otherMax = other.direction === 1 ? other.x : other.x + 200;
                return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
            });
            if (targetLaneHazards.length === 0 && targetLaneTrains.length === 0) {
                escapeIsSafe = true;
            }
        }

        // 3. Find threats on CURRENT lane
        // If we have a safe escape route, we only care about threats that occur BEFORE the switch!
        let threatLookaheadMin = lookaheadMin;
        let threatLookaheadMax = lookaheadMax;
        if (escapeIsSafe) {
            if (t.direction === 1) threatLookaheadMax = targetSwitchX + 150;
            else threatLookaheadMin = targetSwitchX - 150;
        }

        const trainsAhead = curr.filter(other => {
           if (other.id === t.id) return false;
           const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
           const inMyLane = other.baseLane === activeLane || other.targetLane === activeLane || (otherIsSwitching && other.baseLane === activeLane);
           if (!inMyLane) return false;
           const otherMin = other.direction === 1 ? other.x - 200 : other.x;
           const otherMax = other.direction === 1 ? other.x : other.x + 200;
           return Math.max(threatLookaheadMin, otherMin) <= Math.min(threatLookaheadMax, otherMax);
        });

        const hazardsAhead = hazardZones.filter(z => 
           z.laneId === activeLane &&
           (Math.max(threatLookaheadMin, z.minX) <= Math.min(threatLookaheadMax, z.maxX))
        );

        const solidHazards = hazardsAhead.filter(z => z.urgency === 'High' || z.urgency === 'Critical');
        const softHazards = hazardsAhead.filter(z => z.urgency === 'Low' || z.urgency === 'Medium');

        // 4. Calculate Distance to Threat
        if (trainsAhead.length > 0 || solidHazards.length > 0) {
           let minDistanceToThreat = LOOKAHEAD;
           let minDistanceToOppositeTrain = Infinity;
           
           solidHazards.forEach(z => {
               let dist = t.direction === 1 ? (z.minX - t.x) : (t.x - z.maxX);
               if (dist > 0 && dist < minDistanceToThreat) minDistanceToThreat = dist;
           });
           
           trainsAhead.forEach(other => {
               let dist = 0;
               if (t.direction === 1) {
                   dist = other.direction === 1 ? (other.x - 200) - t.x : other.x - t.x;
               } else {
                   dist = other.direction === 1 ? t.x - other.x : t.x - (other.x + 200);
               }
               if (dist > 0 && dist < minDistanceToThreat) {
                   minDistanceToThreat = dist;
               }
               if (dist > 0 && other.direction !== t.direction && dist < minDistanceToOppositeTrain) {
                   minDistanceToOppositeTrain = dist;
               }
           });

           // Absolute Collision Prevention
           if (minDistanceToThreat < 300) {
               appliedSpeed = 0;
           } else if (minDistanceToThreat < 1500) {
               appliedSpeed *= (minDistanceToThreat - 300) / 1200;
           }

           // Right of Way Logic
           let mustYield = false;
           if (t.direction === -1 && minDistanceToOppositeTrain < 3000 && minDistanceToOppositeTrain <= minDistanceToThreat + 50) {
               mustYield = true;
           }

           if (mustYield) {
               if (minDistanceToOppositeTrain < 450) {
                   // DEADLOCK EMERGENCY: If nose-to-nose, Westbound MUST reverse!
                   appliedSpeed = -0.5;
               } else if (targetSwitchX !== -1 && distToSwitch > -50 && distToSwitch < 600) {
                   // SAFE YIELDING
                   if (appliedSpeed > 0) appliedSpeed *= 0.05;
                   if (distToSwitch < 100) appliedSpeed = 0; 
               }
           }
        }

        // Apply Speed Restrictions for Low/Medium Urgency Blocks
        const currentSoftHazards = hazardZones.filter(z => 
            (z.urgency === 'Low' || z.urgency === 'Medium') && 
            z.laneId === activeLane && 
            t.x >= z.minX - 200 && t.x <= z.maxX + 200
        );
        
        if (currentSoftHazards.length > 0 && appliedSpeed > 0) {
            const worstUrgency = currentSoftHazards.some(z => z.urgency === 'Medium') ? 'Medium' : 'Low';
            const speedCap = worstUrgency === 'Medium' ? 0.35 : 0.6;
            appliedSpeed = Math.min(appliedSpeed, speedCap);
        }

        // 5. Trigger Physical Switch if safe and reached
        if (escapeIsSafe && newTargetLane === undefined) {
            // Provide a 60-pixel activation window so trains that mathematically parked exactly on 
            // the crossover (due to a 300px collision shield) can still trigger the switch.
            const passedSwitch = (t.direction === 1 && t.x >= targetSwitchX && (t.x - 60.0) <= targetSwitchX) ||
                                 (t.direction === -1 && t.x <= targetSwitchX && (t.x + 60.0) >= targetSwitchX);
            if (passedSwitch) {
                newTargetLane = proposedTargetLane;
                newSwitchStartX = targetSwitchX;
            }
        }

        let targetSpeed = appliedSpeed;
        
        // Smooth Station Braking
        if (!newStopUntil && targetSpeed > 0) {
          let distToNextStation = LOOKAHEAD;
          for (let i = 0; i < STATIONS.length; i++) {
             const sX = 600 + i * STATION_SPACING;
             const targetX = sX + (95 * t.direction);
             const dist = t.direction === 1 ? (targetX - t.x) : (t.x - targetX);
             if (dist > 0 && dist < distToNextStation) {
                distToNextStation = dist;
             }
          }
          if (distToNextStation < 600) {
             const stationBrake = Math.max(0.15, Math.pow(distToNextStation / 600, 1.5));
             targetSpeed *= stationBrake;
          }
        }

        // Apply Momentum (currentSpeed)
        let cur = t.currentSpeed !== undefined ? t.currentSpeed : 0;
        
        // Hard collision override
        if (targetSpeed === 0) {
            cur = 0;
        } else {
            if (cur < targetSpeed) {
                cur += 0.001 * physicsFactor; // Very smooth, slow acceleration like real trains
                if (cur > targetSpeed) cur = targetSpeed;
            } else if (cur > targetSpeed) {
                cur -= 0.01 * physicsFactor; // Smooth but assertive braking
                if (cur < targetSpeed) cur = targetSpeed;
            }
        }

        // ABSOLUTE ANTI-OVERLAP SHIELD (Omnidirectional)
        // Prevents crashes if a train reverses into the train behind it, or if momentum allows clipping.
        curr.forEach(other => {
            if (other.id === t.id) return;
            const otherIsSwitching = other.targetLane !== undefined && Math.abs(other.x - (other.switchStartX || 0)) < 600;
            const inMyLane = other.baseLane === activeLane || other.targetLane === activeLane || (otherIsSwitching && other.baseLane === activeLane);
            
            if (inMyLane) {
                const centerDist = Math.abs(t.x - other.x);
                if (centerDist < 250) { 
                    // We are physically touching or overlapping! Cut momentum if moving towards them.
                    if (t.direction === 1) {
                        if (cur > 0 && t.x < other.x) cur = 0;
                        if (cur < 0 && t.x > other.x) cur = 0;
                    } else {
                        if (cur > 0 && t.x > other.x) cur = 0;
                        if (cur < 0 && t.x < other.x) cur = 0;
                    }
                }
            }
        });

        let actualApplied = cur * physicsFactor;
        
        // Final edge-of-world checks and terminal stops
        let newX = t.x + t.direction * actualApplied;
        
        if (!newStopUntil && actualApplied > 0) {
          for (let i = 0; i < STATIONS.length; i++) {
            const sX = 600 + i * STATION_SPACING;
            const targetX = sX + (95 * t.direction);

            if ((t.direction === 1 && t.x < targetX && newX >= targetX) ||
                (t.direction === -1 && t.x > targetX && newX <= targetX)) {
              newX = targetX;
              cur = 0; // Kill engine completely at stop
              const waitTime = 10000 / Math.max(1, userSpeedMultiplier); 
              newStopUntil = now + waitTime;
              break;
            }
          }
        }

        if (newX > CANVAS_WIDTH - 300) {
            return {
               ...t,
               x: CANVAS_WIDTH - 300,
               direction: -1,
               baseLane: t.baseLane === -1 ? 1 : (t.baseLane === 1 ? -1 : 0),
               stopUntil: now + 6000,
               currentSpeed: 0
            };
        }
        if (newX < 300) {
            return {
               ...t,
               x: 300,
               direction: 1,
               baseLane: t.baseLane === -1 ? 1 : (t.baseLane === 1 ? -1 : 0),
               stopUntil: now + 6000,
               currentSpeed: 0
            };
        }
        
        return { 
          ...t, 
          x: newX, 
          stopUntil: newStopUntil,
          baseLane: currentBaseLane,
          targetLane: newTargetLane,
          switchStartX: newSwitchStartX,
          currentSpeed: cur
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
