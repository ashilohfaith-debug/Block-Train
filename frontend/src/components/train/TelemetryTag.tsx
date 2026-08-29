import React, { memo } from 'react';

export const TelemetryTag = memo(({ id, angle }: { id: string, angle: number }) => (
  <g style={{ transform: `rotate(${-angle}deg)` }} className="opacity-0 group-hover:opacity-100 transition-opacity">
    <rect x="-30" y="-35" width="60" height="24" fill="#1f2937" rx="4" stroke="#4b5563" strokeWidth="1" />
    <text x="0" y="-23" fill="#e5e7eb" fontSize="10" textAnchor="middle" fontWeight="700" className="font-mono tracking-widest">
      {id}
    </text>
  </g>
));
