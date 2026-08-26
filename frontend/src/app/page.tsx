import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="z-10 text-center mb-16 space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-sm tracking-widest mb-4">
          SOUTHERN RAILWAY ZONE
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter drop-shadow-2xl">
          BLOCK<span className="text-blue-500">TRAIN</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto tracking-wide">
          Next-Generation Railway Digital Twin & AI Optimizer
        </p>
      </div>

      {/* Action Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-6">
        
        {/* Live Map Card */}
        <Link href="/map" className="group relative rounded-2xl border border-slate-700 bg-slate-800/50 p-8 hover:bg-slate-800 transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Live Operations Map</h2>
              <p className="text-slate-400 font-light leading-relaxed">
                Enter the digital twin. View real-time train telemtry, 5-station infrastructure, and track states.
              </p>
            </div>
            <div className="mt-8 flex items-center text-blue-400 font-mono text-sm tracking-wider group-hover:translate-x-2 transition-transform">
              ENTER MAP &rarr;
            </div>
          </div>
        </Link>

        {/* Maintenance Dispatch Card */}
        <Link href="/maintenance" className="group relative rounded-2xl border border-slate-700 bg-slate-800/50 p-8 hover:bg-slate-800 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Maintenance & Voice Dispatch</h2>
              <p className="text-slate-400 font-light leading-relaxed">
                Trigger block failures, dispatch track workers via Twilio Voice, and engage AI rerouting.
              </p>
            </div>
            <div className="mt-8 flex items-center text-amber-400 font-mono text-sm tracking-wider group-hover:translate-x-2 transition-transform">
              OPEN DISPATCH &rarr;
            </div>
          </div>
        </Link>

      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-slate-500 font-mono text-xs tracking-widest text-center">
        SYSTEM STATUS: <span className="text-green-500">ONLINE</span> | GROQ AI OPTIMIZER READY
      </div>
    </div>
  );
}
