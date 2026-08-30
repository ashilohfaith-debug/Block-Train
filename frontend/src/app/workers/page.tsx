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

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);

  useEffect(() => {
    fetch('http://localhost:5000/api/workers')
      .then(res => res.json())
      .then(data => {
        if (data.workers) setWorkers(data.workers);
      })
      .catch(console.error);
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, department: selectedDept })
      });
      const data = await res.json();
      if (data.success) {
        setWorkers([data.worker, ...workers]);
        setName("");
        setPhone("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (id: number) => {
    try {
      // Optimistic update
      setWorkers(workers.filter(w => w.id !== id));
      
      const res = await fetch(`http://localhost:5000/api/workers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) {
        // Fetch again to revert if failed (simple fallback)
        fetch('http://localhost:5000/api/workers').then(r => r.json()).then(d => setWorkers(d.workers || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-zinc-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            ← Back to Terminal
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Worker Directory</h1>
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
