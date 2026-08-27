'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DigitalTwinMap } from '../../components/map/DigitalTwinMap';

export default function MaintenancePage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

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
          Select any track section on the map to issue a maintenance block.
        </p>
      </div>

      {/* Map (Trains Hidden, Interactive enabled) */}
      <div className="absolute inset-0 z-10">
        <DigitalTwinMap hideTrains={true} interactive={true} onTrackClick={(id) => setSelectedTrack(id)} />
      </div>

      {/* Block Modal */}
      {selectedTrack && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setSelectedTrack(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
            <h2 className="text-xl font-medium text-white mb-2">Schedule Maintenance</h2>
            <p className="text-sm text-zinc-400 mb-6 font-mono bg-zinc-950 p-2 rounded-md border border-zinc-800">
              {selectedTrack}
            </p>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Block requested!'); setSelectedTrack(null); }}>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Station / Department</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors">
                  <option>Track Maintenance Dept.</option>
                  <option>Signal & Telecom Dept.</option>
                  <option>Electrical Traction Dept.</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Date</label>
                <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2">From Time (24H)</label>
                  <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2">To Time (24H)</label>
                  <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-white text-black font-medium py-3 rounded-lg mt-4 hover:bg-zinc-200 transition-colors">
                Confirm Block
              </button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
