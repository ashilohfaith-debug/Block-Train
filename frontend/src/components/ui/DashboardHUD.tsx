import React, { useState, useEffect } from 'react';

export const DashboardHUD = ({ time }: { time: string }) => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/network')
      .then(res => res.json())
      .then(data => setSummary(data.summary))
      .catch(err => console.error("Failed to fetch backend data", err));
  }, []);

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
      
      {summary && (
        <div className="mt-2 flex gap-4">
          <div className="text-gray-300 font-mono text-xs uppercase bg-[#111827]/90 px-3 py-2 rounded-md border border-gray-800 backdrop-blur-md shadow-xl">
            <span className="text-blue-400">{summary.pending_tasks}</span> TASKS
          </div>
          <div className="text-gray-300 font-mono text-xs uppercase bg-[#111827]/90 px-3 py-2 rounded-md border border-gray-800 backdrop-blur-md shadow-xl">
            <span className="text-red-400">{summary.active_incidents}</span> INCIDENTS
          </div>
          <div className="text-gray-300 font-mono text-xs uppercase bg-[#111827]/90 px-3 py-2 rounded-md border border-gray-800 backdrop-blur-md shadow-xl">
            <span className="text-green-400">{summary.operational_tracks}</span> TRACKS OK
          </div>
        </div>
      )}
    </div>
  );
};
