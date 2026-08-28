import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Enterprise Subtle Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <div className="z-10 text-center mb-24 max-w-3xl px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono text-[11px] tracking-[0.2em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          SOUTHERN RAILWAY
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-6">
          Block<span className="text-zinc-500">Train</span>
        </h1>
        <p className="text-lg text-zinc-400 font-light leading-relaxed tracking-wide">
          An enterprise-grade digital twin platform. Monitor live railway infrastructure, dispatch autonomous maintenance workflows, and optimize transit operations using real-time spatial intelligence.
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl px-6">
        
        {/* Operations Hub */}
        <Link href="/map" className="group relative rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 transition-all duration-500 hover:bg-zinc-800/40 hover:border-zinc-700/50 overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-12 group-hover:border-blue-500/30 transition-colors duration-500">
              <svg className="w-4 h-4 text-zinc-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-zinc-100 mb-3 tracking-tight group-hover:text-blue-50 transition-colors">Operations Hub</h2>
            <p className="text-sm text-zinc-500 font-light leading-relaxed mb-8">
              Access the live digital twin. Monitor rolling stock telemetry, signal states, and network flow in real-time.
            </p>
            <div className="flex items-center text-zinc-400 font-mono text-[11px] tracking-widest group-hover:text-blue-400 transition-colors">
              INITIALIZE ENVIRONMENT <span className="ml-2 transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </div>
          </div>
        </Link>

        {/* Dispatch Console */}
        <Link href="/maintenance" className="group relative rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 transition-all duration-500 hover:bg-zinc-800/40 hover:border-zinc-700/50 overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-12 group-hover:border-amber-500/30 transition-colors duration-500">
              <svg className="w-4 h-4 text-zinc-300 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-zinc-100 mb-3 tracking-tight group-hover:text-amber-50 transition-colors">Dispatch Console</h2>
            <p className="text-sm text-zinc-500 font-light leading-relaxed mb-8">
              Engage maintenance workflows. Trigger infrastructure blocks and initiate automated crew communications.
            </p>
            <div className="flex items-center text-zinc-400 font-mono text-[11px] tracking-widest group-hover:text-amber-400 transition-colors">
              OPEN CONSOLE <span className="ml-2 transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </div>
          </div>
        </Link>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 flex w-full justify-between px-12 text-zinc-600 font-mono text-[10px] tracking-widest">
        <div>V 2.1.0-STABLE</div>
        <div>AUTHORIZED PERSONNEL ONLY</div>
      </div>
    </div>
  );
}
