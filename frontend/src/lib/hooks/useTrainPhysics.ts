import { useState, useEffect } from 'react';
import { Train, TrainType } from '../types';
import { STATIONS, CANVAS_WIDTH } from '../stations';
import { STATION_SPACING, NUM_TRAINS, DEFAULT_SPEED_MULTIPLIER } from '../constants';

const generateTrains = (speedMultiplier: number): Train[] => {
  const trains: Train[] = [];
  for (let i = 0; i < NUM_TRAINS; i++) {
    const x = Math.random() * (CANVAS_WIDTH - 800) + 200;
    const r = Math.random();
    let lane: -1 | 0 | 1, direction, type: TrainType;
    if (r < 0.33) {
      lane = -1; direction = -1; type = 'express';
    } else if (r < 0.66) {
      lane = 0; direction = Math.random() > 0.5 ? 1 : -1; type = 'freight';
    } else {
      lane = 1; direction = 1; type = 'passenger';
    }

    // STRICT RULE: No track switching ever.
    const switchDirection = 0;

    trains.push({
      id: `T${i + 100}`,
      x,
      direction,
      baseLane: lane,
      switchDirection,
      type,
      // Train specific physical speed baseline
      speed: (Math.random() * 1.5 + 1.0) * speedMultiplier,
    });
  }
  return trains;
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
        let newX = t.x + t.direction * (dynamicSpeed * 0.53);
        
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
