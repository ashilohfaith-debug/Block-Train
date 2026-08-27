import React from 'react';

export const Headlight = ({ totalLen }: { totalLen: number }) => {
  const frontX = totalLen / 2;
  return (
    <g>
      {/* Headlight beam */}
      <polygon 
        points={`${frontX},-3 ${frontX + 40},-10 ${frontX + 40},10 ${frontX},3`} 
        fill="url(#headlight-gradient)" 
        opacity="0.8" 
      />
      {/* Headlight Bulbs */}
      <circle cx={frontX - 0.5} cy={-2} r="1" fill="#ffffff" />
      <circle cx={frontX - 0.5} cy={2} r="1" fill="#ffffff" />
    </g>
  );
};
