import React from 'react';

export const Headlight = ({ totalLen }: { totalLen: number }) => {
  const frontX = totalLen / 2;
  return (
    <g>
      {/* Headlight beam */}
      <polygon 
        points={`${frontX},-4 ${frontX + 60},-15 ${frontX + 60},15 ${frontX},4`} 
        fill="url(#headlight-gradient)" 
        opacity="0.8" 
      />
      {/* Headlight Bulbs */}
      <circle cx={frontX - 0.5} cy={-2} r="1" fill="#ffffff" />
      <circle cx={frontX - 0.5} cy={2} r="1" fill="#ffffff" />
    </g>
  );
};
