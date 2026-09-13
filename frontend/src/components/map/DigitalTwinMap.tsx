import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { StaticInfrastructure } from '../track/StaticInfrastructure';
import { LiveTrains } from '../train/LiveTrains';
import { useMaintenanceStore } from '../../lib/store';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STATIONS } from '../../lib/stations';
import { STATION_SPACING } from '../../lib/constants';

export const DigitalTwinMap = React.memo(({ speedMultiplier = 1, hideTrains = false, interactive = false, onTrackClick }: { speedMultiplier?: number, hideTrains?: boolean, interactive?: boolean, onTrackClick?: (id: string) => void }) => {
  const blocks = useMaintenanceStore((state) => state.activeBlocks);
  const fetchBlocks = useMaintenanceStore((state) => state.fetchBlocks);
  const activeBlocks = React.useMemo(() => blocks.map(b => b.id), [blocks]);
  
  const transformRef = React.useRef<any>(null);
  const [currentStationIdx, setCurrentStationIdx] = React.useState(0);

  React.useEffect(() => {
    useMaintenanceStore.getState().hydrate();
    fetchBlocks();
    const interval = setInterval(() => {
      fetchBlocks();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchBlocks]);

  const jumpToStation = (stationIndex: number) => {
    if (!transformRef.current) return;
    const targetX = 600 + stationIndex * STATION_SPACING;
    const st = STATIONS[stationIndex];
    const targetY = 800 + (st ? st.yOffset : 0);
    const windowW = typeof window !== 'undefined' ? window.innerWidth : 1400;
    const windowH = typeof window !== 'undefined' ? window.innerHeight : 900;
    const scale = 1.2;
    const newX = (windowW / 2) - (targetX * scale);
    const newY = (windowH / 2) - (targetY * scale);
    transformRef.current.setTransform(newX, newY, scale, 450);
  };

  // Focus perfectly on the first terminal station (Chennai Beach) on load
  const startX = -350;
  const startY = -600;
  const initialScale = 1.2;

  return (
    <div className="w-full h-screen bg-[#070B12] overflow-hidden relative selection:bg-blue-500/30">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(59,130,246,0.05),rgba(255,255,255,0))] pointer-events-none" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20" 
        style={{ backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)', backgroundSize: '100px 100px' }}
      />

      {/* 
        CRITICAL: We CANNOT use wheelPanning=true here in Next.js 15+ without causing TS errors,
        so we strictly rely on the standard click-to-pan mechanics.
        Do NOT lift train physics state above this wrapper, or panning will lag massively.
      */}
      <TransformWrapper
        ref={transformRef}
        initialScale={initialScale}
        initialPositionX={startX}
        initialPositionY={startY}
        minScale={0.1}
        maxScale={4}
        limitToBounds={false}
        centerOnInit={false}
      >
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
            <svg
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="will-change-transform drop-shadow-2xl"
              style={{ background: 'transparent' }}
            >
              {/* Defs for extremely bright neon re-usable SVG elements */}
              <defs>
                {/* Neon Red/Orange for ALL trains now */}
                <linearGradient id="train-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff0844" />
                  <stop offset="100%" stopColor="#ff4e50" />
                </linearGradient>
                <linearGradient id="express-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff0844" />
                  <stop offset="100%" stopColor="#ea69ff" />
                </linearGradient>
                <linearGradient id="freight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f9d423" />
                  <stop offset="100%" stopColor="#ff4e50" />
                </linearGradient>

                {/* Glow Filters */}
                <filter id="glow-passenger" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-express" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-freight" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                {/* Headlight beam gradient */}
                <linearGradient id="headlight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="50%" stopColor="#fef08a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <StaticInfrastructure interactive={interactive} onTrackClick={onTrackClick} blockedBlocks={activeBlocks} />
              {!hideTrains && <LiveTrains speedMultiplier={speedMultiplier} />}
            </svg>
          </TransformComponent>
        </div>
      </TransformWrapper>

      {/* Floating Station Quick-Jump Navigator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#111827]/95 px-4 py-2.5 rounded-2xl border border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider hidden md:flex">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Station:
        </div>
        <select
          value={currentStationIdx}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setCurrentStationIdx(idx);
            jumpToStation(idx);
          }}
          className="bg-gray-900 text-gray-100 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
        >
          {STATIONS.map((st, i) => (
            <option key={st.id} value={i}>
              {i + 1}. {st.id} — {st.name} ({st.p} Tracks)
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            onClick={() => {
              const newIdx = Math.max(0, currentStationIdx - 1);
              setCurrentStationIdx(newIdx);
              jumpToStation(newIdx);
            }}
            disabled={currentStationIdx === 0}
            className="px-2.5 py-1 text-xs font-mono rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-200 transition-colors"
            title="Previous Station"
          >
            &larr; Prev
          </button>
          <button
            onClick={() => {
              const newIdx = Math.min(STATIONS.length - 1, currentStationIdx + 1);
              setCurrentStationIdx(newIdx);
              jumpToStation(newIdx);
            }}
            disabled={currentStationIdx === STATIONS.length - 1}
            className="px-2.5 py-1 text-xs font-mono rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-200 transition-colors"
            title="Next Station"
          >
            Next &rarr;
          </button>
        </div>
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2 hidden sm:flex">
          <button
            onClick={() => transformRef.current?.zoomIn()}
            className="w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => transformRef.current?.zoomOut()}
            className="w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={() => jumpToStation(currentStationIdx)}
            className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900 transition-colors"
            title="Recenter Station"
          >
            Center
          </button>
        </div>
      </div>
    </div>
  );
});

DigitalTwinMap.displayName = 'DigitalTwinMap';
