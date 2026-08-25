'use client';
import React, { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const STATION_SPACING = 2400;
const CENTER_Y = 800;
const TRACK_GAP = 64;

// Predictable pseudo-random generator to guarantee trains and tracks use the exact same chaos
const pseudoRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return (Math.abs(h) % 1000) / 1000;
};

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

// --- SCALING ENGINE CONFIGURATION ---
const TESTING_MODE = true;

const VISIBLE_STATIONS = TESTING_MODE 
  ? [RAW_STATIONS[0], RAW_STATIONS[6], RAW_STATIONS[14]] 
  : RAW_STATIONS;

const NUM_TRAINS = TESTING_MODE ? 3 : 30;
const SPEED_MULTIPLIER = TESTING_MODE ? 0.3 : 1.0;
// ------------------------------------

const generateTrains = () => {
  const trains = [];
  for (let i = 0; i < NUM_TRAINS; i++) {
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
      speed: (Math.random() * 1.5 + 1.0) * SPEED_MULTIPLIER, 
    });
  }
  return trains;
};

const getStationMainY = (station: any, effectiveLane: number) => {
  const pYs = [];
  const startY = CENTER_Y + station.yOffset - ((station.p - 1) * TRACK_GAP) / 2;
  for (let i = 0; i < station.p; i++) pYs.push(startY + i * TRACK_GAP);
  
  const numLanes = station.p <= 4 ? 2 : 3;
  let idxTop, idxMid, idxBot;
  if (numLanes === 3) {
    const third = Math.floor(station.p / 3);
    idxTop = Math.floor(third / 2);
    idxMid = third + Math.floor(third / 2);
    idxBot = third * 2 + Math.floor((station.p - third * 2) / 2);
  } else {
    const half = Math.floor(station.p / 2);
    idxTop = Math.floor(half / 2);
    idxMid = idxTop; 
    idxBot = half + Math.floor((station.p - half) / 2);
  }
  
  const yTop = pYs[idxTop];
  const yMid = pYs[idxMid];
  const yBot = pYs[idxBot];
  
  if (effectiveLane <= -1) return yTop;
  if (effectiveLane >= 1) return yBot;
  if (effectiveLane < 0) return yMid + (yTop - yMid) * Math.abs(effectiveLane);
  return yMid + (yBot - yMid) * effectiveLane;
};

