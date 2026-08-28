import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1e1e24] text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* Enterprise Topbar */}
      <header className="w-full bg-[#151519] border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white tracking-tighter">
            BT
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase">Block Train System</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Southern Railway Zone</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-slate-400 hidden sm:flex">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            SYSTEM ONLINE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            DB: CONNECTED
          </div>
          <div>v2.1.0-STABLE</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Column: System Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#25252d] border border-slate-700/50 rounded-md p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">System Overview</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Block Train is an advanced decision-support system and digital twin for railway maintenance and dispatch operations. 
              The system integrates live telemetry, constraint-based optimization, and Generative AI to manage track closures with zero conflicts.
            </p>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-700/30 pb-2">
                <span className="text-slate-500">Network ID</span>
                <span className="text-slate-200">CGL-MAS-01</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/30 pb-2">
                <span className="text-slate-500">Active Nodes</span>
                <span className="text-slate-200">14 Stations</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/30 pb-2">
                <span className="text-slate-500">Track Capacity</span>
                <span className="text-slate-200">High Density</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/30 pb-2">
                <span className="text-slate-500">Optimization</span>
                <span className="text-emerald-400">CP-SAT Ready</span>
              </div>
            </div>
          </div>

          <div className="bg-[#25252d] border border-slate-700/50 rounded-md p-6 shadow-sm">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Security Notice</h2>
             <p className="text-xs text-slate-400 leading-relaxed">
               Access to this system is restricted to authorized personnel of the Indian Railways. All actions are logged and audited. Unauthorized access will result in immediate prosecution.
             </p>
          </div>
        </div>

        {/* Right Column: Modules */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-2">Available Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operations Hub */}
            <Link href="/map" className="group flex flex-col justify-between bg-[#2a2a35] border border-slate-700 rounded-md p-6 hover:border-blue-500/50 hover:bg-[#2c2c38] transition-colors shadow-sm min-h-[220px]">
              <div>
                <div className="w-10 h-10 bg-[#1e1e24] border border-slate-600 rounded flex items-center justify-center mb-4 group-hover:border-blue-500/50 transition-colors">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Live Operations Hub</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Access the real-time digital twin of the railway corridor. Monitor train positions, track statuses, and infrastructure health.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                <span>Access Module</span>
                <span>&rarr;</span>
              </div>
            </Link>

            {/* Dispatch Console */}
            <Link href="/maintenance" className="group flex flex-col justify-between bg-[#2a2a35] border border-slate-700 rounded-md p-6 hover:border-amber-500/50 hover:bg-[#2c2c38] transition-colors shadow-sm min-h-[220px]">
              <div>
                <div className="w-10 h-10 bg-[#1e1e24] border border-slate-600 rounded flex items-center justify-center mb-4 group-hover:border-amber-500/50 transition-colors">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Maintenance Dispatch</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Request, optimize, and execute track blocks. Coordinate engineering, S&T, and traction tasks with automated conflict resolution.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-amber-400 transition-colors uppercase tracking-widest">
                <span>Access Module</span>
                <span>&rarr;</span>
              </div>
            </Link>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
             <div className="bg-[#25252d] border border-slate-700/30 rounded p-4 text-center">
                <div className="text-2xl font-bold text-slate-200">100%</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Uptime</div>
             </div>
             <div className="bg-[#25252d] border border-slate-700/30 rounded p-4 text-center">
                <div className="text-2xl font-bold text-slate-200">0</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Active Conflicts</div>
             </div>
             <div className="bg-[#25252d] border border-slate-700/30 rounded p-4 text-center">
                <div className="text-2xl font-bold text-emerald-500">Secure</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Connection</div>
             </div>
             <div className="bg-[#25252d] border border-slate-700/30 rounded p-4 text-center">
                <div className="text-2xl font-bold text-slate-200">2.1</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">System Version</div>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}
