/**
 * SOUBI Database Module
 * Schema follows BACKEND_SPEC.md exactly
 * Uses LowDB for local JSON storage
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

// LowDB v7 uses ESM, so we need dynamic import
let db = null;
let Low = null;
let JSONFile = null;

/**
 * Generate UUID v4 using Node's crypto module (CommonJS compatible)
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get the database file path in userData directory
 * @returns {string} Path to soubi_db.json
 */
function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'soubi_db.json');
}

/**
 * Default database schema per BACKEND_SPEC.md
 */
function getDefaultData() {
  return {
    settings: {
      theme: 'dark',
      dataPath: app.getPath('userData'),
    },
    assets: [], // Start empty
    loadouts: [],
    presets: [],
    intel: [], // New: Captured data keys/handshakes
    targets: [], // New: Persistent profiled entities (WiFi/BT)
  };
}

/**
 * Initialize the database
 * Creates soubi_db.json in userData if it doesn't exist
 */
async function initDatabase() {
  const dbPath = getDbPath();

  // Dynamically import lowdb (ESM module)
  const lowdbModule = await import('lowdb');
  const lowdbNodeModule = await import('lowdb/node');

  Low = lowdbModule.Low;
  JSONFile = lowdbNodeModule.JSONFile;

  // Ensure directory exists
  await fs.ensureDir(path.dirname(dbPath));

  const adapter = new JSONFile(dbPath);
  db = new Low(adapter, getDefaultData());

  // Read existing data or write defaults
  await db.read();

  // If file was empty or missing, write defaults
  if (!db.data || !db.data.assets) {
    db.data = getDefaultData();
    await db.write();
    console.log('[SOUBI DB] Created new database at:', dbPath);
  } else {
    console.log('[SOUBI DB] Loaded existing database from:', dbPath);
  }

  return db;
}

/**
 * Get all assets from the database
 * @returns {Array} List of assets
 */
async function getAllAssets() {
  if (!db) await initDatabase();
  return db.data.assets || [];
}

/**
 * Toggle asset status between PRISTINE and COMPROMISED
 * Also logs the status change in the asset's flight recorder
 * @param {string} id - Asset UUID
 * @returns {Object} Updated asset or null if not found
 */
async function toggleAssetStatus(id) {
  if (!db) await initDatabase();

  const asset = db.data.assets.find((a) => a.id === id);
  if (!asset) {
    console.error('[SOUBI DB] Asset not found:', id);
    return null;
  }

  // Toggle status per PRD spec
  const oldStatus = asset.status;
  asset.status = asset.status === 'PRISTINE' ? 'COMPROMISED' : 'PRISTINE';

  // Add log entry to flight recorder
  if (!asset.logs) asset.logs = [];
  asset.logs.push({
    id: generateUUID(),
    timestamp: Date.now(),
    type: 'STATUS_CHANGE',
    description: `Status changed from ${oldStatus} to ${asset.status}`,
    user: 'System',
  });

  await db.write();
  console.log(`[SOUBI DB] Toggled ${asset.name}: ${oldStatus} -> ${asset.status}`);

  return asset;
}

/**
 * Get a single asset by ID
 * @param {string} id - Asset UUID
 * @returns {Object|null} Asset or null
 */
async function getAssetById(id) {
  if (!db) await initDatabase();
  return db.data.assets.find((a) => a.id === id) || null;
}

/**
 * Create a new asset
 * @param {Object} assetData - Asset data (name, category, serial_number, image_path, notes)
 * @returns {Object} The created asset
 */
