import { create } from 'zustand';

export interface Block {
  id: string; 
  department: string;
  date: string;
  fromTime: string;
  toTime: string;
}

interface MaintenanceStore {
  activeBlocks: Block[];
  fetchBlocks: () => Promise<void>;
  addBlock: (block: Block) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/active_blocks';

export const useMaintenanceStore = create<MaintenanceStore>((set) => ({
  activeBlocks: [],
  
  fetchBlocks: async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) {
        const now = new Date();
        const liveBlocks = data.blocks.filter((b: Block) => {
          if (!b.date || !b.fromTime || !b.toTime) return true;
          // Parse as local time exactly as the user inputs it
          const start = new Date(`${b.date}T${b.fromTime}:00`);
          const end = new Date(`${b.date}T${b.toTime}:00`);
          return now >= start && now <= end;
        });
        set({ activeBlocks: liveBlocks });
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
