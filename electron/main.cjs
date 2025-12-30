const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db.cjs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) app.quit();

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

// ============================================
// CUSTOM PROTOCOL FOR ASSET IMAGES
// Securely serves files from userData directory
// ============================================
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'soubi-asset',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

function createWindow() {
  const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.round(screenWidth * 0.85),
    height: Math.round(screenHeight * 0.85),
    minWidth: 500,
    minHeight: 400,
    useContentSize: true, 
    backgroundColor: '#050505',
    frame: false, 
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, 
      contextIsolation: true, 
      sandbox: true,
    },
  });

  // Load Vite dev server in development, built files in production
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  }
}

// ============================================
// IPC HANDLERS - Per BACKEND_SPEC.md
// ============================================

/**
 * armory:get-all
 * Returns the complete list of assets from the database
 */
ipcMain.handle('armory:get-all', async () => {
  try {
    const assets = await db.getAllAssets();
    console.log('[IPC] armory:get-all - Returned', assets.length, 'assets');
    return { success: true, data: assets };
  } catch (error) {
    console.error('[IPC] armory:get-all error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * asset:toggle-status
 * Toggles an asset between PRISTINE and COMPROMISED
 * @param {string} id - Asset UUID
 */
ipcMain.handle('asset:toggle-status', async (event, id) => {
  try {
    const updatedAsset = await db.toggleAssetStatus(id);
    if (!updatedAsset) {
      return { success: false, error: 'Asset not found' };
    }
    
    // Return updated asset list for UI refresh
    const assets = await db.getAllAssets();
    console.log('[IPC] asset:toggle-status - Toggled', updatedAsset.name);
    return { success: true, data: assets };
  } catch (error) {
    console.error('[IPC] asset:toggle-status error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * armory:create
 * Creates a new asset with optional image
 * @param {Object} assetData - { name, category, serial_number, notes, imagePath }
 */
ipcMain.handle('armory:create', async (event, assetData) => {
  try {
    let imagePath = null;
    
    // If image path provided, import it to assets folder
    if (assetData.imagePath) {
      const fileSystem = require('./fileSystem.cjs');
      const imageResult = await fileSystem.importImage(assetData.imagePath);
      if (imageResult.success) {
        imagePath = imageResult.relativePath;
      }
    }

    // Create asset with processed image path
    const newAsset = await db.createAsset({
      name: assetData.name,
      category: assetData.category,
      serial_number: assetData.serial_number,
      notes: assetData.notes,
      image_path: imagePath,
    });

    // Return updated asset list
    const assets = await db.getAllAssets();
    console.log('[IPC] armory:create - Created', newAsset.name);
    return { success: true, data: assets, created: newAsset };
  } catch (error) {
    console.error('[IPC] armory:create error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * armory:delete
 * Deletes an asset and optionally its unused image
 * @param {string} id - Asset UUID
 */
ipcMain.handle('armory:delete', async (event, id) => {
  try {
    // Get asset before deletion to check image
    const asset = await db.getAssetById(id);
    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    // Delete from database
    const deletedAsset = await db.deleteAsset(id);
    
    // Try to clean up orphaned image
    if (deletedAsset && deletedAsset.image_path) {
      const fileSystem = require('./fileSystem.cjs');
      const allAssets = await db.getAllAssets();
      await fileSystem.deleteImageIfUnused(deletedAsset.image_path, allAssets);
    }

    // Return updated asset list
    const assets = await db.getAllAssets();
    console.log('[IPC] armory:delete - Deleted', deletedAsset?.name);
    return { success: true, data: assets };
  } catch (error) {
    console.error('[IPC] armory:delete error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * fs:select-image
 * Opens file dialog to select an image
 */
ipcMain.handle('fs:select-image', async () => {
  try {
    const fileSystem = require('./fileSystem.cjs');
    const result = await fileSystem.selectImageDialog(mainWindow);
    return result;
  } catch (error) {
    console.error('[IPC] fs:select-image error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * fs:select-file
 * Opens file dialog to select any file (for The Locker)
 */
ipcMain.handle('fs:select-file', async () => {
  try {
    const fileSystem = require('./fileSystem.cjs');
    const result = await fileSystem.selectFileDialog(mainWindow);
    return result;
  } catch (error) {
    console.error('[IPC] fs:select-file error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * asset:add-file
 * Adds a file to an asset's locker
 * @param {{assetId: string, filePath: string}} payload
 */
ipcMain.handle('asset:add-file', async (event, payload) => {
  try {
    const fileSystem = require('./fileSystem.cjs');
    
    // Import the file to assets directory
    const importResult = await fileSystem.importFile(payload.filePath);
    if (!importResult.success) {
      return importResult;
    }

    // Add to asset's files array in DB
    const updatedAsset = await db.addFileToAsset(payload.assetId, {
      name: importResult.originalName,
      path: importResult.relativePath,
    });

    if (!updatedAsset) {
      return { success: false, error: 'Failed to update asset' };
    }

    // Return updated asset list
    const assets = await db.getAllAssets();
    console.log('[IPC] asset:add-file - Added', importResult.originalName, 'to', updatedAsset.name);
    return { success: true, data: assets, asset: updatedAsset };
  } catch (error) {
    console.error('[IPC] asset:add-file error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * asset:remove-file
 * Removes a file from an asset's locker
 * @param {{assetId: string, filePath: string}} payload
 */
ipcMain.handle('asset:remove-file', async (event, payload) => {
  try {
    const updatedAsset = await db.removeFileFromAsset(payload.assetId, payload.filePath);
    
    if (!updatedAsset) {
      return { success: false, error: 'File not found' };
    }

    const assets = await db.getAllAssets();
    console.log('[IPC] asset:remove-file - Removed file from', updatedAsset.name);
    return { success: true, data: assets, asset: updatedAsset };
  } catch (error) {
    console.error('[IPC] asset:remove-file error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * asset:open-file
 * Opens a file with system default application
 * @param {string} filePath - Relative path to file
 */
ipcMain.handle('asset:open-file', async (event, filePath) => {
  try {
    const fileSystem = require('./fileSystem.cjs');
    const result = await fileSystem.openFileWithSystem(filePath);
    return result;
  } catch (error) {
    console.error('[IPC] asset:open-file error:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// LOADOUT IPC HANDLERS
// Per BACKEND_SPEC.md Section 3.3
// ============================================

/**
 * loadout:get-all
 * Returns all loadouts
 */
ipcMain.handle('loadout:get-all', async () => {
  try {
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:get-all - Returned', loadouts.length, 'loadouts');
    return { success: true, data: loadouts };
  } catch (error) {
    console.error('[IPC] loadout:get-all error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:create
 * Creates a new loadout
 * @param {string} name - Loadout name
 */
ipcMain.handle('loadout:create', async (event, name) => {
  try {
    const newLoadout = await db.createLoadout(name);
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:create - Created', newLoadout.name);
    return { success: true, data: loadouts, created: newLoadout };
  } catch (error) {
    console.error('[IPC] loadout:create error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:update
 * Updates loadout items (add/remove)
 * @param {{loadoutId: string, itemIds: string[]}} payload
 */
ipcMain.handle('loadout:update', async (event, payload) => {
  try {
    const updated = await db.updateLoadoutItems(payload.loadoutId, payload.itemIds);
    if (!updated) {
      return { success: false, error: 'Failed to update loadout' };
    }
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:update - Updated', updated.name);
    return { success: true, data: loadouts };
  } catch (error) {
    console.error('[IPC] loadout:update error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:delete
 * Deletes a loadout
 * @param {string} id - Loadout UUID
 */
ipcMain.handle('loadout:delete', async (event, id) => {
  try {
    const deleted = await db.deleteLoadout(id);
    if (!deleted) {
      return { success: false, error: 'Failed to delete loadout' };
    }
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:delete - Deleted', deleted.name);
    return { success: true, data: loadouts };
  } catch (error) {
    console.error('[IPC] loadout:delete error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:equip
 * Deploys a loadout (sets items to DEPLOYED, loadout to ACTIVE)
 * @param {string} loadoutId - Loadout UUID
 */
ipcMain.handle('loadout:equip', async (event, loadoutId) => {
  try {
    const result = await db.equipLoadout(loadoutId);
    if (!result.success) {
      return result; // Contains error and optional conflicts array
    }
    
    // Return both updated assets and loadouts
    const assets = await db.getAllAssets();
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:equip - Equipped', result.loadout.name);
    return { 
      success: true, 
      assets, 
      loadouts, 
      warnings: result.warnings 
    };
  } catch (error) {
    console.error('[IPC] loadout:equip error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:return
 * Returns a loadout from deployment with debrief
 * @param {{loadoutId: string, compromisedItems: string[]}} payload
 */
ipcMain.handle('loadout:return', async (event, payload) => {
  try {
    const result = await db.returnLoadout(payload.loadoutId, payload.compromisedItems);
    if (!result.success) {
      return result;
    }
    
    // Return both updated assets and loadouts
    const assets = await db.getAllAssets();
    const loadouts = await db.getAllLoadouts();
    console.log('[IPC] loadout:return - Returned', result.loadout.name);
    return { success: true, assets, loadouts };
  } catch (error) {
    console.error('[IPC] loadout:return error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * loadout:get-dependencies
 * Gets all dependencies for an asset
 * @param {string} assetId - Asset UUID
 */
ipcMain.handle('loadout:get-dependencies', async (event, assetId) => {
  try {
    const deps = await db.getAssetDependencies(assetId);
    return { success: true, data: deps };
  } catch (error) {
    console.error('[IPC] loadout:get-dependencies error:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// WINDOW CONTROL HANDLERS
// ============================================

ipcMain.handle('sys:factory-reset', async () => {
  try {
    console.log('[IPC] sys:factory-reset requested');
    await db.factoryReset();
    // Reload window to reset all frontend state
    mainWindow.reload();
    return { success: true };
  } catch (error) {
    console.error('[IPC] sys:factory-reset error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * db:export
 * Opens save dialog and backups the database
 */
ipcMain.handle('db:export', async () => {
  try {
    const { dialog } = require('electron');
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export SOUBI Data',
      defaultPath: `soubi_backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Database', extensions: ['json'] }]
    });

    if (!filePath) return { success: false, cancelled: true };

    return await db.exportDatabase(filePath);
  } catch (error) {
    console.error('[IPC] db:export error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * db:import
 * Opens file dialog, validates and imports data, then reloads app
 */
ipcMain.handle('db:import', async () => {
  try {
    const { dialog } = require('electron');
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import SOUBI Data',
      properties: ['openFile'],
      filters: [{ name: 'JSON Database', extensions: ['json'] }]
    });

    if (!filePaths || filePaths.length === 0) return { success: false, cancelled: true };

    const result = await db.importDatabase(filePaths[0]);
    if (result.success) {
      mainWindow.reload(); // Hard reload to reflect new state
    }
    return result;
  } catch (error) {
    console.error('[IPC] db:import error:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// WINDOW CONTROL HANDLERS
// ============================================

ipcMain.on('win:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('win:maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('win:close', () => {
  mainWindow?.close();
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(async () => {
  // Register custom protocol handler for asset images
  protocol.handle('soubi-asset', (request) => {
    // Extract relative path from URL and decode (e.g. %20 -> space)
    const relativePath = decodeURIComponent(request.url.replace('soubi-asset://', ''));
    // Normalize path to prevent directory traversal or weird slashes
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(app.getPath('userData'), normalizedPath);
    
    // Convert OS path to file:// URL safely using built-in url module
    const fileUrl = require('url').pathToFileURL(filePath).toString();
    return net.fetch(fileUrl);
  });
  console.log('[SOUBI] Custom protocol registered: soubi-asset://');

  // Initialize database before creating window
  await db.initDatabase();
  console.log('[SOUBI] Database initialized at:', db.getDbPath());
  
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
