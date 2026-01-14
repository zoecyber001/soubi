/*
 * api.js
 * 
 * Thin wrapper around the Electron IPC calls. Makes it so the React
 * components don't need to know if they're running in Electron or
 * in a browser for development.
 * 
 * In browser mode, everything uses mock data so you can work on the
 * UI without spinning up the full Electron app.
 */

// are we running in Electron or just a browser?
const isElectron = () => typeof window !== 'undefined' && !!window.soubiAPI;

// fake data for browser dev mode
const getMockData = () => ({
    assets: [
        {
            id: 'mock-flipper-001',
            name: 'Flipper Zero (Mock)',
            category: 'RF_TOOLS',
            status: 'PRISTINE',
            image_path: null,
            logs: [{ id: '1', timestamp: Date.now(), type: 'CREATED', description: 'Mock asset', user: 'System' }],
            files: [],
        },
        {
            id: 'mock-pwnagotchi-002',
            name: 'Pwnagotchi (Mock)',
            category: 'WIFI_TOOLS',
            status: 'COMPROMISED',
            image_path: null,
            logs: [],
            files: [],
        },
    ],
    loadouts: [
        {
            id: 'mock-loadout-001',
            name: 'WiFi Audit Kit',
            status: 'DORMANT',
            items: ['mock-pwnagotchi-002'],
        },
    ],
    intel: [],
});

let mockState = getMockData();

