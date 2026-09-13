import React from 'react';
import { TrackLine } from './TrackLine';
import { STATIONS, CANVAS_WIDTH } from '../../lib/stations';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { STATION_SPACING } from '../../lib/constants';

export const EntryExitTracks = React.memo(({ interactive, onTrackClick, blockedBlocks = [] }: { interactive?: boolean, onTrackClick?: (id: string) => void, blockedBlocks?: string[] }) => {
  const isTrackBlocked = (targetId: string) => {
    if (!blockedBlocks || blockedBlocks.length === 0) return false;
    const cleanTarget = targetId.trim().toLowerCase();
    const normalizedTarget = cleanTarget.replace(/\s*\(sec\s*\d+\)/i, '').trim();
    return blockedBlocks.some((b) => {
      const cleanB = b.trim().toLowerCase();
      const normalizedB = cleanB.replace(/\s*\(sec\s*\d+\)/i, '').trim();
      return (
        cleanB === cleanTarget ||
        normalizedB === cleanTarget ||
        cleanB === normalizedTarget ||
        normalizedB === normalizedTarget ||
        cleanTarget.startsWith(normalizedB) ||
        cleanB.startsWith(normalizedTarget)
      );
    });
  };

  const firstSt = STATIONS[0];
  const lastSt = STATIONS[STATIONS.length - 1];
  
  const firstYardStart = 600 + firstSt.yardStartOffset;
  const lastYardEnd = 600 + (STATIONS.length - 1) * STATION_SPACING + lastSt.yardEndOffset;
  
  const firstLanes = firstSt.p <= 4 ? 2 : 3;
  const lastLanes = lastSt.p <= 4 ? 2 : 3;

  return (
    <>
      {/* Entry Tracks from Void */}
      <TrackLine x1={0} y1={getStationMainY(firstSt, -1)} x2={firstYardStart} y2={getStationMainY(firstSt, -1)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`Void to ${firstSt.name} - Down (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`Void to ${firstSt.name} - Down (Sec ${sId})`)} />
      {firstLanes === 3 && <TrackLine x1={0} y1={getStationMainY(firstSt, 0)} x2={firstYardStart} y2={getStationMainY(firstSt, 0)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`Void to ${firstSt.name} - Main (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`Void to ${firstSt.name} - Main (Sec ${sId})`)} />}
      <TrackLine x1={0} y1={getStationMainY(firstSt, 1)} x2={firstYardStart} y2={getStationMainY(firstSt, 1)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`Void to ${firstSt.name} - Up (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`Void to ${firstSt.name} - Up (Sec ${sId})`)} />

      {/* Exit Tracks to Void */}
      <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, -1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, -1)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${lastSt.name} to Void - Down (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`${lastSt.name} to Void - Down (Sec ${sId})`)} />
      {lastLanes === 3 && <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 0)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 0)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${lastSt.name} to Void - Main (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`${lastSt.name} to Void - Main (Sec ${sId})`)} />}
      <TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 1)} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${lastSt.name} to Void - Up (Sec ${sId})`)} isBlocked={(sId?: number) => isTrackBlocked(`${lastSt.name} to Void - Up (Sec ${sId})`)} />
    </>
  );
});

EntryExitTracks.displayName = 'EntryExitTracks';
