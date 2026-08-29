import { useState, useEffect } from 'react';
import { Train } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';
import { useMaintenanceStore } from '../store';

const generateTrains = (speedMultiplier: number): Train[] => {
  const INITIAL_TRAINS: Train[] = [
    { id: 'T1', name: 'Local 40531 (EMU)', x: 600 + STATIONS[0].yardStartOffset + 200, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.5, type: 'passenger' },
    { id: 'T2', name: 'Local 40531 (EMU)', x: 600 + 4 * STATION_SPACING + STATIONS[4].yardEndOffset - 200, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.8, type: 'passenger' },
    { id: 'T3', name: 'Local 40531 (EMU)', x: 600 + 1.5 * STATION_SPACING, direction: 1, baseLane: 0, switchDirection: 0, speed: 1.2, type: 'passenger' },
    { id: 'T4', name: 'Local 40531 (EMU)', x: 600 + 3 * STATION_SPACING, direction: -1, baseLane: 1, switchDirection: 0, speed: 2.4, type: 'passenger' },
    { id: 'T5', name: 'Local 40531 (EMU)', x: 600 + 0.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.6, type: 'passenger' },
    { id: 'T6', name: 'Local 40531 (EMU)', x: 600 + 2.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.6, type: 'passenger' },
    { id: 'T7', name: 'Local 40531 (EMU)', x: 600 + 1.2 * STATION_SPACING, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.7, type: 'passenger' },
    { id: 'T8', name: 'Local 40531 (EMU)', x: 600 + 3.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 1.6, type: 'passenger' }
  ];
  return INITIAL_TRAINS;
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
                 const pfMatch = bid.match(/PF(\d+)/);
                 if (pfMatch) {
                     const pIdx = parseInt(pfMatch[1], 10) - 1;
                     if (st.platforms[pIdx]) {
                         minX = sX + st.platforms[pIdx].sZoneStartOffset;
                         maxX = sX + st.platforms[pIdx].sZoneEndOffset;
                         
                         const thirdCount = Math.floor(st.p / 3);
                         if (pIdx < thirdCount) laneId = -1;
                         else if (pIdx < thirdCount * 2) laneId = 0;
                         else laneId = 1;
                     }
                 }
             }

             const secMatch = bid.match(/Sec (\d+)/);
             if (secMatch) {
                const sec = parseInt(secMatch[1], 10);
                const totalLen = Math.abs(maxX - minX);
                const numChunks = Math.ceil(totalLen / 150);
                const actualChunk = totalLen / numChunks;
                minX = minX + (sec - 1) * actualChunk;
                maxX = minX + actualChunk;
             }
            break;
         }
       }
    }
    zones.push({ minX, maxX, laneId });
  }
  return zones;
};

let cachedActiveBlocksStr = '';
let cachedHazardZones: { minX: number, maxX: number, laneId: number }[] = [];

