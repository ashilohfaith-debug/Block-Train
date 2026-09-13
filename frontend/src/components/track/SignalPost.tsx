import React, { memo } from 'react';

export type SignalAspect = 'green' | 'double_yellow' | 'yellow' | 'red';

interface SignalPostProps {
  x: number;
  y: number;
  aspect: SignalAspect;
  name: string;
  direction?: number;
}

export const SignalPost = memo(({ x, y, aspect, name }: SignalPostProps) => {
  // 4-Aspect Color Light Signal in Indian Railways:
  // Top-to-bottom: Yellow 1, Green, Red, Yellow 2
  // Red: Danger (Halt)
  // Yellow 1 (Single Yellow): Caution (Be prepared to stop at next signal)
  // Double Yellow (Yellow 1 + Yellow 2): Attention (Next signal is at Caution)
  // Green: Clear (Proceed at MPS)

  const isRed = aspect === 'red';
  const isYellow = aspect === 'yellow';
  const isDoubleYellow = aspect === 'double_yellow';
  const isGreen = aspect === 'green';

  const lampY1 = y - 36; // Yellow 1
  const lampG  = y - 28; // Green
  const lampR  = y - 20; // Red
  const lampY2 = y - 12; // Yellow 2

  // Mast position
  const mastX = x;
  const postBaseY = y + 4;

  return (
    <g className="signal-post select-none pointer-events-none">
      {/* Ballast / Base Foundation */}
      <rect x={mastX - 4} y={postBaseY - 2} width={8} height={6} fill="#374151" rx="1" />
      <rect x={mastX - 3} y={postBaseY - 1} width={6} height={2} fill="#6b7280" />

      {/* Signal Post Tubular Mast */}
      <line x1={mastX} y1={postBaseY - 2} x2={mastX} y2={y - 42} stroke="#9ca3af" strokeWidth="2.5" />
      <line x1={mastX + 0.5} y1={postBaseY - 2} x2={mastX + 0.5} y2={y - 42} stroke="#e5e7eb" strokeWidth="0.8" opacity="0.6" />

      {/* Access Ladder Rungs */}
      <line x1={mastX - 2.5} y1={y - 6} x2={mastX + 2.5} y2={y - 6} stroke="#6b7280" strokeWidth="0.8" />
      <line x1={mastX - 2.5} y1={y - 14} x2={mastX + 2.5} y2={y - 14} stroke="#6b7280" strokeWidth="0.8" />
      <line x1={mastX - 2.5} y1={y - 22} x2={mastX + 2.5} y2={y - 22} stroke="#6b7280" strokeWidth="0.8" />
      <line x1={mastX - 2.5} y1={y - 30} x2={mastX + 2.5} y2={y - 30} stroke="#6b7280" strokeWidth="0.8" />

      {/* Circular Background Target Plate (Black with white border for contrast) */}
      <rect 
        x={mastX - 6} 
        y={y - 42} 
        width={12} 
        height={36} 
        fill="#111827" 
        stroke="#4b5563" 
        strokeWidth="1" 
        rx="6" 
      />

      {/* Visors / Sun Hoods above lenses */}
      <path d={`M ${mastX - 4} ${lampY1 - 2} Q ${mastX} ${lampY1 - 5} ${mastX + 4} ${lampY1 - 2}`} stroke="#374151" strokeWidth="1" fill="none" />
      <path d={`M ${mastX - 4} ${lampG - 2} Q ${mastX} ${lampG - 5} ${mastX + 4} ${lampG - 2}`} stroke="#374151" strokeWidth="1" fill="none" />
      <path d={`M ${mastX - 4} ${lampR - 2} Q ${mastX} ${lampR - 5} ${mastX + 4} ${lampR - 2}`} stroke="#374151" strokeWidth="1" fill="none" />
      <path d={`M ${mastX - 4} ${lampY2 - 2} Q ${mastX} ${lampY2 - 5} ${mastX + 4} ${lampY2 - 2}`} stroke="#374151" strokeWidth="1" fill="none" />

      {/* LENS 1: Yellow (Top) */}
      <circle cx={mastX} cy={lampY1} r="2.8" fill="#1f2937" />
      {(isYellow || isDoubleYellow) && (
        <>
          <circle cx={mastX} cy={lampY1} r="3" fill="#eab308" filter="url(#signal-glow-yellow)" />
          <circle cx={mastX} cy={lampY1} r="1.5" fill="#fef08a" />
        </>
      )}

      {/* LENS 2: Green */}
      <circle cx={mastX} cy={lampG} r="2.8" fill="#1f2937" />
      {isGreen && (
        <>
          <circle cx={mastX} cy={lampG} r="3" fill="#22c55e" filter="url(#signal-glow-green)" />
          <circle cx={mastX} cy={lampG} r="1.5" fill="#bbf7d0" />
        </>
      )}

      {/* LENS 3: Red (Danger) */}
      <circle cx={mastX} cy={lampR} r="2.8" fill="#1f2937" />
      {isRed && (
        <>
          <circle cx={mastX} cy={lampR} r="3.2" fill="#ef4444" filter="url(#signal-glow-red)" />
          <circle cx={mastX} cy={lampR} r="1.6" fill="#fecaca" />
        </>
      )}

      {/* LENS 4: Yellow 2 (Bottom - for Double Yellow) */}
      <circle cx={mastX} cy={lampY2} r="2.8" fill="#1f2937" />
      {isDoubleYellow && (
        <>
          <circle cx={mastX} cy={lampY2} r="3" fill="#eab308" filter="url(#signal-glow-yellow)" />
          <circle cx={mastX} cy={lampY2} r="1.5" fill="#fef08a" />
        </>
      )}

      {/* Ambient Track Reflection Beam */}
      {isRed && (
        <ellipse cx={mastX} cy={y} rx="14" ry="4" fill="rgba(239, 68, 68, 0.25)" filter="url(#signal-glow-red)" />
      )}
      {isGreen && (
        <ellipse cx={mastX} cy={y} rx="14" ry="4" fill="rgba(34, 197, 94, 0.2)" filter="url(#signal-glow-green)" />
      )}
      {(isYellow || isDoubleYellow) && (
        <ellipse cx={mastX} cy={y} rx="14" ry="4" fill="rgba(234, 179, 8, 0.2)" filter="url(#signal-glow-yellow)" />
      )}

      {/* Signal Identity Marker Plate (e.g. "S-14") */}
      <rect x={mastX - 10} y={postBaseY - 14} width={20} height={7} fill="#0f172a" stroke="#475569" strokeWidth="0.5" rx="1" />
      <text 
        x={mastX} 
        y={postBaseY - 8.5} 
        textAnchor="middle" 
        fill="#94a3b8" 
        fontSize="5" 
        fontFamily="monospace" 
        fontWeight="bold"
      >
        {name}
      </text>
    </g>
  );
});

SignalPost.displayName = 'SignalPost';
