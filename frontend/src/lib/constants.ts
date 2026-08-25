export const STATION_SPACING = 2400;
export const CENTER_Y = 800;
export const TRACK_GAP = 64;

// --- SCALING ENGINE CONFIGURATION ---
export const TESTING_MODE = false;
export const NUM_TRAINS = TESTING_MODE ? 3 : 12;

// The base speed multiplier. It will be controlled by a state in UI, 
// but this is the default starting value.
export const DEFAULT_SPEED_MULTIPLIER = TESTING_MODE ? 0.3 : 1.0; 
// ------------------------------------

// Predictable pseudo-random generator
export const pseudoRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return (Math.abs(h) % 1000) / 1000;
};
