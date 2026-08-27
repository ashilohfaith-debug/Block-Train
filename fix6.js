const fs = require('fs');

const content = import React from 'react';
import { TrackLine } from './TrackLine';
import { TrackCurve } from './TrackCurve';
import { EntryExitTracks } from './EntryExitTracks';
import { drawThroat } from '../../lib/utils/trackGeometry';
import { STATIONS } from '../../lib/stations';
import { STATION_SPACING } from '../../lib/constants';
import { getStationMainY } from '../../lib/utils/trackGeometry';

export const StaticInfrastructure = React.memo(({ interactive, onTrackClick }: { interactive?: boolean, onTrackClick?: (trackId: string) => void }) => {
  return (
    <>
      <EntryExitTracks />

      {STATIONS.map((station, i) => {
        const sX = 600 + i * STATION_SPACING;
        const yardStart = sX + station.yardStartOffset;
        const yardEnd = sX + station.yardEndOffset;
        
        const mTop = getStationMainY(station, -1);
        const mMid = getStationMainY(station, 0);
        const mBot = getStationMainY(station, 1);

        return (
          <g key={station.id}>
            <TrackLine x1={yardStart} y1={mTop} x2={yardEnd} y2={mTop} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' - Loop Line 1')} />
            <TrackLine x1={yardStart} y1={mMid} x2={yardEnd} y2={mMid} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' - Mainline')} />
            <TrackLine x1={yardStart} y1={mBot} x2={yardEnd} y2={mBot} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' - Loop Line 2')} />

            {i < STATIONS.length - 1 && (() => {
              const nextStation = STATIONS[i+1];
              const nextYardStart = sX + STATION_SPACING + nextStation.yardStartOffset;
              const nTop = getStationMainY(nextStation, -1);
              const nBot = getStationMainY(nextStation, 1);
              const nMid = getStationMainY(nextStation, 0);

              const blockName = station.name + ' to ' + nextStation.name;

              return (
                <>
                  <TrackCurve d={drawThroat(yardEnd, mTop, nextYardStart, nTop)} interactive={interactive} onClick={() => onTrackClick?.(blockName + ' Down Line')} />
                  <TrackCurve d={drawThroat(yardEnd, mMid, nextYardStart, nMid)} interactive={interactive} onClick={() => onTrackClick?.(blockName + ' Main Line')} />
                  <TrackCurve d={drawThroat(yardEnd, mBot, nextYardStart, nBot)} interactive={interactive} onClick={() => onTrackClick?.(blockName + ' Up Line')} />
                </>
              );
            })()}

            {(() => {
              const r1 = ((i + 1) * 13) % 10 / 10;
              const r2 = ((i + 1) * 29) % 10 / 10;
              const r3 = ((i + 1) * 37) % 10 / 10;

              const dStart = sX + 270 + (r1 * 120);
              const dLen = 200 + (r2 * 100);
              const dEnd = dStart + dLen;

              const aStart = sX - 300 - (r3 * 150) - dLen;
              const aEnd = aStart + dLen;

              return (
                <>
                  {r1 > 0.1 && <TrackCurve d={drawThroat(dStart, mTop, dEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' East Crossover')} />}
                  {r2 > 0.2 && <TrackCurve d={drawThroat(dStart, mMid, dEnd, mBot)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' East Main Crossover')} />}
                  {r3 > 0.1 && <TrackCurve d={drawThroat(dStart + 120, mBot, dEnd + 120, mMid)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' East Outer Crossover')} />}
                  
                  {r2 > 0.1 && <TrackCurve d={drawThroat(aStart, mMid, aEnd, mTop)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' West Crossover')} />}
                  {r1 > 0.2 && <TrackCurve d={drawThroat(aStart, mBot, aEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' West Main Crossover')} />}
                  {r3 > 0.1 && <TrackCurve d={drawThroat(aStart - 120, mMid, aEnd - 120, mBot)} interactive={interactive} onClick={() => onTrackClick?.(station.name + ' West Outer Crossover')} />}
                </>
              );
            })()}
          </g>
        );
      })}
    </>
  );
});

StaticInfrastructure.displayName = 'StaticInfrastructure';
;
fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', content);
