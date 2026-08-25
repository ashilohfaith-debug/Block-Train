import { Station } from './types';
import { pseudoRandom, TESTING_MODE, CENTER_Y, TRACK_GAP, STATION_SPACING } from './constants';
import { getStationMainY } from './utils/trackGeometry';

const RAW_STATIONS = [
  { id: 'CGL', name: 'Chengalpattu', p: 8, yOffset: 0 },
  { id: 'SKL', name: 'Singaperumal Koil', p: 5, yOffset: 0 },
  { id: 'MMNK', name: 'Maraimalai Nagar', p: 3, yOffset: 0 },
  { id: 'GI', name: 'Guduvancheri', p: 4, yOffset: 0 },
  { id: 'VDR', name: 'Vandalur', p: 3, yOffset: 0 },
  { id: 'PRGL', name: 'Perungalathur', p: 3, yOffset: 0 },
  { id: 'TBM', name: 'Tambaram', p: 9, yOffset: 0 },
  { id: 'CMP', name: 'Chromepet', p: 4, yOffset: 0 },
  { id: 'PV', name: 'Pallavaram', p: 5, yOffset: 0 },
  { id: 'STM', name: 'St. Thomas Mount', p: 5, yOffset: 0 },
  { id: 'GDY', name: 'Guindy', p: 4, yOffset: 0 },
  { id: 'MBM', name: 'Mambalam', p: 4, yOffset: 0 },
  { id: 'NBK', name: 'Nungambakkam', p: 4, yOffset: 0 },
  { id: 'MS', name: 'Chennai Egmore', p: 11, yOffset: 0 },
  { id: 'MAS', name: 'Chennai Central', p: 17, yOffset: 0 }
];

const VISIBLE_STATIONS = TESTING_MODE 
  ? [RAW_STATIONS[0], RAW_STATIONS[6], RAW_STATIONS[14]] 
  : RAW_STATIONS;

export const STATIONS: Station[] = VISIBLE_STATIONS.map(st => {
  const pYs = [];
  const startY = CENTER_Y + st.yOffset - ((st.p - 1) * TRACK_GAP) / 2;
  for (let i = 0; i < st.p; i++) pYs.push(startY + i * TRACK_GAP);

  const numLanes = st.p <= 4 ? 2 : 3;
  const thirdCount = Math.floor(st.p / 3);
  const halfCount = Math.floor(st.p / 2);

  const pData = [];
  for (let i = 0; i < st.p; i++) {
    let laneId;
    if (numLanes === 3) {
      if (i < thirdCount) laneId = -1;
      else if (i < thirdCount * 2) laneId = 0;
      else laneId = 1;
    } else {
      if (i < halfCount) laneId = -1;
      else laneId = 1;
    }
    
    const mainLineY = getStationMainY(st, laneId);
    const isMainline = Math.abs(pYs[i] - mainLineY) < 1;
    
    pData.push({ i, laneId, mainLineY, isMainline, y: pYs[i] });
  }

  const platforms = [];
  for (let i = 0; i < st.p; i++) {
    const p = pData[i];
    
    const rndDiv = pseudoRandom(`${st.id}-${i}-divChaos`);
    const rndCon = pseudoRandom(`${st.id}-${i}-conChaos`);
    const rnd2 = pseudoRandom(`${st.id}-${i}-s1`);
    const rnd3 = pseudoRandom(`${st.id}-${i}-s2`);
    
    const isBigYard = st.p >= 8;
    const stretch = isBigYard ? 700 : 230;
    
    const divergeStartOffset = -120 - (rndDiv * stretch);
    const convergeEndOffset = 120 + (rndCon * stretch);
    
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
