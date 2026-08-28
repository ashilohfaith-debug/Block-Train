import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { StaticInfrastructure } from '../track/StaticInfrastructure';
import { LiveTrains } from '../train/LiveTrains';
import { useMaintenanceStore } from '../../lib/store';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../lib/stations';

export const DigitalTwinMap = React.memo(({ speedMultiplier = 1, hideTrains = false, interactive = false, onTrackClick }: { speedMultiplier?: number, hideTrains?: boolean, interactive?: boolean, onTrackClick?: (id: string) => void }) => {
  const blocks = useMaintenanceStore((state) => state.activeBlocks);
  const activeBlocks = React.useMemo(() => blocks.map(b => b.id), [blocks]);
  // Focus perfectly on the first major station (Tambaram) on load
  const startX = -600;
  const startY = -600;
  const initialScale = 1.3;

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
                {/* Neon Cyan for Passenger */}
                <linearGradient id="train-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#4facfe" />
                </linearGradient>
                {/* Neon Magenta/Purple for Express */}
                <linearGradient id="express-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff0844" />
                  <stop offset="100%" stopColor="#ea69ff" />
                </linearGradient>
                {/* Neon Orange/Yellow for Freight */}
                <linearGradient id="freight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f9d423" />
                  <stop offset="100%" stopColor="#ff4e50" />
                </linearGradient>

                {/* Glow Filters */}
                <filter id="glow-passenger" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
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
    </div>
  );
});

DigitalTwinMap.displayName = 'DigitalTwinMap';
