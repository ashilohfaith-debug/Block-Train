import React, { useState } from 'react';

export const TrackCurve = React.memo(({ d, opacity = 1, interactive, onClick, isBlocked }: { d: string, opacity?: number, interactive?: boolean, onClick?: () => void, isBlocked?: boolean }) => {
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
      
      {isBlocked ? (
        <>
          <path d={d} fill="none" stroke="#facc15" strokeWidth="16" opacity="0.9" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          <path d={d} fill="none" stroke="#000000" strokeWidth="16" strokeDasharray="10 10" />
        </>
      ) : (
        <path d={d} fill="none" stroke={isHovered ? "#ef4444" : "#111827"} strokeWidth="16" opacity={isHovered ? "0.8" : "0.6"} className={isHovered ? "animate-pulse" : ""} />
      )}
      
      <path d={d} fill="none" stroke={isHovered ? "#991b1b" : "#374151"} strokeWidth="10" strokeDasharray="3 9" />
      <path d={d} fill="none" stroke={isHovered ? "#fca5a5" : "#9ca3af"} strokeWidth="6" />
      <path d={d} fill="none" stroke="#070B12" strokeWidth="3" />
    </g>
  );
});
TrackCurve.displayName = 'TrackCurve';
