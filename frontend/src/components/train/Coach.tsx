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
  const isEMU = type === 'passenger' && !isFreight;

  // Authentic Livery Colors
  const bodyFill = isFreight 
    ? '#1e293b' // Dark gunmetal industrial steel
    : isExpress 
    ? '#b91c1c' // LHB Crimson Red (Indian Railways Rajdhani/Superfast)
    : '#cbd5e1'; // Stainless Steel Suburban EMU

  return (
    <g className="coach-assembly">
      {/* 1. Bogie Trucks & Steel Wheelsets */}
      <rect x={x + 3} y={-width/2 - 2} width={6} height={1.5} fill="#0f172a" rx="0.5" />
      <rect x={x + 3} y={width/2 + 0.5} width={6} height={1.5} fill="#0f172a" rx="0.5" />
      <rect x={x + length - 9} y={-width/2 - 2} width={6} height={1.5} fill="#0f172a" rx="0.5" />
      <rect x={x + length - 9} y={width/2 + 0.5} width={6} height={1.5} fill="#0f172a" rx="0.5" />

      {/* 2. Coupler & Vestibule Gangway (towards front) */}
      <rect x={x + length} y={-2} width={gap} height={4} fill="#1f2937" rx="0.5" />
      {!isFreight && (
        <rect x={x + length} y={-width/2 + 2} width={gap * 0.8} height={width - 4} fill="#111827" opacity="0.85" rx="1" />
      )}

      {/* 3. Main Coach Body */}
      <rect 
        x={x} 
        y={-width/2} 
        width={length} 
        height={width} 
        fill={bodyFill} 
        rx="2" 
        stroke="#1e293b" 
        strokeWidth="0.5" 
      />

      {/* 4. Express LHB Coach Detailing */}
      {isExpress && (
        <>
          {/* Silver Roof & Window Band */}
          <rect x={x} y={-width/2 + 1} width={length} height={width - 2} fill="#991b1b" />
          <rect x={x + 2} y={-width/2 + 2.5} width={length - 4} height={width - 5} fill="#0f172a" opacity="0.6" rx="1" />
          
          {/* Warm Interior AC Windows Glow */}
          {Array.from({ length: 4 }).map((_, wIdx) => {
            const wX = x + 4 + wIdx * 7.5;
            return (
              <rect 
                key={`win-${wIdx}`} 
                x={wX} 
                y={-width/2 + 2.5} 
                width={5.5} 
                height={width - 5} 
                fill="#fef08a" 
                opacity="0.75" 
                rx="0.5" 
              />
            );
          })}

          {/* Longitudinal Stainless Steel Corrugated Roof Ribs */}
          <line x1={x + 2} y1={-1.5} x2={x + length - 2} y2={-1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.7" />
          <line x1={x + 2} y1={1.5} x2={x + length - 2} y2={1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.7" />
        </>
      )}

      {/* 5. Freight Tanker / Auto Wagon Detailing */}
      {isFreight && (
        <>
          {/* Cylindrical Tank Body Contours */}
          <rect x={x + 2} y={-width/2 + 1.5} width={length - 4} height={width - 3} fill="#334155" rx="3" />
          {/* Dome Manhole Cover */}
          <circle cx={x + length/2} cy={0} r="2.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.5" />
          {/* Structural Strengthening Ribs */}
          <line x1={x + 6} y1={-width/2 + 1.5} x2={x + 6} y2={width/2 - 1.5} stroke="#0f172a" strokeWidth="0.8" opacity="0.6" />
          <line x1={x + length - 6} y1={-width/2 + 1.5} x2={x + length - 6} y2={width/2 - 1.5} stroke="#0f172a" strokeWidth="0.8" opacity="0.6" />
          {/* Hazmat Warning Badge */}
          <polygon points={`${x + length/2 - 2},-2 ${x + length/2 + 2},-2 ${x + length/2},1.5`} fill="#ef4444" />
        </>
      )}

      {/* 6. Suburban EMU Local Detailing */}
      {isEMU && (
        <>
          {/* Emerald Green Transit Band */}
          <rect x={x + 1} y={-1.5} width={length - 2} height={3} fill="#10b981" opacity="0.9" />
          
          {/* 3 Passenger Doorways per coach */}
          <rect x={x + 4} y={-width/2 + 0.5} width={3.5} height={width - 1} fill="#1e293b" opacity="0.8" />
          <rect x={x + length/2 - 1.7} y={-width/2 + 0.5} width={3.5} height={width - 1} fill="#1e293b" opacity="0.8" />
          <rect x={x + length - 7.5} y={-width/2 + 0.5} width={3.5} height={width - 1} fill="#1e293b" opacity="0.8" />

          {/* Doorway Yellow Handrails */}
          <line x1={x + 5.7} y1={-width/2 + 1} x2={x + 5.7} y2={width/2 - 1} stroke="#facc15" strokeWidth="0.6" />
          <line x1={x + length/2} y1={-width/2 + 1} x2={x + length/2} y2={width/2 - 1} stroke="#facc15" strokeWidth="0.6" />
          <line x1={x + length - 5.7} y1={-width/2 + 1} x2={x + length - 5.7} y2={width/2 - 1} stroke="#facc15" strokeWidth="0.6" />
        </>
      )}

      {/* 7. Last Vehicle (LV) Board & Flashing Red Tail LED on rear coach */}
      {isLastCoach && (
        <g className="eot-device">
          {/* Circular Yellow LV Board (Rule 4.16) */}
          <circle cx={x - 1} cy={-2} r="2.5" fill="#facc15" stroke="#000000" strokeWidth="0.4" />
          <text 
            x={x - 1} 
            y={-0.8} 
            fontSize="2.5" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#000000" 
            fontFamily="sans-serif"
          >
            LV
          </text>

          {/* Blinking Red LED Tail Lamp */}
          <circle cx={x - 1} cy={2.5} r="1.5" fill="#ef4444" className="animate-ping" opacity="0.75" />
          <circle cx={x - 1} cy={2.5} r="1.2" fill="#dc2626" />
          <circle cx={x - 1} cy={2.5} r="0.6" fill="#fecaca" />
        </g>
      )}
    </g>
  );
});

Coach.displayName = 'Coach';