async function createAsset(assetData) {
  if (!db) await initDatabase();

  const newAsset = {
    id: generateUUID(),
    name: assetData.name || 'Unnamed Asset',
    category: assetData.category || 'HARDWARE',
    status: 'PRISTINE', // New assets always start pristine
    serial_number: assetData.serial_number || '',
    purchase_date: assetData.purchase_date || new Date().toISOString().split('T')[0],
    notes: assetData.notes || '',
    image_path: assetData.image_path || null,
    dependencies: [],
    logs: [
      {
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'CREATED',
        description: 'Asset added to armory.',
        user: 'System',
      },
    ],
    files: [],
  };

  db.data.assets.push(newAsset);
  await db.write();
  console.log(`[SOUBI DB] Created asset: ${newAsset.name} (${newAsset.id})`);

  return newAsset;
}

/**
 * Delete an asset by ID
 * @param {string} id - Asset UUID
 * @returns {Object|null} Deleted asset data or null if not found
 */
async function deleteAsset(id) {
  if (!db) await initDatabase();

  const assetIndex = db.data.assets.findIndex((a) => a.id === id);
  if (assetIndex === -1) {
    console.error('[SOUBI DB] Asset not found for deletion:', id);
    return null;
  }

  const deletedAsset = db.data.assets.splice(assetIndex, 1)[0];
  await db.write();
  console.log(`[SOUBI DB] Deleted asset: ${deletedAsset.name} (${id})`);

  return deletedAsset;
}

// ============================================
// LOADOUT OPERATIONS
// Per BACKEND_SPEC.md Section 2.3 and 3.3
// ============================================

/**
 * Get all loadouts
 * @returns {Array} List of loadouts
 */
async function getAllLoadouts() {
  if (!db) await initDatabase();
  return db.data.loadouts || [];
}

/**
 * Get a single loadout by ID
 * @param {string} id - Loadout UUID
 * @returns {Object|null} Loadout or null
 */
async function getLoadoutById(id) {
  if (!db) await initDatabase();
  return db.data.loadouts.find((l) => l.id === id) || null;
}

/**
 * Create a new loadout
 * @param {string} name - Loadout name
 * @returns {Object} The created loadout
 */
async function createLoadout(name) {
  if (!db) await initDatabase();

  const newLoadout = {
    id: generateUUID(),
    name: name || 'Unnamed Loadout',
    status: 'DORMANT', // DORMANT | ACTIVE
    created_at: Date.now(),
    items: [],
  };

  db.data.loadouts.push(newLoadout);
  await db.write();
  console.log(`[SOUBI DB] Created loadout: ${newLoadout.name} (${newLoadout.id})`);

  return newLoadout;
}

/**
 * Update loadout items (add/remove)
 * @param {string} loadoutId - Loadout UUID
 * @param {string[]} itemIds - New list of asset UUIDs
 * @returns {Object|null} Updated loadout or null
 */
async function updateLoadout(loadoutId, itemIds) {
  if (!db) await initDatabase();

  const loadout = db.data.loadouts.find((l) => l.id === loadoutId);
  if (!loadout) {
    console.error('[SOUBI DB] Loadout not found:', loadoutId);
    return null;
  }

  // Cannot modify active loadouts
  if (loadout.status === 'ACTIVE') {
    console.error('[SOUBI DB] Cannot modify active loadout');
    return null;
  }

  loadout.items = itemIds;
  await db.write();
  console.log(`[SOUBI DB] Updated loadout ${loadout.name}: ${itemIds.length} items`);

  return loadout;
}

/**
 * Delete a loadout
 * @param {string} id - Loadout UUID
 * @returns {Object|null} Deleted loadout or null
 */
async function deleteLoadout(id) {
  if (!db) await initDatabase();

  const loadoutIndex = db.data.loadouts.findIndex((l) => l.id === id);
  if (loadoutIndex === -1) {
    console.error('[SOUBI DB] Loadout not found:', id);
    return null;
  }

  const loadout = db.data.loadouts[loadoutIndex];

  // Cannot delete active loadouts
  if (loadout.status === 'ACTIVE') {
    console.error('[SOUBI DB] Cannot delete active loadout');
    return null;
  }

  const deleted = db.data.loadouts.splice(loadoutIndex, 1)[0];
  await db.write();
  console.log(`[SOUBI DB] Deleted loadout: ${deleted.name}`);

  return deleted;
}

