import React, { useMemo } from 'react';
import { STATIONS } from '../../lib/stations';
import { STATION_SPACING } from '../../lib/constants';
import { getStationMainY } from '../../lib/utils/trackGeometry';
import { useMaintenanceStore } from '../../lib/store';
import { SignalPost, SignalAspect } from './SignalPost';

export const SignalLayer = React.memo(() => {
  const activeBlocks = useMaintenanceStore((state) => state.activeBlocks);
  const trains = useMaintenanceStore((state) => state.trains);

  const blockedSectionNames = useMemo(() => {
    return activeBlocks.map(b => b.id.toLowerCase());
  }, [activeBlocks]);

  // Determine aspect of a signal guarding track at position x, laneId, direction
  const getAspect = (x: number, laneId: number, direction: number, blockName: string): SignalAspect => {
    // 1. Check if blocked by active RBMS possession
    const cleanBlock = blockName.toLowerCase();
    const isBlocked = blockedSectionNames.some(b => 
      b.includes(cleanBlock) || cleanBlock.includes(b)
    );
    if (isBlocked) return 'red';

    // 2. Check trains ahead in the block section
    let nearestDist = Infinity;

    for (const t of trains) {
      const inLane = t.baseLane === laneId || t.targetLane === laneId;
      if (!inLane) continue;

      const dist = direction === 1 ? t.x - x : x - t.x;
      if (dist > -50 && dist < nearestDist) {
        nearestDist = dist;
      }
    }

    if (nearestDist <= 600) return 'red';
    if (nearestDist <= 1800) return 'yellow';
    if (nearestDist <= 3200) return 'double_yellow';
    return 'green';
  };

  return (
    <g className="signal-infrastructure-layer pointer-events-none">
      {STATIONS.map((station, i) => {
        const sX = 600 + i * STATION_SPACING;
        const yardStart = sX + station.yardStartOffset;
        const yardEnd = sX + station.yardEndOffset;

        const yTop = getStationMainY(station, -1);
        const yMid = getStationMainY(station, 0);
        const yBot = getStationMainY(station, 1);

        // Home signals placed at approach to yard (Down trains moving right, Up trains moving left)
        const homeDownX = yardStart - 35;
        const starterDownX = yardEnd + 35;

        const homeAspectTop = getAspect(homeDownX, -1, 1, `${station.name} - Loop Line 1`);
        const homeAspectMid = getAspect(homeDownX, 0, 1, `${station.name} - Mainline`);
        const homeAspectBot = getAspect(homeDownX, 1, -1, `${station.name} - Loop Line 2`);

        const starterAspectTop = getAspect(starterDownX, -1, 1, i < STATIONS.length - 1 ? `${station.name} to ${STATIONS[i+1].name} Down Line` : 'Down Void');
        const starterAspectMid = getAspect(starterDownX, 0, 1, i < STATIONS.length - 1 ? `${station.name} to ${STATIONS[i+1].name} Main Line` : 'Main Void');
        const starterAspectBot = getAspect(yardStart - 35, 1, -1, i > 0 ? `${STATIONS[i-1].name} to ${station.name} Up Line` : 'Up Void');

        // Mid-section block signals
        let midBlockSignals = null;
        if (i < STATIONS.length - 1) {
          const nextStation = STATIONS[i+1];
          const midX = sX + STATION_SPACING / 2;
          const blockInter = `${station.name} to ${nextStation.name}`;

          const midDownAspect = getAspect(midX, -1, 1, `${blockInter} Down Line`);
          const midMainAspect = getAspect(midX, 0, 1, `${blockInter} Main Line`);
          const midUpAspect = getAspect(midX, 1, -1, `${blockInter} Up Line`);

          midBlockSignals = (
            <g key={`mid-${station.id}-${nextStation.id}`}>
              <SignalPost x={midX} y={yTop - 6} aspect={midDownAspect} name={`IB-${station.id}-1`} direction={1} />
              <SignalPost x={midX} y={yMid - 6} aspect={midMainAspect} name={`IB-${station.id}-M`} direction={1} />
              <SignalPost x={midX} y={yBot + 18} aspect={midUpAspect} name={`IB-${station.id}-2`} direction={-1} />
            </g>
          );
        }

        return (
          <g key={`signals-${station.id}`}>
            {/* Yard Entry Home Signals */}
            <SignalPost x={homeDownX} y={yTop - 6} aspect={homeAspectTop} name={`${station.id}-1H`} direction={1} />
            <SignalPost x={homeDownX} y={yMid - 6} aspect={homeAspectMid} name={`${station.id}-MH`} direction={1} />
            <SignalPost x={homeDownX} y={yBot + 18} aspect={homeAspectBot} name={`${station.id}-2H`} direction={-1} />

            {/* Yard Exit Starter Signals */}
            <SignalPost x={starterDownX} y={yTop - 6} aspect={starterAspectTop} name={`${station.id}-1S`} direction={1} />
            <SignalPost x={starterDownX} y={yMid - 6} aspect={starterAspectMid} name={`${station.id}-MS`} direction={1} />
            <SignalPost x={starterDownX} y={yBot + 18} aspect={starterAspectBot} name={`${station.id}-2S`} direction={-1} />

            {/* Mid-section ABS signals */}
            {midBlockSignals}
          </g>
        );
      })}
    </g>
  );
});

SignalLayer.displayName = 'SignalLayer';
