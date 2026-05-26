import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientStore {
  selectedClientId: number | null;
  setSelectedClientId: (id: number | null) => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      selectedClientId: null,
      setSelectedClientId: (id) => set({ selectedClientId: id }),
    }),
    { name: 'dae-client-store' }
  )
);
