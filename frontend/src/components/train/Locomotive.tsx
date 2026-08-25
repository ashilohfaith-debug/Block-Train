import React from 'react';

export const Locomotive = ({ length, width, gradient }: { length: number, width: number, gradient: string }) => (
  <>
    <rect x={-length} y={-width/2} width={length} height={width} fill={gradient} rx="3" />
    <rect x={-length + 4} y={-width/2 + 2} width={6} height={width - 4} fill="#1f2937" opacity="0.6" />
  </>
);