/**
 * Equip a loadout - Deploy all items
 * Per BACKEND_SPEC.md: Check conflicts, set to DEPLOYED, mark ACTIVE
 * @param {string} loadoutId - Loadout UUID
 * @returns {{success: boolean, error?: string, loadout?: Object, conflicts?: string[]}}
 */
async function equipLoadout(loadoutId) {
  if (!db) await initDatabase();

  const loadout = db.data.loadouts.find((l) => l.id === loadoutId);
  if (!loadout) {
    return { success: false, error: 'Loadout not found' };
  }

  if (loadout.status === 'ACTIVE') {
    return { success: false, error: 'Loadout already active' };
  }

  if (loadout.items.length === 0) {
    return { success: false, error: 'Loadout is empty' };
  }

  // Check for conflicts: items already DEPLOYED in other active loadouts
  const conflicts = [];
  for (const itemId of loadout.items) {
    const asset = db.data.assets.find((a) => a.id === itemId);
    if (asset && asset.status === 'DEPLOYED') {
      // Find which loadout has this item
      const conflictLoadout = db.data.loadouts.find(
        (l) => l.status === 'ACTIVE' && l.items.includes(itemId)
      );
      if (conflictLoadout) {
        conflicts.push(`${asset.name} is deployed in "${conflictLoadout.name}"`);
      }
    }
  }

  if (conflicts.length > 0) {
    return { success: false, error: 'Deployment conflict', conflicts };
  }

  // Check for missing dependencies (warning only)
  const missingDeps = [];
  for (const itemId of loadout.items) {
    const asset = db.data.assets.find((a) => a.id === itemId);
    if (asset && asset.dependencies && asset.dependencies.length > 0) {
      for (const depId of asset.dependencies) {
        if (!loadout.items.includes(depId)) {
          const depAsset = db.data.assets.find((a) => a.id === depId);
          if (depAsset) {
            missingDeps.push(`${asset.name} requires ${depAsset.name}`);
          }
        }
      }
    }
  }

  // Set all items to DEPLOYED status
  for (const itemId of loadout.items) {
    const asset = db.data.assets.find((a) => a.id === itemId);
    if (asset) {
      const oldStatus = asset.status;
      asset.status = 'DEPLOYED';

      // Log in flight recorder
      if (!asset.logs) asset.logs = [];
      asset.logs.push({
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'DEPLOYED',
        description: `Deployed in loadout "${loadout.name}"`,
        user: 'System',
      });
    }
  }

  // Set loadout to ACTIVE
  loadout.status = 'ACTIVE';
  loadout.deployed_at = Date.now();

  await db.write();
  console.log(`[SOUBI DB] Equipped loadout: ${loadout.name} (${loadout.items.length} items)`);

  return {
    success: true,
    loadout,
    warnings: missingDeps.length > 0 ? missingDeps : undefined
  };
}

/**
 * Return a loadout - Debrief and mark compromised items
 * Per BACKEND_SPEC.md: DORMANT, mark compromised/pristine, log history
 * @param {string} loadoutId - Loadout UUID
 * @param {string[]} compromisedItemIds - Items that captured data
 * @returns {{success: boolean, error?: string, loadout?: Object}}
 */
async function returnLoadout(loadoutId, compromisedItemIds = []) {
  if (!db) await initDatabase();

  const loadout = db.data.loadouts.find((l) => l.id === loadoutId);
  if (!loadout) {
    return { success: false, error: 'Loadout not found' };
  }

  if (loadout.status !== 'ACTIVE') {
    return { success: false, error: 'Loadout is not active' };
  }

  // Process each item in the loadout
  for (const itemId of loadout.items) {
    const asset = db.data.assets.find((a) => a.id === itemId);
    if (asset) {
      const isCompromised = compromisedItemIds.includes(itemId);
      const newStatus = isCompromised ? 'COMPROMISED' : 'PRISTINE';

      asset.status = newStatus;

      // Log in flight recorder
      if (!asset.logs) asset.logs = [];
      asset.logs.push({
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'RETURNED',
        description: isCompromised
          ? `Returned from "${loadout.name}" - DATA CAPTURED`
          : `Returned from "${loadout.name}" - Clean`,
        user: 'System',
      });
    }
  }

  // Set loadout to DORMANT
  loadout.status = 'DORMANT';
  loadout.returned_at = Date.now();

  await db.write();
  console.log(`[SOUBI DB] Returned loadout: ${loadout.name} (${compromisedItemIds.length} compromised)`);

  return { success: true, loadout };
}

