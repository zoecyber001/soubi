/**
 * SOUBI File System Module
 * Handles local file operations for assets
 * Per BACKEND_SPEC.md Section 4.2
 */

const { app, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

/**
 * Get the assets directory path
 * @returns {string} Path to soubi_assets folder
 */
function getAssetsPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'soubi_assets');
}

/**
 * Get the images directory path
 * @returns {string} Path to images folder
 */
function getImagesPath() {
  return path.join(getAssetsPath(), 'images');
}

/**
 * Get the files directory path (for documents, scripts, etc.)
 * @returns {string} Path to files folder
 */
function getFilesPath() {
  return path.join(getAssetsPath(), 'files');
}

/**
 * Ensure all asset directories exist
 */
async function ensureAssetDirs() {
  const assetsPath = getAssetsPath();
  await fs.ensureDir(path.join(assetsPath, 'images'));
  await fs.ensureDir(path.join(assetsPath, 'files'));
  await fs.ensureDir(path.join(assetsPath, 'firmware'));
  await fs.ensureDir(path.join(assetsPath, 'docs'));
}

/**
 * Hash a file using SHA-256
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA-256 hash of the file
 */
async function hashFile(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Import an image file to the assets directory
 * Per BACKEND_SPEC.md: Hash file content for deduplication
 * @param {string} sourcePath - Path to source image file
 * @returns {Promise<{success: boolean, relativePath?: string, error?: string}>}
 */
async function importImage(sourcePath) {
  try {
    // Ensure directories exist
    await ensureAssetDirs();
    
    // Verify source file exists
    const exists = await fs.pathExists(sourcePath);
    if (!exists) {
      return { success: false, error: 'Source file not found' };
    }

    // Get file extension
    const ext = path.extname(sourcePath).toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExts.includes(ext)) {
      return { success: false, error: `Invalid image format: ${ext}` };
    }

    // Hash file for unique filename (deduplication)
    const hash = await hashFile(sourcePath);
    const hashedFilename = `${hash.substring(0, 16)}${ext}`;
    
    // Destination path
    const imagesPath = getImagesPath();
    const destPath = path.join(imagesPath, hashedFilename);

    // Copy if doesn't already exist (deduplication)
    if (!await fs.pathExists(destPath)) {
      await fs.copy(sourcePath, destPath);
      console.log(`[SOUBI FS] Imported image: ${hashedFilename}`);
    } else {
      console.log(`[SOUBI FS] Image already exists: ${hashedFilename}`);
    }

    // Return relative path for storage in DB
    const relativePath = `soubi_assets/images/${hashedFilename}`;
    return { success: true, relativePath };

  } catch (error) {
    console.error('[SOUBI FS] Import image error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import any file to the assets/files directory
 * Uses hash + original filename for uniqueness while preserving name
 * @param {string} sourcePath - Path to source file
 * @returns {Promise<{success: boolean, relativePath?: string, originalName?: string, error?: string}>}
 */
async function importFile(sourcePath) {
  try {
    await ensureAssetDirs();
    
    const exists = await fs.pathExists(sourcePath);
    if (!exists) {
      return { success: false, error: 'Source file not found' };
    }

    // Get original filename and extension
    const originalName = path.basename(sourcePath);
    const ext = path.extname(sourcePath).toLowerCase();
    const baseName = path.basename(sourcePath, ext);

    // Hash for uniqueness (but keep original name for display)
    const hash = await hashFile(sourcePath);
    const hashedFilename = `${hash.substring(0, 8)}_${baseName}${ext}`;
    
    // Destination path
    const filesPath = getFilesPath();
    const destPath = path.join(filesPath, hashedFilename);

    // Copy file
    if (!await fs.pathExists(destPath)) {
      await fs.copy(sourcePath, destPath);
      console.log(`[SOUBI FS] Imported file: ${hashedFilename}`);
    } else {
      console.log(`[SOUBI FS] File already exists: ${hashedFilename}`);
    }

    const relativePath = `soubi_assets/files/${hashedFilename}`;
    return { 
      success: true, 
      relativePath,
      originalName,
    };

  } catch (error) {
    console.error('[SOUBI FS] Import file error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an image file if not used by other assets
 * @param {string} relativePath - Relative path stored in DB
 * @param {Array} allAssets - All assets to check for usage
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteImageIfUnused(relativePath, allAssets) {
  try {
    if (!relativePath) return false;

    // Count how many assets use this image
    const usageCount = allAssets.filter(a => a.image_path === relativePath).length;
    
    if (usageCount <= 1) {
      // Safe to delete (only used by the asset being deleted)
      const fullPath = path.join(app.getPath('userData'), relativePath);
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        console.log(`[SOUBI FS] Deleted unused image: ${relativePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[SOUBI FS] Delete image error:', error);
    return false;
  }
}

/**
 * Get the full path for a relative asset path
 * @param {string} relativePath - Relative path from DB
 * @returns {string} Full absolute path
 */
function getFullAssetPath(relativePath) {
  if (!relativePath) return null;
  return path.join(app.getPath('userData'), relativePath);
}

/**
 * Show file open dialog for selecting an image
 * @param {BrowserWindow} parentWindow - Parent window for modal
 * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
 */
async function selectImageDialog(parentWindow) {
  try {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: 'Select Asset Image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Selection canceled' };
    }

    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('[SOUBI FS] Select image dialog error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Show file open dialog for selecting any file
 * @param {BrowserWindow} parentWindow - Parent window for modal
 * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
 */
async function selectFileDialog(parentWindow) {
  try {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: 'Select File to Attach',
      filters: [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
        { name: 'Scripts', extensions: ['py', 'sh', 'bat', 'ps1', 'js'] },
        { name: 'Archives', extensions: ['zip', 'tar', 'gz', '7z'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Selection canceled' };
    }

    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('[SOUBI FS] Select file dialog error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Open a file with the system default application
 * @param {string} relativePath - Relative path from DB
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function openFileWithSystem(relativePath) {
  try {
    const fullPath = getFullAssetPath(relativePath);
    if (!fullPath) {
      return { success: false, error: 'Invalid path' };
    }

    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return { success: false, error: 'File not found' };
    }

    await shell.openPath(fullPath);
    console.log(`[SOUBI FS] Opened file: ${relativePath}`);
    return { success: true };

  } catch (error) {
    console.error('[SOUBI FS] Open file error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAssetsPath,
  getImagesPath,
  getFilesPath,
  ensureAssetDirs,
  importImage,
  importFile,
  deleteImageIfUnused,
  getFullAssetPath,
  selectImageDialog,
  selectFileDialog,
  openFileWithSystem,
};
