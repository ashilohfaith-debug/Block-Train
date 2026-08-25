import React from 'react';

export const Headlight = ({ totalLen }: { totalLen: number }) => (
  <>
    {/* Headlight beam */}
    <polygon points={`${totalLen/2},-6 ${totalLen/2 + 40},-12 ${totalLen/2 + 40},12 ${totalLen/2},6`} fill="url(#headlight-gradient)" opacity="0.4" />
    {/* Headlight LED */}
    <rect x={totalLen/2 - 1} y={-2} width={2} height={4} fill="#facc15" />
  </>
);
