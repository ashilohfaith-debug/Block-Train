export type TrainType = 'express' | 'freight' | 'passenger';

export interface Train {
  id: string;
  name: string;
  x: number;
  direction: number; // 1 for right, -1 for left
  baseLane: number; // -1 (Down Suburban), 0 (Main Line), 1 (Up Suburban)
  switchDirection: number; // Strictly 0 now
  type: TrainType;
  speed: number;
  currentSpeed?: number;
  stopUntil?: number;
  targetLane?: number;
  switchStartX?: number;
  scheduledStops?: string[]; // Array of station IDs where train halts (e.g. ['MSB', 'MS', 'MBM', 'TBM', 'CGL'])
  currentStation?: string; // Nearest or current station
  signalAspect?: 'green' | 'double_yellow' | 'yellow' | 'red';
  speedKmh?: number; // Speed in real-world km/h (0 to 110)
  statusText?: string; // Operational status e.g. "Cruising • 108 km/h"
  locoModel?: string; // e.g. "WAP-7 #30452 (Royapuram Shed)"
  consist?: string; // e.g. "6 LHB Air-Conditioned Coaches"
  length?: number; // Physical train length in pixels
  lastStopStationId?: string; // ID of station where train recently dwelled
}

export interface Platform {
  y: number;
  mainLineY: number;
  isMainline: boolean;
  divergeStartOffset: number;
  sZoneStartOffset: number;
  sZoneEndOffset: number;
  convergeEndOffset: number;
}

export interface Station {
  id: string;
  name: string;
  p: number;
  yOffset: number;
  platforms: Platform[];
  yardStartOffset: number;
  yardEndOffset: number;
}