/**
 * Get dependency tree for an asset
 * @param {string} assetId - Asset UUID
 * @returns {string[]} Array of dependency asset IDs (recursive)
 */
async function getAssetDependencies(assetId) {
  if (!db) await initDatabase();

  const deps = [];
  const visited = new Set();

  function collectDeps(id) {
    if (visited.has(id)) return;
    visited.add(id);

    const asset = db.data.assets.find((a) => a.id === id);
    if (asset && asset.dependencies) {
      for (const depId of asset.dependencies) {
        deps.push(depId);
        collectDeps(depId); // Recursive
      }
    }
  }

  collectDeps(assetId);
  return deps;
}

// ============================================
// FILE ATTACHMENT OPERATIONS
// Per BACKEND_SPEC.md Section 2.2 (files array)
// ============================================

/**
 * Add a file to an asset's files array
 * @param {string} assetId - Asset UUID
 * @param {Object} fileInfo - { name: string, path: string }
 * @returns {Object|null} Updated asset or null
 */
async function addFileToAsset(assetId, fileInfo) {
  if (!db) await initDatabase();

  const asset = db.data.assets.find((a) => a.id === assetId);
  if (!asset) {
    console.error('[SOUBI DB] Asset not found:', assetId);
    return null;
  }

  // Initialize files array if needed
  if (!asset.files) asset.files = [];

  // Add file
  asset.files.push({
    name: fileInfo.name,
    path: fileInfo.path,
    added_at: Date.now(),
  });

  // Log the attachment
  if (!asset.logs) asset.logs = [];
  asset.logs.push({
    id: generateUUID(),
    timestamp: Date.now(),
    type: 'FILE_ADDED',
    description: `Attached file: ${fileInfo.name}`,
    user: 'System',
  });

  await db.write();
  console.log(`[SOUBI DB] Added file to ${asset.name}: ${fileInfo.name}`);

  return asset;
}

/**
 * Remove a file from an asset's files array
 * @param {string} assetId - Asset UUID
 * @param {string} filePath - Path of file to remove
 * @returns {Object|null} Updated asset or null
 */
async function removeFileFromAsset(assetId, filePath) {
  if (!db) await initDatabase();

  const asset = db.data.assets.find((a) => a.id === assetId);
  if (!asset || !asset.files) {
    return null;
  }

  const fileIndex = asset.files.findIndex((f) => f.path === filePath);
  if (fileIndex === -1) {
    return null;
  }

  const removedFile = asset.files.splice(fileIndex, 1)[0];

  // Log the removal
  if (!asset.logs) asset.logs = [];
  asset.logs.push({
    id: generateUUID(),
    timestamp: Date.now(),
    type: 'FILE_REMOVED',
    description: `Removed file: ${removedFile.name}`,
    user: 'System',
  });

  await db.write();
  console.log(`[SOUBI DB] Removed file from ${asset.name}: ${removedFile.name}`);

  return asset;
}

async function factoryReset() {
  if (!db) await initDatabase();
  db.data = getDefaultData();
  await db.write();
  return { success: true };
}

/**
 * Export database to a specific path
 * @param {string} destinationPath 
 */
