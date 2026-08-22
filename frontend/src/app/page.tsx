'use client';
import React, { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const STATION_SPACING = 1600;
const CENTER_Y = 400;
const TRACK_GAP = 24;

// Predictable pseudo-random generator to guarantee trains and tracks use the exact same chaos
const pseudoRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return (Math.abs(h) % 1000) / 1000;
};

const RAW_STATIONS = [
  { id: 'CGL', name: 'Chengalpattu', p: 8, yOffset: 150 },
  { id: 'SKL', name: 'Singaperumal Koil', p: 5, yOffset: 180 },
  { id: 'MMNK', name: 'Maraimalai Nagar', p: 3, yOffset: 100 },
  { id: 'GI', name: 'Guduvancheri', p: 4, yOffset: 40 },
  { id: 'VDR', name: 'Vandalur', p: 3, yOffset: 0 },
  { id: 'PRGL', name: 'Perungalathur', p: 3, yOffset: -50 },
  { id: 'TBM', name: 'Tambaram', p: 9, yOffset: -150 },
  { id: 'CMP', name: 'Chromepet', p: 4, yOffset: -220 },
  { id: 'PV', name: 'Pallavaram', p: 5, yOffset: -250 },
  { id: 'STM', name: 'St. Thomas Mount', p: 5, yOffset: -180 },
  { id: 'GDY', name: 'Guindy', p: 4, yOffset: -80 },
  { id: 'MBM', name: 'Mambalam', p: 4, yOffset: -20 },
  { id: 'NBK', name: 'Nungambakkam', p: 4, yOffset: 40 },
  { id: 'MS', name: 'Chennai Egmore', p: 11, yOffset: 120 },
  { id: 'MAS', name: 'Chennai Central', p: 17, yOffset: 200 }
];



const generateTrains = () => {
  const trains = [];
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * (CANVAS_WIDTH - 800) + 200;
    const r = Math.random();
    let lane, direction, type;
    if (r < 0.33) {
      lane = -1; direction = -1; type = 'express';
    } else if (r < 0.66) {
      lane = 0; direction = Math.random() > 0.5 ? 1 : -1; type = 'freight';
    } else {
      lane = 1; direction = 1; type = 'passenger';
    }

    let switchDirection = 0;
    if (lane === -1) switchDirection = Math.random() > 0.5 ? 1 : 0;
    else if (lane === 1) switchDirection = Math.random() > 0.5 ? -1 : 0;
    else switchDirection = Math.random() > 0.5 ? 1 : -1;

    trains.push({
      id: `T${i + 100}`,
      x,
      direction,
      baseLane: lane,
      switchDirection,
      type,
      speed: Math.random() * 1.5 + 1.0, 
    });
  }
  return trains;
};

const getLaneMultiplier = (laneId: number, numLanes: number) => {
  if (numLanes === 3) return laneId;
  if (numLanes === 2) {
    if (laneId <= 0) return -0.5;
    return -0.5 + laneId;
  }
  return laneId;
};

