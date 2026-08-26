import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { StaticInfrastructure } from '../track/StaticInfrastructure';
import { LiveTrains } from '../train/LiveTrains';
import { Train } from '../../lib/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../lib/stations';

export const DigitalTwinMap = React.memo(({ speedMultiplier = 1, hideTrains = false }: { speedMultiplier?: number, hideTrains?: boolean }) => {
  // Focus perfectly on the first major station (Tambaram) on load
  const startX = -600;
  const startY = -400;
  const initialScale = 0.8;

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
              {/* Defs for re-usable SVG elements */}
              <defs>
                <linearGradient id="train-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="express-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <linearGradient id="freight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              
              <StaticInfrastructure />
              {!hideTrains && <LiveTrains speedMultiplier={speedMultiplier} />}
            </svg>
          </TransformComponent>
        </div>
      </TransformWrapper>
    </div>
  );
});
