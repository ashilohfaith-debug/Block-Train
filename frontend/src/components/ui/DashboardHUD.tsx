import React from 'react';
import Link from 'next/link';

export const DashboardHUD = ({ time }: { time: string }) => {
  return (
    <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-2 z-50">
      <Link href="/" className="pointer-events-auto hover:opacity-80 transition-opacity w-fit">
        <h1 className="text-3xl font-black tracking-tighter drop-shadow-sm transition-colors duration-500">
          BLOCK<span className="text-blue-600 dark:text-blue-500">TRAIN</span> <span className="opacity-70 text-lg">DIGITAL TWIN</span>
        </h1>
      </Link>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="text-gray-300 font-mono text-xs uppercase tracking-widest bg-[#111827]/90 px-3.5 py-1.5 rounded-full border border-gray-800 w-fit backdrop-blur-md shadow-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE • {time}
        </div>
        <Link
          href="/rbms"
          className="pointer-events-auto text-amber-300 hover:text-amber-100 font-mono text-xs uppercase tracking-widest bg-amber-950/80 hover:bg-amber-900/90 px-3.5 py-1.5 rounded-full border border-amber-800/80 w-fit backdrop-blur-md shadow-xl flex items-center gap-1.5 transition-colors"
        >
          <span>📅</span> RBMS SUITE
        </Link>
        <Link
          href="/ai-planner"
          className="pointer-events-auto text-cyan-300 hover:text-cyan-100 font-mono text-xs uppercase tracking-widest bg-cyan-950/80 hover:bg-cyan-900/90 px-3.5 py-1.5 rounded-full border border-cyan-800/80 w-fit backdrop-blur-md shadow-xl flex items-center gap-1.5 transition-colors"
        >
          <span>⚡</span> AI PLANNER
        </Link>
        <Link
          href="/maintenance"
          className="pointer-events-auto text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-widest bg-[#111827]/90 hover:bg-zinc-800 px-3.5 py-1.5 rounded-full border border-gray-800 w-fit backdrop-blur-md shadow-xl flex items-center gap-1.5 transition-colors"
        >
          DISPATCH
        </Link>
      </div>
      
    </div>
  );
};
