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
    { id: 'T1', name: 'Local 101', x: 600, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.1, type: 'passenger' },
    { id: 'T2', name: 'Local 202', x: 2800, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.0, type: 'passenger' },
    { id: 'T3', name: 'Local 303', x: 5000, direction: 1, baseLane: -1, switchDirection: 0, speed: 0.9, type: 'passenger' },
    { id: 'T4', name: 'Local 404', x: 7200, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.05, type: 'passenger' },
    
    { id: 'T5', name: 'Local 505', x: 8000, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.1, type: 'passenger' },
    { id: 'T6', name: 'Local 606', x: 5800, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.0, type: 'passenger' },
    { id: 'T7', name: 'Local 707', x: 3600, direction: -1, baseLane: 1, switchDirection: 0, speed: 0.9, type: 'passenger' },
    { id: 'T8', name: 'Local 808', x: 1400, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.05, type: 'passenger' }
  ];
};

const getHazardZones = (activeBlockIds: string[]) => {
  const zones: { minX: number, maxX: number, laneId: number }[] = [];
  
  for (const bid of activeBlockIds) {
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
                 const pfMatch = bid.match(/PF(\\d+)/);
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
    
    zones.push({ minX, maxX, laneId });
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
      const activeBlocks = state.activeBlocks.map((b: any) => b.id);
      const hazardZones = getHazardZones(activeBlocks);
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

        const trainsAhead = curr.filter(other => {
           if (other.id === t.id) return false;
           if (other.baseLane !== activeLane && other.targetLane !== activeLane) return false;
           // Train length is 200px
           const otherMin = other.direction === 1 ? other.x - 200 : other.x;
           const otherMax = other.direction === 1 ? other.x : other.x + 200;
           return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
        });

        const hazardsAhead = hazardZones.filter(z => 
           z.laneId === activeLane &&
           (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
        );

        if (trainsAhead.length > 0 || hazardsAhead.length > 0) {
           let minDistanceToThreat = LOOKAHEAD;
           let threatIsOppositeTrain = false;
           
           hazardsAhead.forEach(z => {
               let dist = t.direction === 1 ? (z.minX - t.x) : (t.x - z.maxX);
               if (dist > 0 && dist < minDistanceToThreat) minDistanceToThreat = dist;
           });
           
           trainsAhead.forEach(other => {
               // Calculate strict nose-to-tail or nose-to-nose distance
               let dist = 0;
               if (t.direction === 1) {
                   dist = other.direction === 1 ? (other.x - 200) - t.x : other.x - t.x;
               } else {
                   dist = other.direction === 1 ? t.x - other.x : t.x - (other.x + 200);
               }
               
               if (dist > 0 && dist < minDistanceToThreat) {
                   minDistanceToThreat = dist;
                   if (other.direction !== t.direction) {
                       threatIsOppositeTrain = true;
                   }
               }
           });

           // Absolute Collision Prevention (HARD OVERLAP BLOCK)
           // If we are within 300px of a threat, literally lock speed to 0. It cannot overlap.
           if (minDistanceToThreat < 300) {
               appliedSpeed = 0;
           } else if (minDistanceToThreat < 1500) {
               // Progressive gentle braking so it looks smooth, approaching 0 at 300px
               appliedSpeed *= (minDistanceToThreat - 300) / 1200;
           }

           // Predictive Routing & Lane Switching
           if (newTargetLane === undefined && appliedSpeed > 0) {
               let st = STATIONS[0];
               let sX = 0;
               for (let i = 0; i < STATIONS.length; i++) {
                  const checkSx = 600 + i * STATION_SPACING;
                  if (t.x >= checkSx + STATIONS[i].yardStartOffset - 1000 && t.x <= checkSx + STATIONS[i].yardEndOffset + 1000) {
                     st = STATIONS[i];
                     sX = checkSx;
                     break;
                  }
               }
               
               const aStart = sX + st.yardStartOffset + 50;
               const dStart = sX + st.yardEndOffset - 300;
               
               let targetSwitchX = t.direction === 1 ? aStart : (dStart + 250);
               if (t.direction === 1 && t.x > aStart) targetSwitchX = dStart;
               if (t.direction === -1 && t.x < dStart + 250) targetSwitchX = aStart + 250;
               
               let distToSwitch = t.direction === 1 ? (targetSwitchX - t.x) : (t.x - targetSwitchX);

               // Strict Right of Way Yielding
               let mustYield = false;
               if (threatIsOppositeTrain && t.direction === -1 && minDistanceToThreat < 3000) {
                   mustYield = true;
               }

               if (mustYield) {
                   // Westbound train comes to a complete halt BEFORE the switch to let Eastbound pass
                   if (distToSwitch > -50 && distToSwitch < 600) {
                       appliedSpeed *= 0.05;
                       if (distToSwitch < 100) appliedSpeed = 0; // Hard wait
                   }
               } else {
                   // Proceed to switch if safe
                   const proposedTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
                   const targetLaneHazards = hazardZones.filter(z => 
                       z.laneId === proposedTargetLane &&
                       (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
                   );
                   const targetLaneTrains = curr.filter(other => {
                       if (other.id === t.id) return false;
                       if (other.baseLane !== proposedTargetLane && other.targetLane !== proposedTargetLane) return false;
                       const otherMin = other.direction === 1 ? other.x - 200 : other.x;
                       const otherMax = other.direction === 1 ? other.x : other.x + 200;
                       return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
                   });

                   if (targetLaneHazards.length === 0 && targetLaneTrains.length === 0) {
                       const passedSwitch = (t.direction === 1 && t.x >= targetSwitchX && (t.x - appliedSpeed * physicsFactor) <= targetSwitchX) ||
                                            (t.direction === -1 && t.x <= targetSwitchX && (t.x + appliedSpeed * physicsFactor) >= targetSwitchX);
                       if (passedSwitch) {
                           newTargetLane = proposedTargetLane;
                           newSwitchStartX = targetSwitchX;
                       }
                   }
               }
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
          if (distToNextStation < 1200) {
             const stationBrake = Math.max(0.02, Math.pow(distToNextStation / 1200, 1.5));
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
                cur += 0.003 * physicsFactor; // Very smooth, slow acceleration like real trains
                if (cur > targetSpeed) cur = targetSpeed;
            } else if (cur > targetSpeed) {
                cur -= 0.015 * physicsFactor; // Smooth but assertive braking
                if (cur < targetSpeed) cur = targetSpeed;
            }
        }

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