async function exportDatabase(destinationPath) {
  try {
    const sourcePath = getDbPath();
    await fs.copy(sourcePath, destinationPath);
    console.log('[SOUBI DB] Exported database to:', destinationPath);
    return { success: true };
  } catch (error) {
    console.error('[SOUBI DB] Export failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import database from a source file
 * Validates structure before overwriting
 * @param {string} sourcePath 
 */
async function importDatabase(sourcePath) {
  try {
    // 1. Read source file
    const data = await fs.readJson(sourcePath);

    // 2. Validate structure (basic check)
    if (!data.assets || !Array.isArray(data.assets) || !data.loadouts) {
      throw new Error('Invalid SOUBI database file');
    }

    // 3. Overwrite current DB
    if (!db) await initDatabase();
    db.data = data;
    await db.write();

    console.log('[SOUBI DB] Imported database from:', sourcePath);
    return { success: true };
  } catch (error) {
    console.error('[SOUBI DB] Import failed:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// INTEL OPERATIONS (The Vault)
// ============================================

/**
 * Get all captured intel
 */
async function getAllIntel() {
  if (!db) await initDatabase();
  return db.data.intel || [];
}

/**
 * Add new intel (captured from Ghost Node)
 * @param {Object} intelData
 */
async function addIntel(intelData) {
  if (!db) await initDatabase();

  const newIntel = {
    id: generateUUID(),
    type: intelData.type || 'RAW', // NFC_KEY, WIFI_HANDSHAKE
    data: intelData.data,
    timestamp: Date.now(),
    notes: intelData.notes || '',
    source: 'GHOST_NODE',
  };

  if (!db.data.intel) db.data.intel = [];

  db.data.intel.push(newIntel);
  await db.write();
  console.log(`[SOUBI DB] Captured intel: ${newIntel.type} (${newIntel.id})`);

  return newIntel;
}

/**
 * Upsert a wireless target (WiFi/BT)
 * Updates lastSeen if exists, creates if new
 * @param {Object} targetData
 */
async function upsertTarget(targetData) {
  if (!db) await initDatabase();

  if (!db.data.targets) db.data.targets = [];

  // Identify by MAC address (in data or meta.mac)
  const mac = targetData.meta?.mac || targetData.data;
  if (!mac) return null; // Can't track without unique ID

  const existingIndex = db.data.targets.findIndex(t =>
    (t.meta?.mac === mac) || (t.data === mac)
  );

  let target;
  if (existingIndex >= 0) {
    // Update existing
    target = db.data.targets[existingIndex];
    target.lastSeen = Date.now();
    target.rssi = targetData.meta?.rssi || target.rssi;
    // Update vendor if we just found it
    if (targetData.analysis?.vendor && !target.analysis?.vendor) {
      if (!target.analysis) target.analysis = {};
      target.analysis.vendor = targetData.analysis.vendor;
    }
  } else {
    // Create new
    target = {
      id: generateUUID(),
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      type: targetData.source || 'UNKNOWN',
      data: targetData.data,
      meta: targetData.meta || {},
      analysis: targetData.analysis || {}
    };
    db.data.targets.push(target);
  }

  await db.write();
  return target;
}

/**
 * Delete intel
 * @param {string} id
 */
async function deleteIntel(id) {
  if (!db) await initDatabase();

  const index = db.data.intel.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const deleted = db.data.intel.splice(index, 1)[0];
  await db.write();
  console.log(`[SOUBI DB] Deleted intel: ${deleted.id}`);

  return deleted;
}

module.exports = {
  getDbPath,
  initDatabase,
  getAllAssets,
  getAssetById,
  createAsset,
  deleteAsset,
  toggleAssetStatus,
  addFileToAsset,
  removeFileFromAsset,
  getAllLoadouts,
  createLoadout,
  updateLoadout,
  deleteLoadout,
  equipLoadout,
  returnLoadout,
  getAssetDependencies,
  factoryReset,
  exportDatabase,
  importDatabase,
  getAllIntel,
  addIntel,
  deleteIntel,
  upsertTarget,
};

