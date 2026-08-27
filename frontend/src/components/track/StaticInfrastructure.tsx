import React from 'react';
import { TrackLine } from './TrackLine';
import { TrackCurve } from './TrackCurve';
import { EntryExitTracks } from './EntryExitTracks';
import { drawThroat } from '../../lib/utils/trackGeometry';
import { STATIONS } from '../../lib/stations';
import { STATION_SPACING, TRACK_GAP } from '../../lib/constants';
import { getStationMainY } from '../../lib/utils/trackGeometry';

export const StaticInfrastructure = React.memo(({ interactive, onTrackClick, blockedBlocks = [] }: { interactive?: boolean, onTrackClick?: (trackId: string) => void, blockedBlocks?: string[] }) => {
  return (
    <>
      <EntryExitTracks interactive={interactive} onTrackClick={onTrackClick} />

      {STATIONS.map((station, i) => {
        const sX = 600 + i * STATION_SPACING;
        const yardStart = sX + station.yardStartOffset;
        const yardEnd = sX + station.yardEndOffset;
        
        const mTop = getStationMainY(station, -1);
        const mMid = getStationMainY(station, 0);
        const mBot = getStationMainY(station, 1);

        return (
          <g key={station.id}>
            {/* Mainlines running straight through yard */}
            <TrackLine x1={yardStart} y1={mTop} x2={yardEnd} y2={mTop} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${station.name} - Loop Line 1 (Sec ${sId})`)} isBlocked={(sId?: number) => blockedBlocks?.includes(`${station.name} - Loop Line 1 (Sec ${sId})`)} />
            <TrackLine x1={yardStart} y1={mMid} x2={yardEnd} y2={mMid} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${station.name} - Mainline (Sec ${sId})`)} isBlocked={(sId?: number) => blockedBlocks?.includes(`${station.name} - Mainline (Sec ${sId})`)} />
            <TrackLine x1={yardStart} y1={mBot} x2={yardEnd} y2={mBot} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${station.name} - Loop Line 2 (Sec ${sId})`)} isBlocked={(sId?: number) => blockedBlocks?.includes(`${station.name} - Loop Line 2 (Sec ${sId})`)} />

            {/* Inter-station S-Curves and Real-World Crossovers */}
            {i < STATIONS.length - 1 && (() => {
              const nextStation = STATIONS[i+1];
              const nextYardStart = sX + STATION_SPACING + nextStation.yardStartOffset;
              const nTop = getStationMainY(nextStation, -1);
              const nBot = getStationMainY(nextStation, 1);
              const nMid = getStationMainY(nextStation, 0);

              const blockName = `${station.name} to ${nextStation.name}`;

              return (
                <>
                  <TrackCurve d={drawThroat(yardEnd, mTop, nextYardStart, nTop)} interactive={interactive} onClick={() => onTrackClick?.(`${blockName} Down Line`)} isBlocked={blockedBlocks?.includes(`${blockName} Down Line`)} />
                  <TrackCurve d={drawThroat(yardEnd, mMid, nextYardStart, nMid)} interactive={interactive} onClick={() => onTrackClick?.(`${blockName} Main Line`)} isBlocked={blockedBlocks?.includes(`${blockName} Main Line`)} />
                  <TrackCurve d={drawThroat(yardEnd, mBot, nextYardStart, nBot)} interactive={interactive} onClick={() => onTrackClick?.(`${blockName} Up Line`)} isBlocked={blockedBlocks?.includes(`${blockName} Up Line`)} />
                </>
              );
            })()}

            {/* Natural, Non-Uniform Crossovers in the straight yard limits */}
            {(() => {
              // Pseudo-random seeds based on station ID to ensure determinism but unique layouts
              const r1 = ((i + 1) * 13) % 10 / 10;
              const r2 = ((i + 1) * 29) % 10 / 10;
              const r3 = ((i + 1) * 37) % 10 / 10;

              // Departing switches (Right side)
              // Vary placement and length per station
              const dStart = sX + 270 + (r1 * 120);
              const dLen = 200 + (r2 * 100);
              const dEnd = dStart + dLen;

              // Approaching switches (Left side)
              const aStart = sX - 300 - (r3 * 150) - dLen;
              const aEnd = aStart + dLen;

              return (
                <>
                  {/* Departing - Randomly drop some crossovers to create realistic asymmetry */}
                  {r1 > 0.1 && <TrackCurve d={drawThroat(dStart, mTop, dEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} East Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} East Crossover`)} />}
                  {r2 > 0.2 && <TrackCurve d={drawThroat(dStart, mMid, dEnd, mBot)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} East Main Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} East Main Crossover`)} />}
                  {r3 > 0.1 && <TrackCurve d={drawThroat(dStart + 120, mBot, dEnd + 120, mMid)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} East Outer Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} East Outer Crossover`)} />}
                  
                  {/* Approaching */}
                  {r2 > 0.1 && <TrackCurve d={drawThroat(aStart, mMid, aEnd, mTop)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} West Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} West Crossover`)} />}
                  {r1 > 0.2 && <TrackCurve d={drawThroat(aStart, mBot, aEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} West Main Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} West Main Crossover`)} />}
                  {r3 > 0.1 && <TrackCurve d={drawThroat(aStart - 120, mMid, aEnd - 120, mBot)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} West Outer Crossover`)} isBlocked={blockedBlocks?.includes(`${station.name} West Outer Crossover`)} />}
                </>
              );
            })()}

            {/* Explicit Crossovers specifically at MMNK */}
            {station.id === 'MMNK' && station.p <= 4 && (
              <>
                <TrackCurve d={drawThroat(sX - 450, mTop, sX - 300, mBot)} />
                <TrackCurve d={drawThroat(sX - 450, mBot, sX - 300, mTop)} />
              </>
            )}

            {/* Premium Glassmorphic Station Box */}
            <rect x={sX - 250} y={station.platforms[0].y - 45} width={500} height={(station.p * TRACK_GAP) + 70} fill="rgba(255, 255, 255, 0.05)" stroke="#374151" strokeWidth="1" rx="8" pointerEvents="none" />
            
            {/* High-Tech Corner Accents */}
            <path d={`M ${sX - 250} ${station.platforms[0].y - 30} L ${sX - 250} ${station.platforms[0].y - 45} L ${sX - 235} ${station.platforms[0].y - 45}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" pointerEvents="none" />
            <path d={`M ${sX + 250} ${station.platforms[0].y - 30} L ${sX + 250} ${station.platforms[0].y - 45} L ${sX + 235} ${station.platforms[0].y - 45}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" pointerEvents="none" />
            <path d={`M ${sX - 250} ${station.platforms[station.p-1].y + 10} L ${sX - 250} ${station.platforms[station.p-1].y + 25} L ${sX - 235} ${station.platforms[station.p-1].y + 25}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" pointerEvents="none" />
            <path d={`M ${sX + 250} ${station.platforms[station.p-1].y + 10} L ${sX + 250} ${station.platforms[station.p-1].y + 25} L ${sX + 235} ${station.platforms[station.p-1].y + 25}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" pointerEvents="none" />
            
            {/* Station Name Header Bar */}
            <rect x={sX - 250} y={station.platforms[0].y - 100} width={500} height={50} fill="#111827" stroke="#3b82f6" strokeWidth="2" rx="25" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" pointerEvents="none" />
            <text x={sX} y={station.platforms[0].y - 66} fill="#ffffff" fontSize="24" textAnchor="middle" fontWeight="900" className="font-mono tracking-widest" pointerEvents="none">
              <tspan fill="#facc15">{station.id}</tspan> <tspan fill="#4b5563">|</tspan> {station.name.toUpperCase()}
            </text>

            {/* Tracks & Platforms */}
            {station.platforms.map((plat, pIndex) => {
              const py = plat.y;
              const mainLineY = plat.mainLineY;
              const divergeStart = sX + plat.divergeStartOffset;
              const sZoneStart = sX + plat.sZoneStartOffset;
              const sZoneEnd = sX + plat.sZoneEndOffset;
              const convergeEnd = sX + plat.convergeEndOffset;

              return (
                <g key={`${station.id}-p${pIndex}`}>
                  {!plat.isMainline && (
                    <>
                      <TrackCurve d={drawThroat(divergeStart, mainLineY, sZoneStart, py)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} - PF${pIndex + 1} Diverge`)} isBlocked={blockedBlocks?.includes(`${station.name} - PF${pIndex + 1} Diverge`)} />
                      <TrackLine x1={sZoneStart} y1={py} x2={sZoneEnd} y2={py} interactive={interactive} onClick={(sId?: number) => onTrackClick?.(`${station.name} - PF${pIndex + 1} Loop (Sec ${sId})`)} isBlocked={(sId?: number) => blockedBlocks?.includes(`${station.name} - PF${pIndex + 1} Loop (Sec ${sId})`) ?? false} />
                      <TrackCurve d={drawThroat(sZoneEnd, py, convergeEnd, mainLineY)} interactive={interactive} onClick={() => onTrackClick?.(`${station.name} - PF${pIndex + 1} Converge`)} isBlocked={blockedBlocks?.includes(`${station.name} - PF${pIndex + 1} Converge`)} />
                    </>
                  )}

                  {pIndex < station.p - 1 && (() => {
                    const pWidth = Math.max(40, sZoneEnd - sZoneStart - 40);
                    const pStartX = sZoneStart + 20;
                    return (
                      <g>
                        {/* Platform Base */}
                        <rect 
                          x={pStartX} 
                          y={py + 8} 
                          width={pWidth} 
                          height={TRACK_GAP - 16} 
                          fill="#1f2937" 
                          stroke="#374151" 
                          strokeWidth="1"
                          rx="2"
                          pointerEvents="none"
                        />
                        {/* Yellow Safety Edge Lines */}
                        <line x1={pStartX} y1={py + 9} x2={pStartX + pWidth} y2={py + 9} stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" pointerEvents="none" />
                        <line x1={pStartX} y1={py + 8 + (TRACK_GAP - 16) - 1} x2={pStartX + pWidth} y2={py + 8 + (TRACK_GAP - 16) - 1} stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" pointerEvents="none" />
                        
                        {/* Platform Hatching Pattern Simulated */}
                        <rect 
                          x={pStartX + 4} 
                          y={py + 12} 
                          width={pWidth - 8} 
                          height={TRACK_GAP - 24} 
                          fill="rgba(55, 65, 81, 0.4)" 
                          rx="1"
                          pointerEvents="none"
                        />
                        {/* Platform Numbers */}
                        <text x={pStartX + pWidth/2} y={py + (TRACK_GAP / 2) + 2} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="700" className="font-mono" pointerEvents="none">
                          PF-{pIndex + 1}
                        </text>
                      </g>
                    )
                  })()}
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
});

StaticInfrastructure.displayName = 'StaticInfrastructure';
