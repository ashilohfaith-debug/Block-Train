import React from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans flex flex-col p-8 selection:bg-amber-500/30">
      
      {/* Background Subtle Noise/Light */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Nav */}
      <div className="relative z-10 flex w-full justify-between items-center mb-24">
        <div className="text-zinc-100 font-medium tracking-tight text-lg">
          Block<span className="text-zinc-500">Train</span>
        </div>
        <Link href="/" className="group flex items-center text-zinc-400 font-mono text-[11px] tracking-widest hover:text-zinc-200 transition-colors">
          <span className="mr-2 transition-transform duration-500 group-hover:-translate-x-1">&larr;</span> SYSTEM HUB
        </Link>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto w-full mt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono text-[11px] tracking-[0.2em] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          MODULE: DISPATCH
        </div>
        
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
          Maintenance & Voice Command
        </h1>
        
        <p className="text-zinc-400 text-base leading-relaxed font-light mb-12">
          The Twilio Voice integration architecture and automated block failure triggers will be instantiated here. System is awaiting backend logic coupling for real-time track interlock overrides.
        </p>

        {/* Placeholder UI */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800/50">
            <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium text-sm">Force Track Block</div>
              <div className="text-zinc-500 text-xs mt-1">Initiates AI rerouting calculation</div>
            </div>
          </div>
          
          <div className="w-full h-12 rounded-lg bg-zinc-800/30 border border-zinc-800 border-dashed flex items-center justify-center text-zinc-600 font-mono text-[10px] tracking-widest cursor-not-allowed">
            WAITING FOR IMPLEMENTATION
          </div>
        </div>
      </div>
    </div>
  );
}
