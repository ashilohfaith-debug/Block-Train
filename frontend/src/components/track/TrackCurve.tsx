import React from 'react';

export const TrackCurve = React.memo(({ d, opacity = 1 }: any) => {
  // Matches "M x y ... L x y" to extract start and end coordinates for frogs
  const match = d.match(/^M ([\d.-]+) ([\d.-]+).*L ([\d.-]+) ([\d.-]+)$/);
  
  return (
    <g opacity={opacity}>
      <path d={d} stroke="#111827" strokeWidth="12" fill="transparent" opacity="0.6" />
      <path d={d} stroke="#374151" strokeWidth="8" strokeDasharray="3 9" fill="transparent" />
      <path d={d} stroke="#9ca3af" strokeWidth="4" fill="transparent" />
      <path d={d} stroke="#070B12" strokeWidth="2" fill="transparent" />
      
      {/* Switch Frogs (Yellow mechanical divergence points) */}
      {match && (
        <>
          <circle cx={match[1]} cy={match[2]} r="2.5" fill="#facc15" stroke="#070B12" strokeWidth="1.5" />
          <circle cx={match[3]} cy={match[4]} r="2.5" fill="#facc15" stroke="#070B12" strokeWidth="1.5" />
        </>
      )}
    </g>
  );
});
