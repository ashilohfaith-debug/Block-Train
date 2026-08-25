import React from 'react';
import { TrackLine } from './TrackLine';
import { STATIONS, CANVAS_WIDTH } from '../../lib/stations';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING } from '../../lib/constants';

export const EntryExitTracks = React.memo(() => {
  const firstSt = STATIONS[0];
  const lastSt = STATIONS[STATIONS.length - 1];
  
  const firstYardStart = 600 + firstSt.yardStartOffset;
  const lastYardEnd = 600 + (STATIONS.length - 1) * STATION_SPACING + lastSt.yardEndOffset;
  
  const firstLanes = firstSt.p <= 4 ? 2 : 3;
  const lastLanes = lastSt.p <= 4 ? 2 : 3;

  return (
    <>
      {/* Entry Tracks from Void */}
      <TrackLine x1={0} y1={getStationMainY(firstSt, -1)} x2={firstYardStart} y2={getStationMainY(firstSt, -1)} />
      {firstLanes === 3 && <TrackLine x1={0} y1={getStationMainY(firstSt, 0)} x2={firstYardStart} y2={getStationMainY(firstSt, 0)} />}
      <TrackLine x1={0} y1={getStationMainY(firstSt, 1)} x2={firstYardStart} y2={getStationMainY(firstSt, 1)} />

      {/* Exit Tracks to Void */}
      <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, -1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, -1)} />
      {lastLanes === 3 && <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 0)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 0)} />}
      <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 1)} />
    </>
  );
});
