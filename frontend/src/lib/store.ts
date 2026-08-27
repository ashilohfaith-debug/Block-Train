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
        set({ activeBlocks: data.blocks });
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  },

  addBlock: async (block) => {
    try {
      // Optimistic UI update
      set((state) => ({ activeBlocks: [...state.activeBlocks.filter(b => b.id !== block.id), block] }));
      
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
