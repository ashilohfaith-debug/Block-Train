import React, { memo } from 'react';
import { TrainType } from '../../lib/types';

interface LocomotiveProps {
  x: number;
  length: number;
  width: number;
  gradient?: string;
  type?: TrainType;
}

export const Locomotive = memo(({ x, length, width, type = 'passenger' }: LocomotiveProps) => {
  const frontX = x + length;
  const isExpress = type === 'express';
  const isFreight = type === 'freight';

  // Crisp, clean Indian Railways livery colors
  const bodyColor = isExpress 
    ? '#dc2626' // Crimson Red (LHB / WAP-7)
    : isFreight 
    ? '#15803d' // Forest Green (WAG-9 Freight)
    : '#0284c7'; // Cyan/Navy Blue (Suburban EMU)

  const accentColor = isExpress 
    ? '#ffffff' // White band
    : isFreight 
    ? '#eab308' // Yellow hazard band
    : '#10b981'; // Green stripe

  return (
    <g className="locomotive-assembly">
      {/* 1. Wheels / Bogie shadows under frame */}
      <rect x={x + 3} y={-width/2 - 1.5} width={7} height={1.2} fill="#0f172a" rx="0.5" />
      <rect x={x + 3} y={width/2 + 0.3} width={7} height={1.2} fill="#0f172a" rx="0.5" />
      <rect x={frontX - 10} y={-width/2 - 1.5} width={7} height={1.2} fill="#0f172a" rx="0.5" />
      <rect x={frontX - 10} y={width/2 + 0.3} width={7} height={1.2} fill="#0f172a" rx="0.5" />

      {/* 2. Main Chassis Body */}
      <rect 
        x={x} 
        y={-width/2} 
        width={length} 
        height={width} 
        fill={bodyColor} 
        rx="2.5" 
        stroke="#0f172a" 
        strokeWidth="0.8" 
      />

      {/* 3. Clean Center Livery Band */}
      <rect x={x + 1} y={-1.5} width={length - 2} height={3} fill={accentColor} opacity="0.9" />

      {/* 4. Sleek Roof Center Line & Single Minimalist Pantograph */}
      <line x1={x + 5} y1={0} x2={frontX - 8} y2={0} stroke="#475569" strokeWidth="0.8" opacity="0.6" />
      <rect x={x + 5} y={-2} width={5} height={4} fill="none" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1={x + 7.5} y1={-3} x2={x + 7.5} y2={3} stroke="#f59e0b" strokeWidth="1" />

      {/* 5. Clean Driver Cab Windshield */}
      <rect 
        x={frontX - 3.5} 
        y={-width/2 + 2} 
        width={2.2} 
        height={width - 4} 
        fill="#38bdf8" 
        opacity="0.95" 
        rx="0.5" 
      />

      {/* 6. Front Coupler / Buffer */}
      <rect x={frontX} y={-1.5} width={2} height={3} fill="#1e293b" rx="0.5" />
    </g>
  );
});

Locomotive.displayName = 'Locomotive';
