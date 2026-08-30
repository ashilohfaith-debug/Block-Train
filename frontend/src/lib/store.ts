import { create } from 'zustand';
import { Train } from './types';

export interface Block {
  id: string; 
  department: string;
  date: string;
  fromTime: string;
  toTime: string;
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
        // For the hackathon demo, show all scheduled blocks so they appear immediately on the map!
        set({ activeBlocks: data.blocks });
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  },

  addBlock: async (block) => {
    try {
      const now = new Date();
      const start = new Date(`${block.date}T${block.fromTime}:00`);
      const end = new Date(`${block.date}T${block.toTime}:00`);
      const isLive = now >= start && now <= end;

      // Optimistic UI update only if the block is currently live
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
