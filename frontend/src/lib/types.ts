export type TrainType = 'express' | 'freight' | 'passenger';

export interface Train {
  id: string;
  name: string;
  x: number;
  direction: number; // 1 for right, -1 for left
  baseLane: number; // -1, 0, 1
  switchDirection: number; // Strictly 0 now, based on user request
  type: TrainType;
  speed: number;
  stopUntil?: number;
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