// Pre-calculate highly organic, randomized platform architectures for every station
const STATIONS = VISIBLE_STATIONS.map(st => {
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
    
    const mainLineY = getStationMainY(st, laneId);
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
const CANVAS_HEIGHT = 1600;

const drawThroat = (startX: number, startY: number, endX: number, endY: number) => {
  const dx = Math.abs(endX - startX) / 2;
  const cp1x = startX + dx;
  const cp2x = endX - dx;
  return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
};

const TrackLine = React.memo(({ x1, y1, x2, y2, opacity = 1 }: any) => (
  <g opacity={opacity}>
    {/* Ballast / Track Bed */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth="12" opacity="0.6" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
    {/* Concrete Sleepers */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="8" strokeDasharray="3 9" />
    {/* Outer Rails (Silver) */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9ca3af" strokeWidth="4" />
    {/* Inner Hollow (Dark background color) */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#070B12" strokeWidth="2" />
  </g>
));

const TrackCurve = React.memo(({ d, opacity = 1 }: any) => (
  <g opacity={opacity}>
    <path d={d} stroke="#111827" strokeWidth="12" fill="transparent" opacity="0.6" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
    <path d={d} stroke="#374151" strokeWidth="8" strokeDasharray="3 9" fill="transparent" />
    <path d={d} stroke="#9ca3af" strokeWidth="4" fill="transparent" />
    <path d={d} stroke="#070B12" strokeWidth="2" fill="transparent" />
  </g>
));

const StaticInfrastructure = React.memo(() => {
  return (
    <>
      {STATIONS.map((station, i) => {
        const sX = 600 + i * STATION_SPACING;
        const yardStart = sX + station.yardStartOffset;
        const yardEnd = sX + station.yardEndOffset;
        
        const currLanes = station.p <= 4 ? 2 : 3;
        const mTop = getStationMainY(station, -1);
        const mMid = getStationMainY(station, 0);
        const mBot = getStationMainY(station, 1);

        return (
          <g key={station.id}>
            {/* Mainlines running straight through yard */}
            <TrackLine x1={yardStart} y1={mTop} x2={yardEnd} y2={mTop} />
            {currLanes === 3 && (
              <TrackLine x1={yardStart} y1={mMid} x2={yardEnd} y2={mMid} />
            )}
            <TrackLine x1={yardStart} y1={mBot} x2={yardEnd} y2={mBot} />

            {/* Inter-station S-Curves */}
            {i < STATIONS.length - 1 && (() => {
              const nextStation = STATIONS[i+1];
              const nextSX = sX + STATION_SPACING;
              const nextYardStart = nextSX + nextStation.yardStartOffset;
              
              const nextLanes = nextStation.p <= 4 ? 2 : 3;
              const nTop = getStationMainY(nextStation, -1);
              const nMid = getStationMainY(nextStation, 0);
              const nBot = getStationMainY(nextStation, 1);
              
              return (
                <>
                  <TrackCurve d={drawThroat(yardEnd, mTop, nextYardStart, nTop)} />
                  <TrackCurve d={drawThroat(yardEnd, mMid, nextYardStart, nMid)} />
                  <TrackCurve d={drawThroat(yardEnd, mBot, nextYardStart, nBot)} />
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
            <rect x={sX - 250} y={station.platforms[0].y - 45} width={500} height={(station.p * TRACK_GAP) + 70} fill="rgba(255, 255, 255, 0.05)" stroke="#374151" strokeWidth="1" rx="8" />
            
            {/* High-Tech Corner Accents */}
            <path d={`M ${sX - 250} ${station.platforms[0].y - 30} L ${sX - 250} ${station.platforms[0].y - 45} L ${sX - 235} ${station.platforms[0].y - 45}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" />
            <path d={`M ${sX + 250} ${station.platforms[0].y - 30} L ${sX + 250} ${station.platforms[0].y - 45} L ${sX + 235} ${station.platforms[0].y - 45}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" />
            <path d={`M ${sX - 250} ${station.platforms[station.p-1].y + 10} L ${sX - 250} ${station.platforms[station.p-1].y + 25} L ${sX - 235} ${station.platforms[station.p-1].y + 25}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" />
            <path d={`M ${sX + 250} ${station.platforms[station.p-1].y + 10} L ${sX + 250} ${station.platforms[station.p-1].y + 25} L ${sX + 235} ${station.platforms[station.p-1].y + 25}`} fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" />
            
            {/* Station Name Header Bar */}
            <rect x={sX - 100} y={station.platforms[0].y - 65} width={200} height={24} fill="#111827" stroke="#374151" strokeWidth="1" rx="12" />
            <text x={sX} y={station.platforms[0].y - 49} fill="#9ca3af" fontSize="10" textAnchor="middle" fontWeight="700" className="font-mono tracking-widest">
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
                      <TrackCurve d={drawThroat(divergeStart, mainLineY, sZoneStart, py)} />
                      <TrackLine x1={sZoneStart} y1={py} x2={sZoneEnd} y2={py} />
                      <TrackCurve d={drawThroat(sZoneEnd, py, convergeEnd, mainLineY)} />
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
                        />
                        {/* Yellow Safety Edge Lines */}
                        <line x1={pStartX} y1={py + 9} x2={pStartX + pWidth} y2={py + 9} stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
                        <line x1={pStartX} y1={py + 8 + (TRACK_GAP - 16) - 1} x2={pStartX + pWidth} y2={py + 8 + (TRACK_GAP - 16) - 1} stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
                        
                        {/* Platform Hatching Pattern Simulated */}
                        <rect 
                          x={pStartX + 4} 
                          y={py + 12} 
                          width={pWidth - 8} 
                          height={TRACK_GAP - 24} 
                          fill="rgba(55, 65, 81, 0.4)" 
                          rx="1"
                        />
                        {/* Platform Numbers */}
                        <text x={pStartX + pWidth/2} y={py + (TRACK_GAP / 2) + 2} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="700" className="font-mono">
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
      
      const mainY = getStationMainY(station, effectiveLane);

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
        const nextSX = sX + STATION_SPACING;
        const nextYardStart = nextSX + nextStation.yardStartOffset;
        
        if (x > yardEnd && x < nextYardStart) {
          const nextMainY = getStationMainY(nextStation, effectiveLane);
          const t = (x - yardEnd) / (nextYardStart - yardEnd);
          return mainY + (nextMainY - mainY) * ((1 - Math.cos(Math.PI * t)) / 2);
        }
      }
    }

    if (x <= 600 + STATIONS[0].yardStartOffset) {
      return getStationMainY(STATIONS[0], effectiveLane);
    }
    const lastStation = STATIONS[STATIONS.length - 1];
    return getStationMainY(lastStation, effectiveLane);
  };



  if (!mounted) return null;

  return (
    <div className="w-full h-screen bg-[#070B12] overflow-hidden relative font-sans">
      


      {/* INTERACTIVE MAP */}
      <TransformWrapper
        initialScale={0.5}
        minScale={0.5}
        maxScale={4}
        limitToBounds={true}
        wheel={{ activationKeys: ["Control"] }} // Ctrl+Wheel to zoom
        panOnScroll={true} // Trackpad / Scroll wheel to pan!
        panOnScrollSpeed={1.5}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            
            {/* Elegant Blueprint Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '40px 40px', width: CANVAS_WIDTH }} />
            
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block drop-shadow-sm">
              <defs>
                <linearGradient id="headlight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </linearGradient>
              </defs>
              <StaticInfrastructure />

              {/* Live Trains */}
              {trains.map((train) => {
                const y = getTrainY(train, train.x);
                
                // Calculate dynamic tangent angle for realistic turning
                const dx = train.direction * 3; // Look slightly ahead for smoother angle
                const nextY = getTrainY(train, train.x + dx);
                const dy = nextY - y;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                const isExpress = train.type === 'express';
                const isFreight = train.type === 'freight';
                const color = isExpress ? '#3b82f6' : (isFreight ? '#f97316' : '#eab308');
                const length = isFreight ? 60 : 45;
                const bodyWidth = 14;

                return (
                  <g key={train.id} style={{ transform: `translate(${train.x}px, ${y}px) rotate(${angle}deg)`, willChange: 'transform' }} className="cursor-pointer group">
                    {/* Headlight beam */}
                    {!isFreight && (
                      <polygon points={`10,-6 40,-12 40,12 10,6`} fill="url(#headlight-gradient)" opacity="0.4" />
                    )}
                    
                    {/* Ultra-Fast Fake Drop Shadow */}
                    <rect x={-length/2 + 2} y={-bodyWidth/2 + 3} width={length} height={bodyWidth} fill="#000000" opacity="0.4" rx="3" />

                    {/* Train Body Background */}
                    <rect x={-length/2} y={-bodyWidth/2} width={length} height={bodyWidth} fill={color} rx="3" />
                    
                    {/* Locomotive Details */}
                    <rect x={(length/2) - 8} y={-bodyWidth/2 + 1} width="6" height={bodyWidth - 2} fill="#1f2937" rx="1" /> {/* Windshield */}
                    <rect x={(length/2) - 2} y={-2} width="2" height="4" fill="#facc15" /> {/* Headlight LED */}
                    
                    {/* Coach Details (AC Units/Hatches) */}
                    {!isFreight && (
                      <>
                        <line x1={-length/2 + 4} y1="0" x2={(length/2) - 12} y2="0" stroke="#1f2937" strokeWidth="2" strokeDasharray="6 2" opacity="0.5" />
                      </>
                    )}
                    {isFreight && (
                      <>
                        {/* Freight container lines */}
                        <line x1={-length/2 + 2} y1={-bodyWidth/2 + 2} x2={(length/2) - 12} y2={-bodyWidth/2 + 2} stroke="#9a3412" strokeWidth="1" />
                        <line x1={-length/2 + 2} y1={bodyWidth/2 - 2} x2={(length/2) - 12} y2={bodyWidth/2 - 2} stroke="#9a3412" strokeWidth="1" />
                      </>
                    )}

                    {/* Counter-rotate the text so it always stays perfectly upright and readable */}
                    <g style={{ transform: `rotate(${-angle}deg)` }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <rect x="-30" y="-35" width="60" height="24" fill="#1f2937" rx="4" stroke="#4b5563" strokeWidth="1" />
                      <text x="0" y="-23" fill="#e5e7eb" fontSize="10" textAnchor="middle" fontWeight="700" className="font-mono tracking-widest">
                        {train.id}
                      </text>
                    </g>
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