// Pre-calculate highly organic, randomized platform architectures for every station
const STATIONS = RAW_STATIONS.map(st => {
  const pYs = [];
  const startY = CENTER_Y + st.yOffset - ((st.p - 1) * TRACK_GAP) / 2;
  for (let i = 0; i < st.p; i++) pYs.push(startY + i * TRACK_GAP);

  const numLanes = st.p <= 4 ? 2 : 3;
  const thirdCount = Math.floor(st.p / 3);
  const halfCount = Math.floor(st.p / 2);

  // 1. Assign each platform a lane and identify mainlines
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
    const laneMultiplier = getLaneMultiplier(laneId, numLanes);
    const mainLineY = CENTER_Y + st.yOffset + (laneMultiplier * TRACK_GAP);
    const isMainline = Math.abs(pYs[i] - mainLineY) < 1;
    
    pData.push({ i, laneId, mainLineY, isMainline, y: pYs[i] });
  }

  // 2. Generate Platforms with pure, independent random chaos for criss-crossing webs!
  const platforms = [];
  for (let i = 0; i < st.p; i++) {
    const p = pData[i];
    
    // Massive independent random seeds
    const rndDiv = pseudoRandom(`${st.id}-${i}-divChaos`);
    const rndCon = pseudoRandom(`${st.id}-${i}-conChaos`);
    const rnd2 = pseudoRandom(`${st.id}-${i}-s1`);
    const rnd3 = pseudoRandom(`${st.id}-${i}-s2`);
    
    // Massive stations (Tambaram, Central) have yards that stretch far outside the station!
    const isBigYard = st.p >= 8;
    const stretch = isBigYard ? 700 : 230;
    
    // By completely randomizing the diverge distance, tracks will randomly cross over and under each other inside the throat space, creating a beautiful chaotic switchyard!
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

const CANVAS_WIDTH = STATIONS.length * STATION_SPACING + 400;
const CANVAS_HEIGHT = 800;

export default function RailwayDigitalTwin() {
  const [trains, setTrains] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setMounted(true);
    setTrains(generateTrains());
    
    const clockInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);

    const interval = setInterval(() => {
      setTrains((curr) => curr.map((t) => {
        let newX = t.x + t.direction * t.speed;
        if (newX > CANVAS_WIDTH - 200) newX = 200;
        if (newX < 200) newX = CANVAS_WIDTH - 200;
        return { ...t, x: newX };
      }));
    }, 30); 
    
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const getTrainY = (train: any, x: number) => {
    const MMNK_SX = 600 + 2 * STATION_SPACING;
    const crossStart = MMNK_SX - 450;
    const crossEnd = MMNK_SX - 300;

    let shift = 0;
    if (train.switchDirection !== 0) {
      if (x > crossEnd) {
        shift = train.switchDirection;
      } else if (x > crossStart && x <= crossEnd) {
        const t = (x - crossStart) / (crossEnd - crossStart);
        shift = train.switchDirection * ((1 - Math.cos(Math.PI * t)) / 2);
      }
    }
    const effectiveLane = train.baseLane + shift;
    const discreteLane = Math.round(effectiveLane);

    for (let i = 0; i < STATIONS.length; i++) {
      const station = STATIONS[i];
      const sX = 600 + i * STATION_SPACING;
      
      const numLanes = station.p <= 4 ? 2 : 3;
      
      const trainNum = parseInt(train.id.replace('T', ''));
      let pIndex;
      if (numLanes === 3) {
        const topCount = Math.floor(station.p / 3);
        const midCount = topCount;
        const botCount = station.p - topCount - midCount;
        if (discreteLane === -1) pIndex = trainNum % Math.max(1, topCount);
        else if (discreteLane === 0) pIndex = topCount + (trainNum % Math.max(1, midCount));
        else pIndex = topCount + midCount + (trainNum % Math.max(1, botCount));
      } else {
        const topCount = Math.floor(station.p / 2);
        const botCount = station.p - topCount;
        if (discreteLane <= 0) pIndex = trainNum % Math.max(1, topCount);
        else pIndex = topCount + (trainNum % Math.max(1, botCount));
      }
      
      pIndex = Math.max(0, Math.min(station.platforms.length - 1, pIndex));
      
      const plat = station.platforms[pIndex];
      const targetY = plat.y;
      const divergeStart = sX + plat.divergeStartOffset;
      const sZoneStart = sX + plat.sZoneStartOffset;
      const sZoneEnd = sX + plat.sZoneEndOffset;
      const convergeEnd = sX + plat.convergeEndOffset;
      const yardStart = sX + station.yardStartOffset;
      const yardEnd = sX + station.yardEndOffset;
      
      const laneMultiplier = getLaneMultiplier(effectiveLane, numLanes);
      const mainY = CENTER_Y + station.yOffset + (laneMultiplier * TRACK_GAP);

      if (x >= yardStart && x <= yardEnd) {
        if (x >= sZoneStart && x <= sZoneEnd) return targetY;
        if (x >= divergeStart && x < sZoneStart) {
          const t = (x - divergeStart) / (sZoneStart - divergeStart);
          return mainY + (targetY - mainY) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
        if (x > sZoneEnd && x <= convergeEnd) {
          const t = (x - sZoneEnd) / (convergeEnd - sZoneEnd);
          return targetY + (mainY - targetY) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
        return mainY;
      }

      if (i < STATIONS.length - 1) {
        const nextStation = STATIONS[i + 1];
        const nextNumLanes = nextStation.p <= 4 ? 2 : 3;
        const nextSX = sX + STATION_SPACING;
        const nextYardStart = nextSX + nextStation.yardStartOffset;
        
        if (x > yardEnd && x < nextYardStart) {
          const nextLaneMultiplier = getLaneMultiplier(effectiveLane, nextNumLanes);
          const nextMainY = CENTER_Y + nextStation.yOffset + (nextLaneMultiplier * TRACK_GAP);
          const t = (x - yardEnd) / (nextYardStart - yardEnd);
          return mainY + (nextMainY - mainY) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
      }
    }

    const firstNumLanes = STATIONS[0].p <= 4 ? 2 : 3;
    if (x <= 600 + STATIONS[0].yardStartOffset) {
      return CENTER_Y + STATIONS[0].yOffset + (getLaneMultiplier(effectiveLane, firstNumLanes) * TRACK_GAP);
    }
    const lastStation = STATIONS[STATIONS.length - 1];
    const lastNumLanes = lastStation.p <= 4 ? 2 : 3;
    return CENTER_Y + lastStation.yOffset + (getLaneMultiplier(effectiveLane, lastNumLanes) * TRACK_GAP);
  };

  const drawThroat = (startX: number, startY: number, endX: number, endY: number) => {
    const dx = Math.abs(endX - startX) / 2;
    const cp1x = startX + dx;
    const cp2x = endX - dx;
    return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
  };

  const TrackLine = ({ x1, y1, x2, y2, opacity = 1 }: any) => (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="6" strokeDasharray="2 6" opacity="0.6" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="1.5" />
    </g>
  );

  const TrackCurve = ({ d, opacity = 1 }: any) => (
    <g opacity={opacity}>
      <path d={d} stroke="#10b981" strokeWidth="6" strokeDasharray="2 6" fill="transparent" opacity="0.6" />
      <path d={d} stroke="#10b981" strokeWidth="1.5" fill="transparent" />
    </g>
  );

  if (!mounted) return null;

  return (
    <div className="w-full h-screen bg-[#060b13] overflow-hidden relative font-sans">
      
      {/* PROFESSIONAL HUD OVERLAYS */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl shadow-2xl flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <h1 className="text-sm font-bold text-white tracking-widest uppercase">Live Network Telemetry</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium">Chengalpattu ➔ Chennai Central Corridor</p>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-6 text-xs font-mono">
            <span className="flex items-center gap-2"><span className="text-blue-500 text-sm">➤</span> EXPRESS</span>
            <span className="flex items-center gap-2"><span className="text-yellow-500 text-sm">➤</span> PASSENGER</span>
            <span className="flex items-center gap-2"><span className="text-orange-500 text-sm">➤</span> FREIGHT</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-50 pointer-events-none">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-lg shadow-xl text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">System Time</p>
          <p className="text-lg font-bold font-mono text-slate-200">{time}</p>
        </div>
      </div>

      {/* INTERACTIVE MAP */}
      <TransformWrapper
        initialScale={0.8}
        minScale={0.1}
        maxScale={4}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            
            {/* Elegant Blueprint Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', width: CANVAS_WIDTH }} />
            
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block drop-shadow-sm">
              {STATIONS.map((station, i) => {
                const sX = 600 + i * STATION_SPACING;
                const yardStart = sX + station.yardStartOffset;
                const yardEnd = sX + station.yardEndOffset;
                
                const currLanes = station.p <= 4 ? 2 : 3;
                const mTop = getLaneMultiplier(-1, currLanes);
                const mMid = getLaneMultiplier(0, currLanes);
                const mBot = getLaneMultiplier(1, currLanes);

                return (
                  <g key={station.id}>
                    {/* Mainlines running straight through yard */}
                    <TrackLine x1={yardStart} y1={CENTER_Y + station.yOffset + mTop * TRACK_GAP} x2={yardEnd} y2={CENTER_Y + station.yOffset + mTop * TRACK_GAP} />
                    {currLanes === 3 && (
                      <TrackLine x1={yardStart} y1={CENTER_Y + station.yOffset + mMid * TRACK_GAP} x2={yardEnd} y2={CENTER_Y + station.yOffset + mMid * TRACK_GAP} />
                    )}
                    <TrackLine x1={yardStart} y1={CENTER_Y + station.yOffset + mBot * TRACK_GAP} x2={yardEnd} y2={CENTER_Y + station.yOffset + mBot * TRACK_GAP} />

                    {/* Inter-station S-Curves */}
                    {i < STATIONS.length - 1 && (() => {
                      const nextStation = STATIONS[i+1];
                      const nextSX = sX + STATION_SPACING;
                      const nextYardStart = nextSX + nextStation.yardStartOffset;
                      
                      const nextLanes = nextStation.p <= 4 ? 2 : 3;
                      const nTop = getLaneMultiplier(-1, nextLanes);
                      const nMid = getLaneMultiplier(0, nextLanes);
                      const nBot = getLaneMultiplier(1, nextLanes);
                      
                      return (
                        <>
                          <TrackCurve d={drawThroat(yardEnd, CENTER_Y + station.yOffset + mTop * TRACK_GAP, nextYardStart, CENTER_Y + nextStation.yOffset + nTop * TRACK_GAP)} />
                          <TrackCurve d={drawThroat(yardEnd, CENTER_Y + station.yOffset + mMid * TRACK_GAP, nextYardStart, CENTER_Y + nextStation.yOffset + nMid * TRACK_GAP)} />
                          <TrackCurve d={drawThroat(yardEnd, CENTER_Y + station.yOffset + mBot * TRACK_GAP, nextYardStart, CENTER_Y + nextStation.yOffset + nBot * TRACK_GAP)} />
                        </>
                      );
                    })()}

                    {/* Explicit Crossovers specifically at MMNK */}
                    {station.id === 'MMNK' && station.p <= 4 && (
                      <>
                        <TrackCurve d={drawThroat(sX - 450, CENTER_Y + station.yOffset - TRACK_GAP/2, sX - 300, CENTER_Y + station.yOffset + TRACK_GAP/2)} />
                        <TrackCurve d={drawThroat(sX - 450, CENTER_Y + station.yOffset + TRACK_GAP/2, sX - 300, CENTER_Y + station.yOffset - TRACK_GAP/2)} />
                      </>
                    )}

                    {/* Highly Polished Station Zone Box */}
                    <rect x={sX - 250} y={station.platforms[0].y - 40} width={500} height={(station.p * TRACK_GAP) + 60} fill="rgba(15, 23, 42, 0.4)" stroke="#1e293b" strokeWidth="1" rx="8" />
                    <text x={sX} y={station.platforms[0].y - 55} fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="600" className="uppercase font-sans">
                      <tspan fill="#3b82f6">[{station.id}]</tspan> {station.name}
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
                              <TrackCurve d={drawThroat(divergeStart, mainLineY, sZoneStart, py)} />
                              <TrackLine x1={sZoneStart} y1={py} x2={sZoneEnd} y2={py} />
                              <TrackCurve d={drawThroat(sZoneEnd, py, convergeEnd, mainLineY)} />
                            </>
                          )}

                          {pIndex < station.p - 1 && (
                            <rect 
                              x={sZoneStart + 20} 
                              y={py + 10} 
                              width={Math.max(20, sZoneEnd - sZoneStart - 40)} 
                              height={4} 
                              fill="#334155" 
                              rx="2"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Live Trains */}
              {trains.map((train) => {
                const y = getTrainY(train, train.x);
                
                // Calculate dynamic tangent angle for realistic turning
                const dx = train.direction * 3; // Look slightly ahead for smoother angle
                const nextY = getTrainY(train, train.x + dx);
                const dy = nextY - y;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                const color = train.type === 'express' ? '#3b82f6' : (train.type === 'passenger' ? '#eab308' : '#f97316');
                return (
                  <g key={train.id} style={{ transform: `translate(${train.x}px, ${y}px) rotate(${angle}deg)` }}>
                    <polygon points="-8,-4 8,0 -8,4 -4,0" fill={color} style={{ filter: `drop-shadow(0px 0px 4px ${color})` }} />
                    {/* Counter-rotate the text so it always stays perfectly upright and readable */}
                    <text x="0" y="-12" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontWeight="600" style={{ transform: `rotate(${-angle}deg)` }} className="font-mono">
                      {train.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
