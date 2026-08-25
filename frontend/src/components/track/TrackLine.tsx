import React from 'react';

export const TrackLine = React.memo(({ x1, y1, x2, y2, opacity = 1 }: any) => (
  <g opacity={opacity}>
    {/* Ballast / Track Bed */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth="12" opacity="0.6" />
    {/* Concrete Sleepers */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="8" strokeDasharray="3 9" />
    {/* Outer Rails (Silver) */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9ca3af" strokeWidth="4" />
    {/* Inner Hollow (Dark background color) */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#070B12" strokeWidth="2" />
  </g>
));
