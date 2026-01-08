import { create } from 'zustand';

const useStore = create((set) => ({
  assets: [],
  loadouts: [],
  intel: [],
  deviceStatus: { connected: false, battery: null },
  loading: true,
  error: null,

  deviceStatus: { connected: false, battery: null },
  liveDeviceData: null,

  // Smart Layer State
  radioTraffic: [], // [{ freq, data, analysis, timestamp }]
  wirelessTraffic: [], // [{ ssid, rssi, mac, vendor, timestamp }]
  accessLogs: [], // [{ type, uid, data, timestamp }]

  setAssets: (assets) => set({ assets }),
  setLoadouts: (loadouts) => set({ loadouts }),
  setIntel: (intel) => set({ intel }),
  setDeviceStatus: (status) => set({ deviceStatus: status }),
  setLiveDeviceData: (data) => set({ liveDeviceData: data }),

  // specific append actions to avoid full re-renders if we were rigorous, 
  // but for now simple setters or append helpers
  addRadioPacket: (packet) => set(state => ({ radioTraffic: [packet, ...state.radioTraffic].slice(0, 50) })),
  addWirelessPacket: (packet) => set(state => ({ wirelessTraffic: [packet, ...state.wirelessTraffic].slice(0, 50) })),
  addAccessLog: (log) => set(state => ({ accessLogs: [log, ...state.accessLogs].slice(0, 20) })),
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

  addIntel: (item) => set((state) => ({ intel: [...state.intel, item] })),
  deleteIntel: (id) => set((state) => ({
    intel: state.intel.filter((i) => i.id !== id),
  })),
}));

export default useStore;
