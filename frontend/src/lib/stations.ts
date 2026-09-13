import { Station } from './types';
import { pseudoRandom, TESTING_MODE, CENTER_Y, TRACK_GAP, STATION_SPACING } from './constants';
import { getStationMainY } from './utils/trackGeometry';

const RAW_STATIONS = [
  { id: 'MSB', name: 'Chennai Beach', p: 10, yOffset: 40 },
  { id: 'MSF', name: 'Chennai Fort', p: 5, yOffset: -20 },
  { id: 'MPK', name: 'Chennai Park', p: 4, yOffset: 20 },
  { id: 'MS', name: 'Chennai Egmore', p: 11, yOffset: 50 },
  { id: 'MSC', name: 'Chetpet', p: 4, yOffset: -30 },
  { id: 'NBK', name: 'Nungambakkam', p: 4, yOffset: 20 },
  { id: 'MKK', name: 'Kodambakkam', p: 4, yOffset: -40 },
  { id: 'MBM', name: 'Mambalam', p: 5, yOffset: 30 },
  { id: 'SP', name: 'Saidapet', p: 4, yOffset: -20 },
  { id: 'GDY', name: 'Guindy', p: 4, yOffset: 40 },
  { id: 'STM', name: 'St. Thomas Mount', p: 5, yOffset: -30 },
  { id: 'PZA', name: 'Pazhavanthangal', p: 4, yOffset: 20 },
  { id: 'MN', name: 'Meenambakkam', p: 4, yOffset: -20 },
  { id: 'TLM', name: 'Tirusulam', p: 4, yOffset: 30 },
  { id: 'PV', name: 'Pallavaram', p: 4, yOffset: -30 },
  { id: 'CMP', name: 'Chromepet', p: 4, yOffset: 20 },
  { id: 'TBMS', name: 'Tambaram Sanatorium', p: 4, yOffset: -40 },
  { id: 'TBM', name: 'Tambaram', p: 10, yOffset: 50 },
  { id: 'PRGL', name: 'Perungalathur', p: 3, yOffset: -20 },
  { id: 'VDR', name: 'Vandalur', p: 4, yOffset: 30 },
  { id: 'UPM', name: 'Urapakkam', p: 3, yOffset: -30 },
  { id: 'GI', name: 'Guduvancheri', p: 5, yOffset: 40 },
  { id: 'POTI', name: 'Potheri', p: 4, yOffset: -20 },
  { id: 'MMNK', name: 'Maraimalai Nagar', p: 4, yOffset: 30 },
  { id: 'SKL', name: 'Singaperumal Koil', p: 5, yOffset: -30 },
  { id: 'CGL', name: 'Chengalpattu Junction', p: 8, yOffset: 40 }
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
    const rnd2 = pseudoRandom(`${st.id}-${i}-s1`);
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
