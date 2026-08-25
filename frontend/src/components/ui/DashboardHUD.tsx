import React from 'react';

export const DashboardHUD = ({ time }: { time: string }) => {
  return (
    <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-2 z-50">
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
        BLOCK<span className="text-blue-600">TRAIN</span> <span className="text-slate-600 text-lg">DIGITAL TWIN</span>
      </h1>
      <div className="flex gap-4">
        <div className="text-gray-300 font-mono text-sm uppercase tracking-widest bg-[#111827]/90 px-4 py-2 rounded-md border border-gray-800 w-fit backdrop-blur-md shadow-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE • {time}
        </div>
        <div className="text-gray-400 font-mono text-xs uppercase tracking-widest bg-[#111827]/90 px-4 py-2 rounded-md border border-gray-800 w-fit backdrop-blur-md shadow-xl flex flex-col justify-center">
          SOUTHERN RAILWAY ZONE
        </div>
      </div>
    </div>
  );
};
