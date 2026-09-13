'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Worker = {
  id: number;
  name: string;
  phone: string;
  department: string;
};

const DEPARTMENTS = [
  "Track Maintenance Dept.",
  "Signal & Telecom Dept.",
  "Electrical Traction Dept."
];

let workerIdSeq = 1000;

const DEFAULT_WORKERS: Worker[] = [
  { id: 1, name: "K. R. Natarajan (Track Inspector)", phone: "+91 94440 12831", department: "Track Maintenance Dept." },
  { id: 2, name: "S. Venkatesh (Senior Section Engineer - S&T)", phone: "+91 98401 54920", department: "Signal & Telecom Dept." },
  { id: 3, name: "M. Anbarasan (OHE Traction Foreman)", phone: "+91 97908 61245", department: "Electrical Traction Dept." },
  { id: 4, name: "P. Selvakumar (Permanent Way Gang Lead)", phone: "+91 94450 78312", department: "Track Maintenance Dept." },
  { id: 5, name: "D. Jayaprakash (Relay Interlocking Tech)", phone: "+91 98842 19047", department: "Signal & Telecom Dept." },
  { id: 6, name: "R. Muralidharan (Tower Wagon Supervisor)", phone: "+91 94441 83022", department: "Electrical Traction Dept." }
];

export default function WorkersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const API_URL = `${baseUrl}/api`;

  const [workers, setWorkers] = useState<Worker[]>(DEFAULT_WORKERS);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);

  useEffect(() => {
    fetch(`${API_URL}/workers`)
      .then(res => res.json())
      .then(data => {
        if (data.workers && data.workers.length > 0) setWorkers(data.workers);
      })
      .catch(() => {
        // Retain default workers if backend is offline
      });
  }, [API_URL]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newWorker: Worker = {
      id: ++workerIdSeq,
      name: name.trim(),
      phone: phone.trim() || "+91 90000 00000",
      department: selectedDept
    };
    try {
      const res = await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), department: selectedDept })
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.worker) {
        setWorkers((prev) => [data.worker, ...prev]);
      } else {
        setWorkers((prev) => [newWorker, ...prev]);
      }
    } catch {
      setWorkers((prev) => [newWorker, ...prev]);
    }
    setName("");
    setPhone("");
  };

  const handleDeleteWorker = async (id: number) => {
    setWorkers((prev) => prev.filter(w => w.id !== id));
    try {
      await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' });
    } catch {
      // Local optimistic delete suffices
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-zinc-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1">
              &larr; Hub
            </Link>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">Worker Directory</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link href="/map" className="px-3 py-1.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800 hover:bg-blue-900 transition-colors">
              🗺️ Map
            </Link>
            <Link href="/rbms" className="px-3 py-1.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors">
              📅 RBMS
            </Link>
            <Link href="/ai-planner" className="px-3 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors">
              ⚡ AI Planner
            </Link>
            <Link href="/maintenance" className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition-colors">
              🚧 Blocks
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 shadow-2xl rounded-sm">
          <h2 className="text-xl font-bold mb-4 text-emerald-400 uppercase">Add New Worker</h2>
          <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-black border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-emerald-500"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-emerald-500"
              required
            />
            <input 
              type="text" 
              placeholder="Phone (e.g. +919876543210)" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-black border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-emerald-500"
              required
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 px-4 transition-colors uppercase tracking-wider"
            >
              Deploy Worker
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map(dept => (
            <div key={dept} className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-zinc-800">{dept}</h3>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {workers.filter(w => w.department === dept).length === 0 ? (
                  <p className="text-zinc-600 text-sm italic">No active personnel.</p>
                ) : (
                  workers.filter(w => w.department === dept).map(w => (
                    <div key={w.id} className="bg-black border border-zinc-800 p-3 flex flex-col justify-between group hover:border-emerald-500 transition-colors relative">
                      <button 
                        onClick={() => handleDeleteWorker(w.id)} 
                        className="absolute top-2 right-2 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-xs"
                      >
                        ✖
                      </button>
                      <span className="font-semibold text-zinc-300 pr-4">{w.name}</span>
                      <span className="text-xs text-zinc-500 font-mono mt-1">{w.phone}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
