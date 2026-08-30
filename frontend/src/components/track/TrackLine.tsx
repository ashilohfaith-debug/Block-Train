import React, { useState } from 'react';

const Segment = ({ x1, y1, x2, y2, opacity, interactive, onClick, isBlocked }: any) => {
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
      
      {/* If blocked, use hazard striped pattern */}
      {isBlocked ? (
        <>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#facc15" strokeWidth="16" opacity="0.9" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000000" strokeWidth="16" strokeDasharray="10 10" />
        </>
      ) : (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#ef4444" : "#111827"} strokeWidth="16" opacity={isHovered ? "0.8" : "0.6"} className={isHovered ? "animate-pulse" : ""} />
      )}
      
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#991b1b" : "#374151"} strokeWidth="10" strokeDasharray="3 9" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHovered ? "#fca5a5" : "#9ca3af"} strokeWidth="6" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#070B12" strokeWidth="3" />
    </g>
  );
};

export const TrackLine = React.memo(({ x1, y1, x2, y2, opacity = 1, interactive, onClick, isBlocked }: { x1: number, y1: number, x2: number, y2: number, opacity?: number, interactive?: boolean, onClick?: (segmentId?: number) => void, isBlocked?: boolean | ((sId: number) => boolean) }) => {
  if (y1 === y2 && Math.abs(x2 - x1) > 200) {
    const segments = [];
    const chunkLen = 150;
    const totalLen = Math.abs(x2 - x1);
    const numChunks = Math.ceil(totalLen / chunkLen);
    const dir = x2 > x1 ? 1 : -1;
    const actualChunkLen = totalLen / numChunks;
    
    for (let i = 0; i < numChunks; i++) {
      const segId = i + 1;
      const segX1 = x1 + (i * actualChunkLen * dir);
      const segX2 = x1 + ((i + 1) * actualChunkLen * dir);
      const blocked = typeof isBlocked === 'function' ? isBlocked(segId) : isBlocked;
      
      segments.push(
        <Segment 
          key={i} 
          x1={segX1} y1={y1} x2={segX2} y2={y2} 
          opacity={opacity} 
          interactive={interactive} 
          onClick={() => onClick && onClick(segId)} 
          isBlocked={blocked}
        />
      );
    }
    return <>{segments}</>;
  }

  const blocked = typeof isBlocked === 'function' ? isBlocked(1) : isBlocked;
  return <Segment x1={x1} y1={y1} x2={x2} y2={y2} opacity={opacity} interactive={interactive} onClick={() => onClick && onClick(1)} isBlocked={blocked} />;
});

TrackLine.displayName = 'TrackLine';
