import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { StaticInfrastructure } from '../track/StaticInfrastructure';
import { LiveTrains } from '../train/LiveTrains';
import { Train } from '../../lib/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../lib/stations';

export const DigitalTwinMap = ({ trains }: { trains: Train[] }) => {
  // Focus perfectly on the first major station (Chengalpattu) on load
  const startX = -600;
  const startY = -400;

  return (
    <TransformWrapper
      key="map-wrapper-v5" 
      initialScale={1.5}   
      initialPositionX={startX}
      initialPositionY={startY}
      minScale={0.4}
      maxScale={5}
      limitToBounds={true}
      wheel={{ step: 0.1 }}
      panning={{ velocityDisabled: true, wheelPanning: true }}
    >
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          
          {/* Premium Technical Grid */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)', 
              backgroundSize: '100px 100px', 
              width: CANVAS_WIDTH 
            }} 
          />
          {/* Center Axis Highlight */}
          <div className="absolute top-[800px] left-0 w-full h-[1px] bg-blue-500/10 pointer-events-none" />
          
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block drop-shadow-sm">
            <defs>
              <linearGradient id="headlight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="metal-express" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <linearGradient id="metal-passenger" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
              <linearGradient id="metal-freight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="50%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#1f2937" />
              </linearGradient>
            </defs>
            
            <StaticInfrastructure />
            <LiveTrains trains={trains} />
          </svg>
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
};
