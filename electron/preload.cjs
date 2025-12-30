const { contextBridge, ipcRenderer } = require('electron');

/**
 * SOUBI API - Secure Bridge to Main Process
 * Per FRONTEND_SPEC.md (visual.md section 4.1)
 * The Renderer NEVER gets direct Node access.
 * All operations go through this controlled interface.
 */
const soubiAPI = {
  // ============================================
  // ARMORY OPERATIONS
  // ============================================
  
  /**
   * Get all assets from the database
   * @returns {Promise<{success: boolean, data?: Asset[], error?: string}>}
   */
  getArmory: () => ipcRenderer.invoke('armory:get-all'),
  
  /**
   * Toggle asset status between PRISTINE and COMPROMISED
   * @param {string} id - Asset UUID
   * @returns {Promise<{success: boolean, data?: Asset[], error?: string}>}
   */
  toggleStatus: (id) => ipcRenderer.invoke('asset:toggle-status', id),

  /**
   * Create a new asset
   * @param {Object} data - { name, category, serial_number, notes, imagePath }
   * @returns {Promise<{success: boolean, data?: Asset[], created?: Asset, error?: string}>}
   */
  createAsset: (data) => ipcRenderer.invoke('armory:create', data),

  /**
   * Delete an asset by ID
   * @param {string} id - Asset UUID
   * @returns {Promise<{success: boolean, data?: Asset[], error?: string}>}
   */
  deleteAsset: (id) => ipcRenderer.invoke('armory:delete', id),

  // ============================================
  // FILE SYSTEM OPERATIONS
  // ============================================

  /**
   * Open file dialog to select an image
   * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
   */
  selectImage: () => ipcRenderer.invoke('fs:select-image'),

  /**
   * Open file dialog to select any file (for The Locker)
   * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
   */
  selectFile: () => ipcRenderer.invoke('fs:select-file'),

  /**
   * Get the full path for an asset image
   * For displaying in UI - converts relative path to file:// URL
   * @param {string} relativePath - Relative path from DB
   * @returns {string|null} File URL or null
   */
  getImageUrl: (relativePath) => {
    if (!relativePath) return null;
    // In Electron, we need to use file:// protocol with userData path
    // The main process will need to provide the base path
    return `soubi-asset://${relativePath}`;
  },

  /**
   * Add a file to an asset's locker
   * @param {string} assetId - Asset UUID
   * @param {string} filePath - Path to file
   * @returns {Promise<{success: boolean, data?: Asset[], asset?: Asset, error?: string}>}
   */
  addFile: (assetId, filePath) => ipcRenderer.invoke('asset:add-file', { assetId, filePath }),

  /**
   * Remove a file from an asset's locker
   * @param {string} assetId - Asset UUID
   * @param {string} filePath - Relative path of file
   * @returns {Promise<{success: boolean, data?: Asset[], error?: string}>}
   */
  removeFile: (assetId, filePath) => ipcRenderer.invoke('asset:remove-file', { assetId, filePath }),

  /**
   * Open a file with system default application
   * @param {string} filePath - Relative path to file
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  openFile: (filePath) => ipcRenderer.invoke('asset:open-file', filePath),

  // ============================================
  // LOADOUT OPERATIONS
  // ============================================

  /**
   * Get all loadouts
   * @returns {Promise<{success: boolean, data?: Loadout[], error?: string}>}
   */
  getLoadouts: () => ipcRenderer.invoke('loadout:get-all'),

  /**
   * Create a new loadout
   * @param {string} name - Loadout name
   * @returns {Promise<{success: boolean, data?: Loadout[], created?: Loadout, error?: string}>}
   */
  createLoadout: (name) => ipcRenderer.invoke('loadout:create', name),

  /**
   * Update loadout items
   * @param {string} loadoutId - Loadout UUID
   * @param {string[]} itemIds - Asset UUIDs
   * @returns {Promise<{success: boolean, data?: Loadout[], error?: string}>}
   */
  updateLoadout: (loadoutId, itemIds) => ipcRenderer.invoke('loadout:update', { loadoutId, itemIds }),

  /**
   * Delete a loadout
   * @param {string} id - Loadout UUID
   * @returns {Promise<{success: boolean, data?: Loadout[], error?: string}>}
   */
  deleteLoadout: (id) => ipcRenderer.invoke('loadout:delete', id),

  /**
   * Equip/Deploy a loadout (marks items as DEPLOYED)
   * @param {string} loadoutId - Loadout UUID
   * @returns {Promise<{success: boolean, assets?: Asset[], loadouts?: Loadout[], warnings?: string[], error?: string}>}
   */
  equipLoadout: (loadoutId) => ipcRenderer.invoke('loadout:equip', loadoutId),

  /**
   * Return a loadout from deployment with debrief
   * @param {string} loadoutId - Loadout UUID
   * @param {string[]} compromisedItems - Items that captured data
   * @returns {Promise<{success: boolean, assets?: Asset[], loadouts?: Loadout[], error?: string}>}
   */
  returnLoadout: (loadoutId, compromisedItems) => ipcRenderer.invoke('loadout:return', { loadoutId, compromisedItems }),

  /**
   * Get dependencies for an asset
   * @param {string} assetId - Asset UUID
   * @returns {Promise<{success: boolean, data?: string[], error?: string}>}
   */
  getAssetDependencies: (assetId) => ipcRenderer.invoke('loadout:get-dependencies', assetId),

  // ============================================
  // SYSTEM OPERATIONS
  // ============================================
  
  /**
   * Factory Reset: Clears database and reloads app
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  factoryReset: () => ipcRenderer.invoke('sys:factory-reset'),

  /**
   * Export Database to JSON file
   */
  exportData: () => ipcRenderer.invoke('db:export'),

  /**
   * Import Database from JSON file (reloads app)
   */
  importData: () => ipcRenderer.invoke('db:import'),

  // ============================================
  // WINDOW CONTROLS
  // ============================================
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),

  // ============================================
  // EVENT LISTENERS
  // ============================================
  onDataUpdate: (callback) => {
    ipcRenderer.on('data:updated', (_event, data) => callback(data));
  },
};

// Expose to renderer as window.soubiAPI
contextBridge.exposeInMainWorld('soubiAPI', soubiAPI);
