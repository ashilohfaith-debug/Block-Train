import React from 'react';

export const SpeedController = ({ speed, setSpeed }: { speed: number, setSpeed: (s: number) => void }) => {
  const speeds = [1, 2, 5, 10];
  
  return (
    <div className="absolute top-6 right-6 z-50 flex gap-2 bg-[#111827]/90 p-2 rounded-lg border border-gray-800 backdrop-blur-md shadow-xl pointer-events-auto">
      <div className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center px-2 border-r border-gray-700 mr-1">
        SIM SPEED
      </div>
      {speeds.map(s => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={`px-3 py-1 font-mono text-sm rounded transition-all ${
            speed === s 
              ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
};