export const useTrainPhysics = (userSpeedMultiplier: number) => {
  const [trains, setTrains] = useState<Train[]>(() => generateTrains(DEFAULT_SPEED_MULTIPLIER));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const activeBlockIds = useMaintenanceStore.getState().activeBlocks.map((b: any) => b.id);
      const activeBlocksStr = activeBlockIds.join('|');
      
      if (activeBlocksStr !== cachedActiveBlocksStr) {
          cachedHazardZones = getHazardZones(activeBlockIds);
          cachedActiveBlocksStr = activeBlocksStr;
      }
      const hazardZones = cachedHazardZones;

      setTrains((curr) => curr.map((t) => {
        if (t.stopUntil && now < t.stopUntil) {
          return t;
        }

        let newStopUntil = t.stopUntil;
        if (t.stopUntil && now >= t.stopUntil) {
          newStopUntil = undefined;
        }

        const dynamicSpeed = t.speed * userSpeedMultiplier;
        let appliedSpeed = dynamicSpeed * 0.53;
        
        let physicsFactor = 1;
        for (let i = 0; i < STATIONS.length; i++) {
          // Do not slow down if the train is not scheduled to stop here
          if (t.type === 'freight') continue;
          if (t.type === 'express' && i !== 0) continue;

          const sX = 600 + i * STATION_SPACING;
          const dist = (sX - t.x) * t.direction;
          
          if (dist > 0 && dist < 500) {
             physicsFactor = Math.max(0.08, Math.pow(dist / 500, 0.7));
             break;
          }
          if (dist < 0 && dist > -500) {
             physicsFactor = Math.max(0.08, Math.pow(Math.abs(dist) / 500, 0.7));
             break;
          }
        }
        
        let inYard = false;
        for (let i = 0; i < STATIONS.length; i++) {
           const st = STATIONS[i];
           const sX = 600 + i * STATION_SPACING;
           // Expand the yard slightly to allow switching just outside the immediate platform
           if (t.x >= sX + st.yardStartOffset - 100 && t.x <= sX + st.yardEndOffset + 100) {
              inYard = true;
              break;
           }
        }

        const LOOKAHEAD = 2800; // Look ahead past the next station!
        const SWITCH_LENGTH = 250;
        
        let newTargetLane = t.targetLane;
        let newSwitchStartX = t.switchStartX;
        let activeLane = newTargetLane !== undefined ? newTargetLane : t.baseLane;
        let currentBaseLane = t.baseLane;

        if (newTargetLane !== undefined && newSwitchStartX !== undefined) {
           const distSwitched = Math.abs(t.x - newSwitchStartX);
           // Wait for the longest train (400px freight) to fully clear the 250px switch
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
           if (newTargetLane === undefined && inYard) {
               // Find the nearest physical crossover in this yard!
               // They are drawn at: sX + yardStartOffset + 50 (West) and sX + yardEndOffset - 300 (East)
               let st = STATIONS[0];
               let sX = 0;
               for (let i = 0; i < STATIONS.length; i++) {
                  const checkSx = 600 + i * STATION_SPACING;
                  if (t.x >= checkSx + STATIONS[i].yardStartOffset - 100 && t.x <= checkSx + STATIONS[i].yardEndOffset + 100) {
                     st = STATIONS[i];
                     sX = checkSx;
                     break;
                  }
               }
               
               const aStart = sX + st.yardStartOffset + 50;
               const dStart = sX + st.yardEndOffset - 300;
               
               // If train is moving right, it approaches aStart first, then dStart.
               // If train is moving left, it approaches dStart+250 first, then aStart+250.
               let targetSwitchX = t.direction === 1 ? aStart : (dStart + 250);
               if (t.direction === 1 && t.x > aStart) targetSwitchX = dStart;
               if (t.direction === -1 && t.x < dStart + 250) targetSwitchX = aStart + 250;

               // Only trigger the switch exactly when the train's front passes the crossover start coordinate!
               const passedSwitch = (t.direction === 1 && t.x >= targetSwitchX && (t.x - appliedSpeed) <= targetSwitchX) ||
                                    (t.direction === -1 && t.x <= targetSwitchX && (t.x + appliedSpeed) >= targetSwitchX);
                                    
               if (passedSwitch) {
                   newTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
                   newSwitchStartX = targetSwitchX;
               }
           }

           if (newTargetLane !== undefined) {
               const targetLaneHazards = hazardZones.filter(z => 
                   z.laneId === newTargetLane &&
                   (Math.max(lookaheadMin, z.minX) <= Math.min(lookaheadMax, z.maxX))
               );
               const targetLaneTrains = curr.filter(other => {
                   if (other.id === t.id) return false;
                   if (other.baseLane !== newTargetLane && other.targetLane !== newTargetLane) return false;
                   const otherLen = other.type === 'freight' ? 300 : 200;
                   const otherMin = other.direction === 1 ? other.x - otherLen : other.x;
                   const otherMax = other.direction === 1 ? other.x : other.x + otherLen;
                   return Math.max(lookaheadMin, otherMin) <= Math.min(lookaheadMax, otherMax);
               });

               if (targetLaneHazards.length > 0 || targetLaneTrains.length > 0) {
                  // Target lane is also blocked in the distance. Cancel the switch.
                  newTargetLane = undefined;
                  newSwitchStartX = undefined;
               }
           }

           // If we couldn't switch (either not in yard, or target blocked), we MUST brake!
           if (newTargetLane === undefined) {
               let minDistance = LOOKAHEAD;
               hazardsAhead.forEach(z => {
                   let dist = t.direction === 1 ? (z.minX - t.x) : (t.x - z.maxX);
                   if (dist > 0 && dist < minDistance) minDistance = dist;
               });
               trainsAhead.forEach(other => {
                   let dist = t.direction === 1 ? (other.x - 200 - t.x) : (t.x - (other.x + 200));
                   if (dist > 0 && dist < minDistance) minDistance = dist;
               });
               
               if (minDistance < 1500) {
                   // Progressive braking! The closer to the hazard, the slower we crawl.
                   const brakeFactor = Math.max(0.04, Math.pow(minDistance / 1500, 1.5));
                   appliedSpeed *= brakeFactor;
               }

               if (minDistance < 100) {
                   // Hard stop right before hitting the hazard
                   appliedSpeed = 0; 
                   newStopUntil = now + 1000;
               }
           }
        }

        if (appliedSpeed > 0) {
          appliedSpeed *= physicsFactor;
        }
        
        // Terminal station progressive braking
        let distToEnd = t.direction === 1 ? CANVAS_WIDTH - 300 - t.x : t.x - 300;
        if (distToEnd < 1500 && distToEnd > 0) {
            const endBrake = Math.max(0.01, Math.pow(distToEnd / 1500, 1.5));
            appliedSpeed *= endBrake;
        }
        
        let newX = t.x + t.direction * appliedSpeed;
        
        if (!newStopUntil && appliedSpeed > 0) {
          for (let i = 0; i < STATIONS.length; i++) {
            // Freight trains don't stop at stations
            if (t.type === 'freight') continue;
            // Express trains only stop at major terminals (index 0 - Tambaram)
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

        // Terminal reverse! When trains reach the absolute edge, they stop, wait 6s, and depart in reverse
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
      }));
    }, 16); 
    
    return () => clearInterval(interval);
  }, [userSpeedMultiplier]); 

  return trains;
};
