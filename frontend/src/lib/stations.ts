import { Station } from './types';
import { pseudoRandom, TESTING_MODE, CENTER_Y, TRACK_GAP, STATION_SPACING } from './constants';
import { getStationMainY } from './utils/trackGeometry';

const RAW_STATIONS = [
  { id: 'TBM', name: 'Tambaram', p: 8, yOffset: 60 },
  { id: 'CMP', name: 'Chromepet', p: 4, yOffset: -30 },
  { id: 'PV', name: 'Pallavaram', p: 5, yOffset: 10 },
  { id: 'STM', name: 'St. Thomas Mount', p: 5, yOffset: -40 },
  { id: 'GDY', name: 'Guindy', p: 4, yOffset: 50 }
];

const VISIBLE_STATIONS = RAW_STATIONS;

export const STATIONS: Station[] = VISIBLE_STATIONS.map(st => {
  const pYs = [];
  const startY = CENTER_Y + st.yOffset - ((st.p - 1) * TRACK_GAP) / 2;
  for (let i = 0; i < st.p; i++) pYs.push(startY + i * TRACK_GAP);

  const thirdCount = Math.floor(st.p / 3);

  const pData = [];
  for (let i = 0; i < st.p; i++) {
    let laneId;
    if (i < thirdCount) laneId = -1;
    else if (i < thirdCount * 2) laneId = 0;
    else laneId = 1;
    
    const mainLineY = getStationMainY(st, laneId);
    const isMainline = Math.abs(pYs[i] - mainLineY) < 1;
    
    pData.push({ i, laneId, mainLineY, isMainline, y: pYs[i] });
  }

  const platforms = [];
  for (let i = 0; i < st.p; i++) {
    const p = pData[i];
    
    const rndDiv = pseudoRandom(`${st.id}-${i}-divChaos`);
    const rndCon = pseudoRandom(`${st.id}-${i}-conChaos`);
    
    // Smooth, but slightly variable throat lengths for organic asymmetry
    const divergeStartOffset = -550 - (rndDiv * 350);
    const convergeEndOffset = 550 + (rndCon * 350);
    const rnd3 = pseudoRandom(`${st.id}-${i}-s2`);
    
    platforms.push({
      y: p.y,
      mainLineY: p.mainLineY,
      isMainline: p.isMainline,
      divergeStartOffset: p.isMainline ? -120 : divergeStartOffset,
      sZoneStartOffset: -80 + (rnd2 * 20),
      sZoneEndOffset: 80 - (rnd3 * 20),
      convergeEndOffset: p.isMainline ? 120 : convergeEndOffset
    });
  }

  let yardStartOffset = Math.min(...platforms.map(p => p.divergeStartOffset)) - 50;
  let yardEndOffset = Math.max(...platforms.map(p => p.convergeEndOffset)) + 50;

  if (st.id === 'MMNK') yardStartOffset -= 200; 

  return { ...st, platforms, yardStartOffset, yardEndOffset };
});

export const CANVAS_WIDTH = STATIONS.length * STATION_SPACING + 400;
export const CANVAS_HEIGHT = 1600;