const api = {
    // === ARMORY ===

    async getAssets() {
        if (isElectron()) {
            const result = await window.soubiAPI.getArmory();
            return result.success ? result.data : [];
        }
        return mockState.assets;
    },

    async createAsset(formData) {
        if (isElectron()) {
            const result = await window.soubiAPI.createAsset(formData);
            return result.success ? result.data : null;
        }
        // mock version
        const newAsset = {
            id: `mock-${Date.now()}`,
            name: formData.name,
            category: formData.category,
            status: 'PRISTINE',
            image_path: null,
            logs: [{ id: '1', timestamp: Date.now(), type: 'CREATED', description: 'Asset added', user: 'System' }],
            files: [],
        };
        mockState.assets.push(newAsset);
        return mockState.assets;
    },

    async deleteAsset(id) {
        if (isElectron()) {
            const result = await window.soubiAPI.deleteAsset(id);
            return result.success ? result.data : null;
        }
        mockState.assets = mockState.assets.filter(a => a.id !== id);
        return mockState.assets;
    },

    async toggleStatus(id) {
        if (isElectron()) {
            const result = await window.soubiAPI.toggleStatus(id);
            return result.success ? result.data : null;
        }
        const asset = mockState.assets.find(a => a.id === id);
        if (asset) {
            asset.status = asset.status === 'PRISTINE' ? 'COMPROMISED' : 'PRISTINE';
        }
        return mockState.assets;
    },

    // === LOADOUTS ===

    async getLoadouts() {
        if (isElectron()) {
            const result = await window.soubiAPI.getLoadouts?.() || { success: true, data: [] };
            return result.success ? result.data : [];
        }
        return mockState.loadouts;
    },

    async createLoadout(name) {
        if (isElectron()) {
            const result = await window.soubiAPI.createLoadout(name);
            return result.success ? { loadouts: result.data, created: result.created } : null;
        }
        const newLoadout = { id: `mock-loadout-${Date.now()}`, name, status: 'DORMANT', items: [] };
        mockState.loadouts.push(newLoadout);
        return { loadouts: mockState.loadouts, created: newLoadout };
    },

    async deleteLoadout(id) {
        if (isElectron()) {
            const result = await window.soubiAPI.deleteLoadout(id);
            return result.success ? result.data : null;
        }
        mockState.loadouts = mockState.loadouts.filter(l => l.id !== id);
        return mockState.loadouts;
    },

    async updateLoadout(loadoutId, itemIds) {
        if (isElectron()) {
            const result = await window.soubiAPI.updateLoadout(loadoutId, itemIds);
            return result.success ? result.data : null;
        }
        const loadout = mockState.loadouts.find(l => l.id === loadoutId);
        if (loadout) loadout.items = itemIds;
        return mockState.loadouts;
    },

    async equipLoadout(loadoutId) {
        if (isElectron()) {
            return await window.soubiAPI.equipLoadout(loadoutId);
        }
        const loadout = mockState.loadouts.find(l => l.id === loadoutId);
        if (loadout) {
            loadout.status = 'ACTIVE';
            loadout.items.forEach(itemId => {
                const asset = mockState.assets.find(a => a.id === itemId);
                if (asset) asset.status = 'DEPLOYED';
            });
        }
        return { success: true, assets: mockState.assets, loadouts: mockState.loadouts };
    },

    async returnLoadout(loadoutId, compromisedItems = []) {
        if (isElectron()) {
            return await window.soubiAPI.returnLoadout(loadoutId, compromisedItems);
        }
        const loadout = mockState.loadouts.find(l => l.id === loadoutId);
        if (loadout) {
            loadout.status = 'DORMANT';
            loadout.items.forEach(itemId => {
                const asset = mockState.assets.find(a => a.id === itemId);
                if (asset) {
                    asset.status = compromisedItems.includes(itemId) ? 'COMPROMISED' : 'PRISTINE';
                }
            });
        }
        return { success: true, assets: mockState.assets, loadouts: mockState.loadouts };
    },

    // === FILES (the locker) ===

    async addFile(assetId, filePath) {
        if (isElectron()) {
            return await window.soubiAPI.addFile(assetId, filePath);
        }
        return { success: false, error: 'File ops not available in browser' };
    },

    async removeFile(assetId, filePath) {
        if (isElectron()) {
            return await window.soubiAPI.removeFile(assetId, filePath);
        }
        return { success: false, error: 'File ops not available in browser' };
    },

    async openFile(filePath) {
        if (isElectron()) {
            return await window.soubiAPI.openFile(filePath);
        }
        console.log('[Mock] Would open:', filePath);
        return { success: true };
    },

    async selectFile() {
        if (isElectron()) {
            return await window.soubiAPI.selectFile();
        }
        return { success: false, cancelled: true };
    },

    async selectImage() {
        if (isElectron()) {
            return await window.soubiAPI.selectImage();
        }
        return { success: false, cancelled: true };
    },

    // === INTEL (the vault) ===

    async getIntel() {
        if (isElectron()) {
            return await window.soubiAPI.getIntel();
        }
        return { success: true, data: mockState.intel };
    },

    async deleteIntel(id) {
        if (isElectron()) {
            return await window.soubiAPI.deleteIntel(id);
        }
        mockState.intel = mockState.intel.filter(i => i.id !== id);
        return { success: true, data: mockState.intel };
    },

    // === SERIAL / HARDWARE ===

    async sendSerial(data) {
        if (isElectron()) {
            return await window.soubiAPI.sendSerial(data);
        }
        console.log('[Mock] Would send to serial:', data);
        return { success: true };
    },

    async generatePayload(text) {
        if (isElectron()) {
            return await window.soubiAPI.generatePayload(text);
        }
        return { success: true, script: `REM Mock: ${text}\nDELAY 500\nSTRING ${text}\nENTER` };
    },

    // === SYSTEM ===

    async factoryReset() {
        if (isElectron()) {
            return await window.soubiAPI.factoryReset();
        }
        mockState = getMockData();
        return { success: true };
    },

    async exportDatabase() {
        if (isElectron()) {
            return await window.soubiAPI.exportDatabase();
        }
        return { success: false, error: 'Export not available in browser' };
    },

    async importDatabase() {
        if (isElectron()) {
            return await window.soubiAPI.importDatabase();
        }
        return { success: false, error: 'Import not available in browser' };
    },

    // === EVENT SUBSCRIPTIONS ===

    onRadioTraffic(callback) {
        if (isElectron() && window.soubiAPI.onRadioTraffic) {
            return window.soubiAPI.onRadioTraffic(callback);
        }
        return () => { }; // no-op cleanup
    },

    onWirelessTraffic(callback) {
        if (isElectron() && window.soubiAPI.onWirelessTraffic) {
            return window.soubiAPI.onWirelessTraffic(callback);
        }
        return () => { };
    },

    onAccessRead(callback) {
        if (isElectron() && window.soubiAPI.onAccessRead) {
            return window.soubiAPI.onAccessRead(callback);
        }
        return () => { };
    },

    // utility
    isElectronMode: isElectron,
};

export default api;
