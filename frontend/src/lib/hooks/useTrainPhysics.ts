import { useState, useEffect } from 'react';
import { Train, TrainType } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, NUM_TRAINS, DEFAULT_SPEED_MULTIPLIER } from '../constants';

const generateTrains = (speedMultiplier: number): Train[] => {
  const INITIAL_TRAINS: Train[] = [
    {
      id: 'T1',
      name: 'Express 12605 (Pallavan)',
      x: 600 + STATIONS[0].yardStartOffset + 200,
      direction: 1,
      baseLane: -1,
      switchDirection: 0,
      speed: 2.5,
      type: 'express'
    },
    {
      id: 'T2',
      name: 'Local 40531 (EMU)',
      x: 600 + 3 * STATION_SPACING + STATIONS[3].yardEndOffset - 200,
      direction: -1,
      baseLane: 1,
      switchDirection: 0,
      speed: 1.8,
      type: 'passenger'
    },
    {
      id: 'T3',
      name: 'Freight 44920',
      x: 600 + 1.5 * STATION_SPACING,
      direction: 1,
      baseLane: 0,
      switchDirection: 0,
      speed: 1.2,
      type: 'freight'
    }
  ];

  return INITIAL_TRAINS;
};

export const useTrainPhysics = (userSpeedMultiplier: number) => {
  const [trains, setTrains] = useState<Train[]>([]);

  // Initialize trains once
  useEffect(() => {
    setTrains(generateTrains(DEFAULT_SPEED_MULTIPLIER));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrains((curr) => curr.map((t) => {
        if (t.stopUntil && now < t.stopUntil) {
          return t;
        }

        let newStopUntil = t.stopUntil;
        if (t.stopUntil && now >= t.stopUntil) {
          newStopUntil = undefined;
        }

        // Apply UI speed multiplier dynamically on top of physical speed
        const dynamicSpeed = t.speed * userSpeedMultiplier;
        let appliedSpeed = dynamicSpeed * 0.53;
        
        // Realistic Physics: Smooth Braking and Acceleration
        let physicsFactor = 1;
        for (let i = 0; i < STATIONS.length; i++) {
          const sX = 600 + i * STATION_SPACING;
          const dist = (sX - t.x) * t.direction;
          
          // Braking (Approaching a station)
          if (dist > 0 && dist < 500) {
             physicsFactor = Math.max(0.08, Math.pow(dist / 500, 0.7));
             break;
          }
          // Accelerating (Departing a station)
          if (dist < 0 && dist > -500) {
             physicsFactor = Math.max(0.08, Math.pow(Math.abs(dist) / 500, 0.7));
             break;
          }
        }
        
        appliedSpeed *= physicsFactor;
        let newX = t.x + t.direction * appliedSpeed;
        
        if (!newStopUntil) {
          for (let i = 0; i < STATIONS.length; i++) {
            const sX = 600 + i * STATION_SPACING;
            if ((t.direction === 1 && t.x < sX && newX >= sX) ||
                (t.direction === -1 && t.x > sX && newX <= sX)) {
              newX = sX;
              // Divide physical wait time by the speed multiplier so they don't wait forever at 10x
              const waitTime = 10000 / Math.max(1, userSpeedMultiplier); 
              newStopUntil = now + waitTime;
              break;
            }
          }
        }

        if (newX > CANVAS_WIDTH - 200) newX = 200;
        if (newX < 200) newX = CANVAS_WIDTH - 200;
        return { ...t, x: newX, stopUntil: newStopUntil };
      }));
    }, 16); 
    
    return () => clearInterval(interval);
  }, [userSpeedMultiplier]);

  return trains;
};
