import React, { useState } from 'react';

export const TrackCurve = React.memo(({ d, opacity = 1, interactive, onClick }: { d: string, opacity?: number, interactive?: boolean, onClick?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g 
      opacity={opacity}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={() => interactive && onClick && onClick()}
      className={interactive ? "cursor-pointer transition-colors duration-200" : ""}
    >
      {interactive && <path d={d} fill="none" stroke="transparent" strokeWidth="24" className="pointer-events-auto" />}
      <path d={d} fill="none" stroke={isHovered ? "#ef4444" : "#111827"} strokeWidth="12" opacity={isHovered ? "0.8" : "0.6"} className={isHovered ? "animate-pulse" : ""} />
      <path d={d} fill="none" stroke={isHovered ? "#991b1b" : "#374151"} strokeWidth="8" strokeDasharray="3 9" />
      <path d={d} fill="none" stroke={isHovered ? "#fca5a5" : "#9ca3af"} strokeWidth="4" />
      <path d={d} fill="none" stroke="#070B12" strokeWidth="2" />
    </g>
  );
});
TrackCurve.displayName = 'TrackCurve';
