import { useState, useEffect } from 'react';
import { Train } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';
import { useMaintenanceStore } from '../store';

const generateTrains = (speedMultiplier: number): Train[] => {
  return [
    { id: 'T1', name: 'Express 40531', x: 600 + STATIONS[0].yardStartOffset + 200, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.5, type: 'passenger' },
    { id: 'T2', name: 'Local 9021', x: 600 + 4 * STATION_SPACING + STATIONS[4].yardEndOffset - 200, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.8, type: 'passenger' },
    { id: 'T3', name: 'Freight 77X', x: 600 + 1.5 * STATION_SPACING, direction: 1, baseLane: 0, switchDirection: 0, speed: 1.2, type: 'freight' },
    { id: 'T4', name: 'Express 3302', x: 600 + 3 * STATION_SPACING, direction: -1, baseLane: 1, switchDirection: 0, speed: 2.4, type: 'passenger' },
    { id: 'T5', name: 'Local 440', x: 600 + 0.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.6, type: 'passenger' },
    { id: 'T6', name: 'Express 991', x: 600 + 2.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.6, type: 'passenger' },
    { id: 'T7', name: 'Freight 11Y', x: 600 + 1.2 * STATION_SPACING, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.7, type: 'freight' },
    { id: 'T8', name: 'Local 505', x: 600 + 3.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.6, type: 'passenger' }
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
      const activeBlocks = state.activeBlocks.map((b) => b.id);
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
        
        // Massive predictive lookahead for flawless dispatching
        const LOOKAHEAD = 6000; 
        
        // Crossover resolution
        if (newTargetLane !== undefined && newSwitchStartX !== undefined) {
           const distSwitched = Math.abs(t.x - newSwitchStartX);
           if (distSwitched >= SWITCH_LENGTH + 500) {
              currentBaseLane = newTargetLane;
              newTargetLane = undefined;
              newSwitchStartX = undefined;
              activeLane = currentBaseLane;
           }
        }

        let lookaheadMin = t.direction === 1 ? t.x : t.x - LOOKAHEAD;
        let lookaheadMax = t.direction === 1 ? t.x + LOOKAHEAD : t.x;

        const trainsAhead = curr.filter(other => {
           if (other.id === t.id) return false;
           // If they are on the same lane currently, OR if they are switching into our lane
           if (other.baseLane !== activeLane && other.targetLane !== activeLane) return false;
           const otherLen = other.type === 'freight' ? 300 : 200;
           const otherMin = other.direction === 1 ? other.x - otherLen : other.x;
           const otherMax = other.direction === 1 ? other.x : other.x + otherLen;
           return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
        });

        const hazardsAhead = hazardZones.filter(z => 
           z.laneId === activeLane &&
           (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
        );

        if (trainsAhead.length > 0 || hazardsAhead.length > 0) {
           
           // Find the absolute closest threat
           let minDistanceToThreat = LOOKAHEAD;
           let threatIsOppositeTrain = false;
           
           hazardsAhead.forEach(z => {
               let dist = t.direction === 1 ? (z.minX - t.x) : (t.x - z.maxX);
               if (dist > 0 && dist < minDistanceToThreat) minDistanceToThreat = dist;
           });
           
           trainsAhead.forEach(other => {
               let dist = t.direction === 1 ? (other.x - 200 - t.x) : (t.x - (other.x + 200));
               if (dist > 0 && dist < minDistanceToThreat) {
                   minDistanceToThreat = dist;
                   if (other.direction !== t.direction) {
                       threatIsOppositeTrain = true;
                   }
               }
           });

           // We are in danger. Find the nearest upcoming crossover to ESCAPE.
           let st = STATIONS[0];
           let sX = 0;
           for (let i = 0; i < STATIONS.length; i++) {
              const checkSx = 600 + i * STATION_SPACING;
              // Expanded yard detection area to predict early
              if (t.x >= checkSx + STATIONS[i].yardStartOffset - 1500 && t.x <= checkSx + STATIONS[i].yardEndOffset + 1500) {
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
           
           // RIGHT-OF-WAY LOGIC (Perfect Passing)
           // If an opposing train is coming, one must YIELD before the switch.
           // Rule: Trains heading East (1) have priority. Trains heading West (-1) yield.
           let mustYield = false;
           if (threatIsOppositeTrain && t.direction === -1 && minDistanceToThreat < 2500) {
               mustYield = true;
           }

           if (mustYield) {
               // Brake before the switch!
               if (distToSwitch > 0 && distToSwitch < 400) {
                   appliedSpeed *= 0.1; // Crawl
                   if (distToSwitch < 50) {
                       appliedSpeed = 0; // Stop dead before the switch to let the other train use it
                   }
               }
           } else {
               // Try to switch lanes to escape the threat!
               const proposedTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
               
               // Verify the proposed lane is safe
               const targetLaneHazards = hazardZones.filter(z => 
                   z.laneId === proposedTargetLane &&
                   (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
               );
               const targetLaneTrains = curr.filter(other => {
                   if (other.id === t.id) return false;
                   if (other.baseLane !== proposedTargetLane && other.targetLane !== proposedTargetLane) return false;
                   const otherLen = other.type === 'freight' ? 300 : 200;
                   const otherMin = other.direction === 1 ? other.x - otherLen : other.x;
                   const otherMax = other.direction === 1 ? other.x : other.x + otherLen;
                   return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
               });

               const isTargetLaneSafe = targetLaneHazards.length === 0 && targetLaneTrains.length === 0;

               if (isTargetLaneSafe && distToSwitch > -100 && distToSwitch < 1500) {
                   // We are clear to switch! Wait until we physically hit the switch coordinate to trigger it.
                   const passedSwitch = (t.direction === 1 && t.x >= targetSwitchX && (t.x - appliedSpeed) <= targetSwitchX) ||
                                        (t.direction === -1 && t.x <= targetSwitchX && (t.x + appliedSpeed) >= targetSwitchX);
                                        
                   if (passedSwitch && newTargetLane === undefined) {
                       newTargetLane = proposedTargetLane;
                       newSwitchStartX = targetSwitchX;
                   }
               } else if (newTargetLane === undefined) {
                   // Cannot switch (not safe, or no switch nearby). Must brake progressively to avoid collision.
                   if (minDistanceToThreat < 2000) {
                       const brakeFactor = Math.max(0.02, Math.pow(minDistanceToThreat / 2000, 1.5));
                       appliedSpeed *= brakeFactor;
                   }
                   if (minDistanceToThreat < 150) {
                       appliedSpeed = 0; 
                       newStopUntil = now + 500; // Recalculate soon
                   }
               }
           }
        }

        if (appliedSpeed > 0) {
          appliedSpeed *= physicsFactor;
        }
        
        let distToEnd = t.direction === 1 ? CANVAS_WIDTH - 300 - t.x : t.x - 300;
        if (distToEnd < 1500 && distToEnd > 0) {
            const endBrake = Math.max(0.01, Math.pow(distToEnd / 1500, 1.5));
            appliedSpeed *= endBrake;
        }
        
        let newX = t.x + t.direction * appliedSpeed;
        
        if (!newStopUntil && appliedSpeed > 0) {
          for (let i = 0; i < STATIONS.length; i++) {
            if (t.type === 'freight') continue;
            if (t.type === 'express' && i !== 0) continue;

            const sX = 600 + i * STATION_SPACING;
            if ((t.direction === 1 && t.x < sX && newX >= sX) ||
                (t.direction === -1 && t.x > sX && newX <= sX)) {
              newX = sX;
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
            };
        }
        if (newX < 300) {
            return {
               ...t,
               x: 300,
               direction: 1,
               baseLane: t.baseLane === -1 ? 1 : (t.baseLane === 1 ? -1 : 0),
               stopUntil: now + 6000,
            };
        }
        
        return { 
          ...t, 
          x: newX, 
          stopUntil: newStopUntil,
          baseLane: currentBaseLane,
          targetLane: newTargetLane,
          switchStartX: newSwitchStartX
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
