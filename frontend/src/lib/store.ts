import { create } from 'zustand';
import { Train } from './types';

export interface Block {
  id: string; 
  department: string;
  date: string;
  fromTime: string;
  toTime: string;
  urgency?: string;
}

interface MaintenanceStore {
  activeBlocks: Block[];
  trains: Train[];
  dispatchAudioUrl: string | null;
  setTrains: (trains: Train[]) => void;
  setDispatchAudioUrl: (url: string | null) => void;
  fetchBlocks: () => Promise<void>;
  addBlock: (block: Block) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${backendUrl}/api/active_blocks`;

export const useMaintenanceStore = create<MaintenanceStore>((set) => ({
  activeBlocks: [],
  trains: [],
  dispatchAudioUrl: null,
  setTrains: (trains) => set({ trains }),
  setDispatchAudioUrl: (url) => set({ dispatchAudioUrl: url }),
  
  fetchBlocks: async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) {
        const now = new Date();
        const activeOnly = data.blocks.filter((b: Block) => {
          let dateStr = b.date;
          // If backend sent a UTC ISO string, convert it to local YYYY-MM-DD
          if (b.date.includes('T')) {
            const d = new Date(b.date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
          const start = new Date(`${dateStr}T${b.fromTime}:00`);
          const end = new Date(`${dateStr}T${b.toTime}:00`);
          return now >= start && now <= end;
        });
        set({ activeBlocks: activeOnly });
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  },

  addBlock: async (block) => {
    try {
      const now = new Date();
      let dateStr = block.date;
      if (block.date.includes('T')) {
        const d = new Date(block.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      const start = new Date(`${dateStr}T${block.fromTime}:00`);
      const end = new Date(`${dateStr}T${block.toTime}:00`);
      const isLive = now >= start && now <= end;

      // Optimistic UI update only if it's currently within the time window
      if (isLive) {
        set((state) => ({ activeBlocks: [...state.activeBlocks.filter(b => b.id !== block.id), block] }));
      }
      
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block)
      });
    } catch (err) {
      console.error('Failed to add block:', err);
    }
  },

  removeBlock: async (id) => {
    try {
      // Optimistic UI update
      set((state) => ({ activeBlocks: state.activeBlocks.filter((b) => b.id !== id) }));
      
      await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to remove block:', err);
    }
  }
}));
