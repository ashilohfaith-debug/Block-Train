'use client';

import React from 'react';
import Link from 'next/link';
import { DigitalTwinMap } from '../../components/map/DigitalTwinMap';

export default function MaintenancePage() {
  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-300 font-sans flex flex-col selection:bg-amber-500/30 overflow-hidden relative">
      
      {/* Background Subtle Noise/Light */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Nav (Floating over map) */}
      <div className="absolute top-0 left-0 right-0 z-50 flex w-full justify-between items-center p-8 pointer-events-none">
        <div className="text-zinc-100 font-medium tracking-tight text-lg pointer-events-auto">
          Block<span className="text-zinc-500">Train</span>
        </div>
        <Link href="/" className="group flex items-center text-zinc-400 font-mono text-[11px] tracking-widest hover:text-zinc-200 transition-colors pointer-events-auto bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 backdrop-blur-md">
          <span className="mr-2 transition-transform duration-500 group-hover:-translate-x-1">&larr;</span> SYSTEM HUB
        </Link>
      </div>
      
      {/* HUD Panel */}
      <div className="absolute top-24 left-8 z-50 max-w-sm w-full pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] tracking-[0.2em] mb-6 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          MODULE: DISPATCH
        </div>
        
        <h1 className="text-3xl font-medium tracking-tight text-white mb-4 drop-shadow-xl">
          Maintenance & Voice Command
        </h1>
        
        <p className="text-zinc-400 text-sm leading-relaxed font-light mb-8 drop-shadow-lg bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
          Static Track Infrastructure View. Awaiting physical block interactions.
        </p>
      </div>

      {/* Map (Trains Hidden) */}
      <div className="absolute inset-0 z-10">
        <DigitalTwinMap hideTrains={true} />
      </div>
      
    </div>
  );
}
