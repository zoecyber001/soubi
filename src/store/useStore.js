import { create } from 'zustand';

const useStore = create((set) => ({
  assets: [],
  loadouts: [],
  loading: true,
  error: null,

  setAssets: (assets) => set({ assets }),
  setLoadouts: (loadouts) => set({ loadouts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Atomic updates.
  // We usually fetch the whole list from backend (single source of truth), 
  // but these are here if we want to do optimistic UI updates later.
  // Right now, they are mostly unused except for the initial "demo" data.
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  updateAssetStatus: (id, status) => set((state) => ({
    assets: state.assets.map((a) => (a.id === id ? { ...a, status } : a)),
  })),
  deleteAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id),
  })),

  addLoadout: (loadout) => set((state) => ({ loadouts: [...state.loadouts, loadout] })),
  updateLoadout: (updatedLoadout) => set((state) => ({
    loadouts: state.loadouts.map((l) => (l.id === updatedLoadout.id ? updatedLoadout : l)),
  })),
  deleteLoadout: (id) => set((state) => ({
    loadouts: state.loadouts.filter((l) => l.id !== id),
  })),
}));

export default useStore;
