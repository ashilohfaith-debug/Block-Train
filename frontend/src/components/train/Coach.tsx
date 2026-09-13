import React, { memo } from 'react';
import { TrainType } from '../../lib/types';

interface CoachProps {
  x: number;
  length: number;
  width: number;
  gradient?: string;
  isFreight: boolean;
  type?: TrainType;
  gap: number;
  isLastCoach?: boolean;
}

export const Coach = memo(({ 
  x, 
  length, 
  width, 
  isFreight, 
  type = 'passenger', 
  gap, 
  isLastCoach = false 
}: CoachProps) => {
  const isExpress = type === 'express';

  // Crisp, clean coach colors
  const bodyColor = isFreight 
    ? '#334155' // Slate industrial steel
    : isExpress 
    ? '#991b1b' // LHB Crimson Red
    : '#0284c7'; // Clean Suburban Blue

  const stripeColor = isFreight 
    ? '#eab308' 
    : isExpress 
    ? '#ffffff' 
    : '#10b981';

  return (
    <g className="coach-assembly">
      {/* 1. Bogie shadows under frame */}
      <rect x={x + 3} y={-width/2 - 1.2} width={5} height={1} fill="#0f172a" rx="0.4" />
      <rect x={x + 3} y={width/2 + 0.2} width={5} height={1} fill="#0f172a" rx="0.4" />
      <rect x={x + length - 8} y={-width/2 - 1.2} width={5} height={1} fill="#0f172a" rx="0.4" />
      <rect x={x + length - 8} y={width/2 + 0.2} width={5} height={1} fill="#0f172a" rx="0.4" />

      {/* 2. Coupler Gangway connection */}
      <rect x={x + length} y={-1.5} width={gap} height={3} fill="#1e293b" rx="0.5" />

      {/* 3. Main Coach Body */}
      <rect 
        x={x} 
        y={-width/2} 
        width={length} 
        height={width} 
        fill={bodyColor} 
        rx="2" 
        stroke="#0f172a" 
        strokeWidth="0.6" 
      />

      {/* 4. Clean Sleek Window & Accent Strip */}
      {!isFreight ? (
        <>
          <rect x={x + 2} y={-width/2 + 2} width={length - 4} height={width - 4} fill="#0f172a" opacity="0.4" rx="1" />
          <line x1={x + 2} y1={0} x2={x + length - 2} y2={0} stroke={stripeColor} strokeWidth="1.2" opacity="0.85" />
        </>
      ) : (
        <rect x={x + 2} y={-width/2 + 2} width={length - 4} height={width - 4} fill="#1e293b" rx="2" />
      )}

      {/* 5. Last Vehicle Marker on Rear Coach */}
      {isLastCoach && (
        <g className="eot-marker">
          <circle cx={x - 1} cy={0} r="2" fill="#ef4444" className="animate-pulse" />
          <circle cx={x - 1} cy={0} r="1" fill="#ffffff" />
        </g>
      )}
    </g>
  );
});

Coach.displayName = 'Coach';
