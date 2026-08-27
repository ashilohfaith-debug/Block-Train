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
  addBlock: (block: Block) => void;
  removeBlock: (id: string) => void;
}

export const useMaintenanceStore = create<MaintenanceStore>((set) => ({
  activeBlocks: [],
  addBlock: (block) => set((state) => ({ 
    activeBlocks: [...state.activeBlocks.filter(b => b.id !== block.id), block] 
  })),
  removeBlock: (id) => set((state) => ({
    activeBlocks: state.activeBlocks.filter((b) => b.id !== id)
  }))
}));
