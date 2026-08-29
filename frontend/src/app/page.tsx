'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchPhase, setGlitchPhase] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setGlitchPhase(Math.random() * 3);
        setTimeout(() => setGlitchPhase(0), 100);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-black text-white font-sans overflow-hidden relative flex flex-col items-center justify-center selection:bg-red-500/30">
      {/* Background Matrix/Radar Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-transform duration-700 ease-out"
        style={{
          backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(1.1) perspective(1000px) rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg)`
        }}
      />
      
      {/* Scanning Line */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="w-full h-1 bg-red-500/50 shadow-[0_0_40px_10px_rgba(255,0,0,0.5)] animate-[scan_4s_linear_infinite]" />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100px); }
          100% { transform: translateY(120vh); }
        }
        .glitch-1 { clip-path: inset(20% 0 80% 0); transform: translate(-5px, 5px); }
        .glitch-2 { clip-path: inset(60% 0 10% 0); transform: translate(5px, -5px); }
        .glitch-3 { clip-path: inset(40% 0 50% 0); transform: translate(-5px, -2px); }
      `}} />

      {/* Main Title */}
      <div className="relative z-10 text-center mb-16 select-none">
        <div className="text-[10px] md:text-sm text-red-500 font-mono tracking-[0.5em] mb-4 uppercase">
          Southern Railway Command
        </div>
        
        <div className="relative inline-block">
          <h1 className={`text-7xl md:text-[120px] font-black tracking-tighter uppercase leading-none mix-blend-difference ${glitchPhase > 1 ? 'opacity-0' : 'opacity-100'}`}>
            Block<span className="text-red-600">Train</span>
          </h1>
          {glitchPhase > 0 && (
            <>
              <h1 className={`absolute top-0 left-0 text-7xl md:text-[120px] font-black tracking-tighter uppercase leading-none text-cyan-400 mix-blend-screen ${glitchPhase > 1 ? 'glitch-1' : 'glitch-2'}`}>
                Block<span className="text-red-600">Train</span>
              </h1>
              <h1 className={`absolute top-0 left-0 text-7xl md:text-[120px] font-black tracking-tighter uppercase leading-none text-red-500 mix-blend-screen ${glitchPhase > 2 ? 'glitch-3' : 'glitch-1'}`}>
                Block<span className="text-red-600">Train</span>
              </h1>
            </>
          )}
        </div>
        
        <p className="mt-8 max-w-2xl mx-auto text-sm md:text-base text-zinc-400 font-mono lowercase tracking-widest leading-relaxed px-4">
          system initialization ... connected ... 0x7FA4 ... ready for input.
        </p>
      </div>

      {/* Links Grid */}
      <div className="relative z-20 flex flex-col md:flex-row gap-8 w-full max-w-5xl px-8" style={{ perspective: '1000px' }}>
        
        {/* Map Link */}
        <Link 
          href="/map"
          className="group relative flex-1 bg-[#050505] border border-zinc-900 p-8 hover:bg-black transition-all duration-300 shadow-2xl"
          style={{
            transform: `rotateY(${mousePosition.x * 5}deg) rotateX(${mousePosition.y * -5}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
          
          <div className="relative" style={{ transform: 'translateZ(20px)' }}>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white group-hover:text-red-500 transition-colors">
              Live Map
            </h2>
            <div className="h-[2px] w-12 bg-zinc-800 mb-6 group-hover:bg-red-500 group-hover:w-full transition-all duration-500" />
            <p className="text-zinc-500 font-mono text-sm mb-12">
              > monitor active fleet<br/>
              > real-time interlocking<br/>
              > telemetry parsing
            </p>
            <div className="flex justify-between items-center text-xs font-mono font-bold tracking-widest text-zinc-700 group-hover:text-white transition-colors">
              <span>INITIATE_MODULE</span>
              <span className="text-red-600 font-black">[{'>'}]</span>
            </div>
          </div>
        </Link>

        {/* Maintenance Link */}
        <Link 
          href="/maintenance"
          className="group relative flex-1 bg-[#050505] border border-zinc-900 p-8 hover:bg-black transition-all duration-300 shadow-2xl"
          style={{
            transform: `rotateY(${mousePosition.x * 5}deg) rotateX(${mousePosition.y * -5}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-transparent via-yellow-500 to-transparent scale-y-0 group-hover:scale-y-100 transition-transform duration-700" />
          
          <div className="relative" style={{ transform: 'translateZ(20px)' }}>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white group-hover:text-yellow-500 transition-colors">
              Blocks
            </h2>
            <div className="h-[2px] w-12 bg-zinc-800 mb-6 group-hover:bg-yellow-500 group-hover:w-full transition-all duration-500" />
            <p className="text-zinc-500 font-mono text-sm mb-12">
              > execute line blocks<br/>
              > divert traffic flow<br/>
              > maintenance override
            </p>
            <div className="flex justify-between items-center text-xs font-mono font-bold tracking-widest text-zinc-700 group-hover:text-white transition-colors">
              <span>OVERRIDE_SYSTEM</span>
              <span className="text-yellow-500 font-black">[{'>'}]</span>
            </div>
          </div>
        </Link>

      </div>
      
      {/* Footer Details */}
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
        SR-SYS-CORE // 10.42.1.0<br/>
        ENCRYPTION: ACTIVE
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-600 uppercase tracking-widest text-right">
        AUTHORIZED ACCESS ONLY<br/>
        SECURE TERMINAL
      </div>
    </div>
  );
}
