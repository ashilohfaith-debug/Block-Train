import { Train, TrainType } from '../types';
import { STATIONS } from '../stations';
import { STATION_SPACING } from '../constants';
import rawSchedules from '../data/corridorSchedules.json';

export interface TimetableStop {
  station: string;
  station_name: string;
  arrival: string | null;
  departure: string | null;
  day: number;
}

export interface ScheduledTrainData {
  train_number: string;
  name: string;
  stops: TimetableStop[];
}

export const parseTimeString = (timeStr: string | null | undefined): number | null => {
  if (!timeStr || timeStr === 'None') return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
};

export const formatSecondsToTime = (seconds: number): string => {
  const norm = ((seconds % 86400) + 86400) % 86400;
  const h = Math.floor(norm / 3600);
  const m = Math.floor((norm % 3600) / 60);
  const s = Math.floor(norm % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const stationIndexMap = new Map<string, number>();
STATIONS.forEach((s, idx) => {
  stationIndexMap.set(s.id, idx);
});

export const getStationTrackX = (stationId: string): number => {
  const idx = stationIndexMap.get(stationId);
  if (idx !== undefined) {
    return 600 + idx * STATION_SPACING;
  }
  return 600;
};

const processedSchedules: {
  trainNumber: string;
  name: string;
  type: TrainType;
  direction: number; // 1 for Southbound (MSB -> CGL), -1 for Northbound (CGL -> MSB)
  baseLane: number;
  locoModel: string;
  consist: string;
  length: number;
  speedKmh: number;
  scheduledStops: string[];
  stops: {
    stationId: string;
    stationName: string;
    x: number;
    arrSec: number;
    depSec: number;
    arrStr: string;
    depStr: string;
  }[];
  corridorStartSec: number;
  corridorEndSec: number;
}[] = [];

const schedulesObj = rawSchedules as Record<string, ScheduledTrainData>;

for (const [tNum, data] of Object.entries(schedulesObj)) {
  const validStops = data.stops
    .filter(s => stationIndexMap.has(s.station))
    .map(s => {
      const arr = parseTimeString(s.arrival);
      const dep = parseTimeString(s.departure);
      const arrSec = arr ?? dep ?? 0;
      const depSec = dep ?? arr ?? arrSec;
      return {
        stationId: s.station,
        stationName: s.station_name,
        x: getStationTrackX(s.station),
        arrSec,
        depSec,
        arrStr: s.arrival ?? s.departure ?? '--',
        depStr: s.departure ?? s.arrival ?? '--'
      };
    });

  if (validStops.length < 2) continue;

  const firstIdx = stationIndexMap.get(validStops[0].stationId) ?? 0;
  const lastIdx = stationIndexMap.get(validStops[validStops.length - 1].stationId) ?? 0;
  const direction = lastIdx >= firstIdx ? 1 : -1;

  const isExpress = tNum.startsWith('12') || tNum.startsWith('16') || tNum.startsWith('20') || data.name.toLowerCase().includes('exp');
  const type: TrainType = isExpress ? 'express' : 'passenger';

  let baseLane = 0;
  if (type === 'passenger') {
    baseLane = direction === 1 ? -1 : 1;
  } else {
    baseLane = 0; // Central mainline for express
  }

  let locoModel = 'SR EMU 12-Car Medha AC';
  let consist = '12 Suburban Coaches';
  let length = 187;
  let speedKmh = 80;

  if (isExpress) {
    if (tNum.includes('12635') || tNum.includes('12636')) {
      locoModel = 'WAP-7 #30452 (Royapuram RPM Shed)';
      consist = '22 LHB Coaches (Crimson/Silver)';
      speedKmh = 110;
    } else if (tNum.includes('12605') || tNum.includes('12606')) {
      locoModel = 'WAP-7 #30488 (Erode ED Shed)';
      consist = '22 LHB Coaches (Pallavan)';
      speedKmh = 110;
    } else {
      locoModel = 'WAP-7 Electric Locomotive';
      consist = '18 LHB Coaches';
      speedKmh = 100;
    }
    length = 279;
  }

  const corridorStartSec = validStops[0].depSec;
  const corridorEndSec = validStops[validStops.length - 1].arrSec;

  processedSchedules.push({
    trainNumber: tNum,
    name: data.name,
    type,
    direction,
    baseLane,
    locoModel,
    consist,
    length,
    speedKmh,
    scheduledStops: validStops.map(s => s.stationId),
    stops: validStops,
    corridorStartSec,
    corridorEndSec
  });
}

/**
 * Returns all active trains along the MSB-CGL corridor at a specific time of day.
 * If timeSeconds is outside a train's run, the train is not active.
 */
export const getActiveTimetableTrainsAt = (timeSeconds: number): Train[] => {
  const normTime = ((timeSeconds % 86400) + 86400) % 86400;
  const activeTrains: Train[] = [];

  for (const s of processedSchedules) {
    // Check if within operating window
    if (normTime < s.corridorStartSec || normTime > s.corridorEndSec) {
      continue;
    }

    // Find the current stop segment
    let currentStop = s.stops[0];
    let nextStop = s.stops[s.stops.length - 1];
    let isDwelling = false;
    let computedX = s.stops[0].x;
    let statusText = 'On Time';
    let signalAspect: 'green' | 'double_yellow' | 'yellow' | 'red' = 'green';
    let scheduledArrival = currentStop.arrStr;
    let scheduledDeparture = currentStop.depStr;

    for (let i = 0; i < s.stops.length; i++) {
      const stop = s.stops[i];
      
      // Case 1: Currently stopped at this station
      if (normTime >= stop.arrSec && normTime <= stop.depSec) {
        currentStop = stop;
        nextStop = s.stops[Math.min(s.stops.length - 1, i + 1)];
        isDwelling = true;
        computedX = stop.x;
        signalAspect = 'red';
        statusText = `Platform Dwell at ${stop.stationName} • Dep: ${stop.depStr}`;
        scheduledArrival = stop.arrStr;
        scheduledDeparture = stop.depStr;
        break;
      }

      // Case 2: Between this station and the next station
      if (i < s.stops.length - 1) {
        const next = s.stops[i + 1];
        if (normTime > stop.depSec && normTime < next.arrSec) {
          currentStop = stop;
          nextStop = next;
          isDwelling = false;
          const span = next.arrSec - stop.depSec;
          const elapsed = normTime - stop.depSec;
          const ratio = span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 0;
          computedX = stop.x + ratio * (next.x - stop.x);
          signalAspect = 'green';
          statusText = `Cruising to ${next.stationName} • ETA: ${next.arrStr}`;
          scheduledArrival = next.arrStr;
          scheduledDeparture = next.depStr;
          break;
        }
      }
    }

    activeTrains.push({
      id: `TT-${s.trainNumber}`,
      trainNumber: s.trainNumber,
      name: `${s.trainNumber} ${s.name}`,
      x: computedX,
      direction: s.direction,
      baseLane: s.baseLane,
      switchDirection: 0,
      type: s.type,
      speed: s.type === 'express' ? 2.5 : 1.8,
      currentSpeed: isDwelling ? 0 : (s.type === 'express' ? 2.5 : 1.8),
      stopUntil: isDwelling ? Date.now() + 8000 : undefined,
      scheduledStops: s.scheduledStops,
      currentStation: currentStop.stationName,
      signalAspect,
      speedKmh: isDwelling ? 0 : s.speedKmh,
      statusText,
      locoModel: s.locoModel,
      consist: s.consist,
      length: s.length,
      scheduledArrival,
      scheduledDeparture,
      nextStop: nextStop.stationName,
      timetableActive: true
    });
  }

  return activeTrains;
};

export const getProcessedSchedulesCount = () => processedSchedules.length;
