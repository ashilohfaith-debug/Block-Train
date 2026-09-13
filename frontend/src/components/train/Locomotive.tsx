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
  const isEMU = type === 'passenger';

  // Base locomotive colors based on authentic IR classes
  const bodyFill = isExpress 
    ? '#f8fafc' // WAP-7 Off-White/Platinum
    : isFreight 
    ? '#15803d' // WAG-9 Indian Railways Forest Green
    : '#e2e8f0'; // Stainless Steel EMU

  const stripeFill = isExpress 
    ? '#dc2626' // Crimson Red band (WAP-7 Royapuram livery)
    : isFreight 
    ? '#eab308' // Tiger Yellow Hazard stripe
    : '#10b981'; // Emerald Green Suburban line stripe

  return (
    <g className="locomotive-assembly">
      {/* 1. Bogie Trucks & Wheelsets under frame */}
      <rect x={x + 3} y={-width/2 - 2.5} width={7} height={1.5} fill="#1e293b" rx="0.5" />
      <rect x={x + 3} y={width/2 + 1} width={7} height={1.5} fill="#1e293b" rx="0.5" />
      <rect x={frontX - 10} y={-width/2 - 2.5} width={7} height={1.5} fill="#1e293b" rx="0.5" />
      <rect x={frontX - 10} y={width/2 + 1} width={7} height={1.5} fill="#1e293b" rx="0.5" />

      {/* 2. Main Locomotive Chassis / Underframe */}
      <rect x={x} y={-width/2} width={length} height={width} fill={bodyFill} rx="2" stroke="#334155" strokeWidth="0.6" />

      {/* 3. Authentic Indian Railways Livery Bands */}
      {/* Central Longitudinal Cheatlines */}
      <rect x={x + 1} y={-1.5} width={length - 2} height={3} fill={stripeFill} opacity="0.9" />
      {isExpress && (
        <>
          <rect x={x + 1} y={-width/2 + 1} width={length - 4} height={1} fill="#1e3a8a" opacity="0.8" />
          <rect x={x + 1} y={width/2 - 2} width={length - 4} height={1} fill="#1e3a8a" opacity="0.8" />
        </>
      )}

      {/* 4. Roof Equipment (25kV AC Traction Gear & Pantographs) */}
      {/* Roof Center Walkway & Ventilation Louvers */}
      <rect x={x + 5} y={-2} width={length - 14} height={4} fill="#0f172a" opacity="0.4" rx="1" />
      
      {/* Rear Pantograph (Folded or Active) */}
      <g className="pantograph-rear">
        <rect x={x + 4} y={-3.5} width={5} height={7} fill="none" stroke="#94a3b8" strokeWidth="0.8" />
        <line x1={x + 4} y1={-3.5} x2={x + 9} y2={3.5} stroke="#cbd5e1" strokeWidth="0.7" />
        <line x1={x + 4} y1={3.5} x2={x + 9} y2={-3.5} stroke="#cbd5e1" strokeWidth="0.7" />
        {/* Copper Contact Shoe */}
        <line x1={x + 6} y1={-4.5} x2={x + 7} y2={4.5} stroke="#f59e0b" strokeWidth="1.2" />
      </g>

      {/* Front Pantograph */}
      <g className="pantograph-front">
        <rect x={frontX - 11} y={-3.5} width={5} height={7} fill="none" stroke="#94a3b8" strokeWidth="0.8" />
        <line x1={frontX - 11} y1={-3.5} x2={frontX - 6} y2={3.5} stroke="#cbd5e1" strokeWidth="0.7" />
        <line x1={frontX - 11} y1={3.5} x2={frontX - 6} y2={-3.5} stroke="#cbd5e1" strokeWidth="0.7" />
        {/* Copper Contact Shoe */}
        <line x1={frontX - 9} y1={-4.5} x2={frontX - 8} y2={4.5} stroke="#f59e0b" strokeWidth="1.2" />
      </g>

      {/* High-Voltage Roof Insulators & Transformer Casing */}
      <circle cx={x + 12} cy={-2} r="1" fill="#dc2626" opacity="0.8" />
      <circle cx={x + 15} cy={-2} r="1" fill="#dc2626" opacity="0.8" />
      <line x1={x + 12} y1={-2} x2={frontX - 11} y2={-2} stroke="#f59e0b" strokeWidth="0.6" />

      {/* 5. Driver Cab Roof & Sloped Aero Hood */}
      <rect x={frontX - 7} y={-width/2 + 0.5} width={6} height={width - 1} fill="#0f172a" opacity="0.85" rx="1.5" />

      {/* 6. Driver Windshield (Tinted Cyan Solar Glass) */}
      <rect x={frontX - 2.5} y={-width/2 + 1.5} width={1.8} height={width - 3} fill="#67e8f9" opacity="0.9" rx="0.5" />
      {/* Center Windshield Divider & Wipers */}
      <line x1={frontX - 2.5} y1={0} x2={frontX - 0.7} y2={0} stroke="#0f172a" strokeWidth="0.8" />

      {/* 7. Front Pilot Beam, Cowcatcher & Warning Chevrons */}
      <rect x={frontX} y={-width/2 + 1} width={1.5} height={width - 2} fill="#ef4444" />
      {/* Central Buffer Coupler (CBC) */}
      <rect x={frontX + 1.2} y={-1.5} width={2.5} height={3} fill="#475569" rx="0.5" />
      {/* Side Buffers */}
      <rect x={frontX + 1} y={-width/2 + 2} width={1.2} height={2} fill="#334155" />
      <rect x={frontX + 1} y={width/2 - 4} width={1.2} height={2} fill="#334155" />

      {/* Freight specific: Tiger stripes on pilot beam */}
      {isFreight && (
        <>
          <line x1={frontX} y1={-4} x2={frontX + 1.2} y2={-2} stroke="#facc15" strokeWidth="0.8" />
          <line x1={frontX} y1={-1} x2={frontX + 1.2} y2={1} stroke="#facc15" strokeWidth="0.8" />
          <line x1={frontX} y1={2} x2={frontX + 1.2} y2={4} stroke="#facc15" strokeWidth="0.8" />
        </>
      )}

      {/* EMU specific: Digital Destination Board above cab */}
      {isEMU && (
        <rect x={frontX - 4} y={-2} width={2.5} height={4} fill="#0284c7" opacity="0.9" />
      )}
    </g>
  );
});

Locomotive.displayName = 'Locomotive';
