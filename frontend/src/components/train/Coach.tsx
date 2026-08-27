import React from 'react';

export const Coach = ({ x, length, width, gradient, isFreight, gap }: { x: number, length: number, width: number, gradient: string, isFreight: boolean, gap: number }) => (
  <g>
    {/* Coupler */}
    <rect x={x + length} y={-2} width={gap} height={4} fill="#374151" />
    {/* Coach Body */}
    <rect x={x} y={-width/2} width={length} height={width} fill={gradient} rx="2" />
    
    {/* Roof Details */}
    {!isFreight && (
      <rect x={x + 2} y={-1} width={length - 4} height={2} fill="#1f2937" opacity="0.5" />
    )}
    {isFreight && (
      <>
        <line x1={x + 2} y1={-width/2 + 2} x2={x + length - 2} y2={-width/2 + 2} stroke="#070B12" strokeWidth="1" opacity="0.3" />
        <line x1={x + 2} y1={width/2 - 2} x2={x + length - 2} y2={width/2 - 2} stroke="#070B12" strokeWidth="1" opacity="0.3" />
      </>
    )}
  </g>
);
