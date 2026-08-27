import React from 'react';

export const Locomotive = ({ x, length, width, gradient }: { x: number, length: number, width: number, gradient: string }) => {
  const frontX = x + length;
  return (
    <g>
      {/* Main Engine Body */}
      <rect x={x} y={-width/2} width={length} height={width} fill={gradient} rx="2" />
      
      {/* Engine Detail lines */}
      <line x1={x + 2} y1={-width/2 + 1} x2={frontX - 6} y2={-width/2 + 1} stroke="#070B12" strokeWidth="0.5" opacity="0.4" />
      <line x1={x + 2} y1={width/2 - 1} x2={frontX - 6} y2={width/2 - 1} stroke="#070B12" strokeWidth="0.5" opacity="0.4" />
      <rect x={x + 3} y={-1} width={length - 10} height={2} fill="#070B12" opacity="0.3" />

      {/* Driver Cab Roof */}
      <rect x={frontX - 7} y={-width/2 + 0.5} width={5} height={width - 1} fill="#111827" opacity="0.9" rx="1" />
      
      {/* Windshield (Cyan Tint) */}
      <rect x={frontX - 2} y={-width/2 + 1.5} width={1.5} height={width - 3} fill="#a5f3fc" opacity="0.8" />
    </g>
  );
};
