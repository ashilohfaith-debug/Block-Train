'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DigitalTwinMap } from '../../components/map/DigitalTwinMap';
import { useMaintenanceStore } from '../../lib/store';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomCalendar } from '../../components/ui/CustomCalendar';
import { Chatbot } from '../../components/chat/Chatbot';
import { VoiceRecorder } from '../../components/audio/VoiceRecorder';

export default function MaintenancePage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const addBlock = useMaintenanceStore((state) => state.addBlock);
  const activeBlocks = useMaintenanceStore((state) => state.activeBlocks);
  const removeBlock = useMaintenanceStore((state) => state.removeBlock);

  React.useEffect(() => {
    useMaintenanceStore.getState().fetchBlocks();
  }, []);

  const times = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-300 font-sans flex flex-col selection:bg-amber-500/30 overflow-hidden relative">
      
      {/* Background Subtle Noise/Light */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Nav (Floating over map) */}
      <div className="absolute top-0 left-0 right-0 z-50 flex w-full justify-between items-center p-8 pointer-events-none">
        <div className="text-zinc-100 font-bold tracking-tight text-3xl pointer-events-auto">
          Block<span className="text-zinc-500 font-medium">Train</span>
        </div>
        <Link href="/" className="group flex items-center text-zinc-400 font-mono text-[11px] tracking-widest hover:text-zinc-200 transition-colors pointer-events-auto bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 backdrop-blur-md">
          <span className="mr-2 transition-transform duration-500 group-hover:-translate-x-1">&larr;</span> SYSTEM HUB
        </Link>
      </div>
      


      {/* Active Blocks Dashboard */}
      <div className="absolute right-8 top-24 bottom-8 w-80 z-40 pointer-events-none flex flex-col gap-4">
        {activeBlocks.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md pointer-events-auto flex flex-col max-h-full">
            <h2 className="text-sm font-medium text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Active Blocks ({activeBlocks.length})
            </h2>
            <div className="overflow-y-auto pr-2 space-y-3">
              {activeBlocks.map((b) => (
                <div key={b.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative group">
                  <button onClick={() => removeBlock(b.id)} className="absolute top-2 right-2 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-xs">
                    ✖
                  </button>
                  <p className="font-mono text-amber-500 text-[10px] mb-1">{b.department}</p>
                  <p className="text-zinc-200 text-xs mb-2 leading-tight">{b.id}</p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                    <span>{b.date}</span>
                    <span>{b.fromTime} - {b.toTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        

      </div>

      {/* Map (Trains Hidden, Interactive enabled) */}
      <div className="absolute inset-0 z-10">
        <DigitalTwinMap hideTrains={true} interactive={true} onTrackClick={setSelectedTrack} />
      </div>
      {/* Block Modal */}
      {selectedTrack && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl shrink-0">
              <div>
                <h2 className="text-xl font-medium text-white mb-1">Schedule Maintenance</h2>
                <p className="text-sm text-zinc-400 font-mono">
                  {selectedTrack}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTrack(null)}
                className="text-zinc-500 hover:text-zinc-300 bg-zinc-800 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form className="flex flex-col h-full" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                if (selectedTrack) {
                  const department = formData.get('dept') as string;
                  const date = formData.get('date') as string;
                  const fromTime = formData.get('fromTime') as string;
                  const toTime = formData.get('toTime') as string;

                  await addBlock({
                    id: selectedTrack,
                    department,
                    date,
                    fromTime,
                    toTime
                  });

                  // Trigger Twilio Call
                  const audioUrl = useMaintenanceStore.getState().dispatchAudioUrl;
                  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                  await fetch(`${backendUrl}/api/dispatch/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      blockId: selectedTrack,
                      department,
                      date,
                      fromTime,
                      toTime,
                      audioUrl
                    })
                  });
                }
                setSelectedTrack(null); 
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Left Column: Form Details */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Station / Department</label>
                      <select name="dept" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors">
                        <option>Track Maintenance Dept.</option>
                        <option>Signal & Telecom Dept.</option>
                        <option>Electrical Traction Dept.</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Date</label>
                      <CustomCalendar name="date" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">From Time (24H)</label>
                        <CustomSelect name="fromTime" placeholder="Start Time" options={times} />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">To Time (24H)</label>
                        <CustomSelect name="toTime" placeholder="End Time" options={times} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Voice Recorder */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Emergency Voice Dispatch</label>
                      <div className="bg-zinc-950 border border-zinc-800 p-1 rounded-xl h-[280px]">
                        <VoiceRecorder />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-800">
                  <button type="submit" className="w-full bg-emerald-500 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
                    CONFIRM BLOCK & DISPATCH NOTIFICATIONS
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
