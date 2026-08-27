import React, { useState } from 'react';

export const TrackLine = React.memo(({ x1, y1, x2, y2, opacity = 1, interactive, onClick }: { x1: number, y1: number, x2: number, y2: number, opacity?: number, interactive?: boolean, onClick?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g 
      opacity={opacity}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={() => interactive && onClick && onClick()}
      className={interactive ? "cursor-pointer transition-colors duration-200" : ""}
    >
      {interactive && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="24" className="pointer-events-auto" />}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#ef4444" : "#111827"} strokeWidth="12" opacity={isHovered ? "0.8" : "0.6"} className={isHovered ? "animate-pulse" : ""} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#991b1b" : "#374151"} strokeWidth="8" strokeDasharray="3 9" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#fca5a5" : "#9ca3af"} strokeWidth="4" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#070B12" strokeWidth="2" />
    </g>
  );
});
TrackLine.displayName = 'TrackLine';
