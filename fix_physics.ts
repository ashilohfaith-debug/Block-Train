import { useState, useEffect } from 'react';
import { Train } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';
import { useMaintenanceStore } from '../store';

const generateTrains = (speedMultiplier: number): Train[] => {
  const INITIAL_TRAINS: Train[] = [
    { id: 'T1', name: 'Express 12605 (Pallavan)', x: 600 + STATIONS[0].yardStartOffset + 200, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.5, type: 'express' },
    { id: 'T2', name: 'Local 40531 (EMU)', x: 600 + 4 * STATION_SPACING + STATIONS[4].yardEndOffset - 200, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.8, type: 'passenger' },
    { id: 'T3', name: 'Freight 44920', x: 600 + 1.5 * STATION_SPACING, direction: 1, baseLane: 0, switchDirection: 0, speed: 1.2, type: 'freight' },
    { id: 'T4', name: 'Express 16101 (Boat Mail)', x: 600 + 3 * STATION_SPACING, direction: -1, baseLane: -1, switchDirection: 0, speed: 2.4, type: 'express' },
    { id: 'T5', name: 'Local 40533 (EMU)', x: 600 + 0.5 * STATION_SPACING, direction: 1, baseLane: 1, switchDirection: 0, speed: 1.6, type: 'passenger' },
    { id: 'T6', name: 'Express 12635 (Vaigai)', x: 600 + 2.5 * STATION_SPACING, direction: 1, baseLane: -1, switchDirection: 0, speed: 2.6, type: 'express' },
    { id: 'T7', name: 'Local 40535 (EMU)', x: 600 + 1.2 * STATION_SPACING, direction: -1, baseLane: 1, switchDirection: 0, speed: 1.7, type: 'passenger' },
    { id: 'T8', name: 'Local 40537 (EMU)', x: 600 + 3.5 * STATION_SPACING, direction: 1, baseLane: 1, switchDirection: 0, speed: 1.6, type: 'passenger' }
  ];
  return INITIAL_TRAINS;
};

const getHazardZones = (activeBlockIds: string[]) => {
  const zones: { minX: number, maxX: number, laneId: number }[] = [];
  
  for (const bid of activeBlockIds) {
    let laneId = 0;
    if (bid.includes('Loop Line 1') || bid.includes('Down Line')) laneId = -1;
    else if (bid.includes('Loop Line 2') || bid.includes('Up Line')) laneId = 1;
    else laneId = 0;

    let minX = 0;
    let maxX = CANVAS_WIDTH;
    
    let found = false;
    for (let i = 0; i < STATIONS.length - 1; i++) {
       const st = STATIONS[i];
       const nxt = STATIONS[i+1];
       if (bid.includes(\\ to \\)) {
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

export const useTrainPhysics = (userSpeedMultiplier: number) => {
  const [trains, setTrains] = useState<Train[]>(() => generateTrains(DEFAULT_SPEED_MULTIPLIER));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const activeBlockIds = useMaintenanceStore.getState().activeBlocks.map((b: any) => b.id);
      const hazardZones = getHazardZones(activeBlockIds);

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
        
        const LOOKAHEAD = 350; 
        const SWITCH_LENGTH = 150;
        
        // Progress active lane switch
        let newTargetLane = t.targetLane;
        let newSwitchStartX = t.switchStartX;
        let activeLane = newTargetLane !== undefined ? newTargetLane : t.baseLane;
        let currentBaseLane = t.baseLane;

        if (newTargetLane !== undefined && newSwitchStartX !== undefined) {
           const distSwitched = Math.abs(t.x - newSwitchStartX);
           if (distSwitched >= SWITCH_LENGTH) {
              currentBaseLane = newTargetLane;
              newTargetLane = undefined;
              newSwitchStartX = undefined;
              activeLane = currentBaseLane;
           }
        }

        // 1. Detect trains ahead on the active lane
        const trainsAhead = curr.filter(other => 
           other.id !== t.id && 
           (other.baseLane === activeLane || other.targetLane === activeLane) && 
           other.direction === t.direction &&
           ((t.direction === 1 && other.x > t.x && other.x - t.x < LOOKAHEAD) ||
            (t.direction === -1 && other.x < t.x && t.x - other.x < LOOKAHEAD))
        );

        // 2. Detect hazard blocks ahead on the active lane
        const hazardsAhead = hazardZones.filter(z => 
           z.laneId === activeLane &&
           ((t.direction === 1 && z.minX > t.x && z.minX - t.x < LOOKAHEAD) ||
            (t.direction === -1 && z.maxX < t.x && t.x - z.maxX < LOOKAHEAD))
        );

        if (trainsAhead.length > 0 || hazardsAhead.length > 0) {
           if (newTargetLane === undefined) {
               // Initiate switch
               const possibleLanes = [-1, 0, 1].filter(l => l !== activeLane);
               newTargetLane = activeLane === 0 ? (t.direction === 1 ? -1 : 1) : 0;
               newSwitchStartX = t.x;
           }

           // Check if the target lane is ALSO blocked (emergency stop)
           if (newTargetLane !== undefined) {
               const targetLaneHazards = hazardZones.filter(z => 
                   z.laneId === newTargetLane &&
                   ((t.direction === 1 && z.minX > t.x && z.minX - t.x < LOOKAHEAD) ||
                    (t.direction === -1 && z.maxX < t.x && t.x - z.maxX < LOOKAHEAD))
               );
               const targetLaneTrains = curr.filter(other => 
                   other.id !== t.id && 
                   (other.baseLane === newTargetLane || other.targetLane === newTargetLane) && 
                   other.direction === t.direction &&
                   ((t.direction === 1 && other.x > t.x && other.x - t.x < LOOKAHEAD) ||
                    (t.direction === -1 && other.x < t.x && t.x - other.x < LOOKAHEAD))
               );

               if (targetLaneHazards.length > 0 || targetLaneTrains.length > 0) {
                  appliedSpeed = 0; // completely stop
                  newStopUntil = now + 1000;
               }
           }
        }

        if (appliedSpeed > 0) {
          appliedSpeed *= physicsFactor;
        }
        
        let newX = t.x + t.direction * appliedSpeed;
        
        if (!newStopUntil && appliedSpeed > 0) {
          for (let i = 0; i < STATIONS.length; i++) {
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

        if (newX > CANVAS_WIDTH - 200) newX = 200;
        if (newX < 200) newX = CANVAS_WIDTH - 200;
        
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
