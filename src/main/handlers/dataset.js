const { dialog } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Registers dataset-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance.
 */
function registerDatasetHandlers(ipcMain) {
  /**
   * Opens a dialog to select training images.
   * @returns {Promise<string[]>} Array of selected file paths.
   */
  ipcMain.handle('select-training-images', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
    });

    if (result.canceled) {
      return [];
    }
    return result.filePaths;
  });

  /**
   * Saves training images to the dataset folder.
   * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
   * @param {string[]} filePaths - Array of source file paths.
   * @returns {Promise<Object>} Result object.
   */
  ipcMain.handle('save-training-images', async (event, filePaths) => {
    try {
      const trainingDir = path.join(process.cwd(), 'datasets', 'training');
      await fs.ensureDir(trainingDir);

      // Clear existing directory? Or append? Assuming append or overwrite unique names.
      // For MVP let's just copy.
      const savedFiles = [];
      
      for (const filePath of filePaths) {
        const fileName = path.basename(filePath);
        const destPath = path.join(trainingDir, fileName);
        await fs.copy(filePath, destPath);
        savedFiles.push(destPath);
      }
      
      logger.info(`Saved ${savedFiles.length} images to training dataset.`);
      return { success: true, count: savedFiles.length, paths: savedFiles };
    } catch (error) {
      logger.error('Error saving training images', error);
      return { success: false, error: error.message };
    }
  });
  
  /**
   * Loads existing training images.
   * @returns {Promise<string[]>} Array of image paths.
   */
  ipcMain.handle('load-training-dataset', async () => {
     try {
      const trainingDir = path.join(process.cwd(), 'datasets', 'training');
      if (await fs.pathExists(trainingDir)) {
          const files = await fs.readdir(trainingDir);
          // Return full paths
          return files
            .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
            .map(f => path.join(trainingDir, f));
      }
      return [];
     } catch (error) {
         logger.error('Error loading training dataset', error);
         return [];
     }
  });

  /**
   * Clears the training dataset folder.
   * @returns {Promise<Object>} Result object.
   */
  ipcMain.handle('clear-training-dataset', async () => {
    try {
      const trainingDir = path.join(process.cwd(), 'datasets', 'training');
      if (await fs.pathExists(trainingDir)) {
        await fs.emptyDir(trainingDir);
      }
      logger.info('Training dataset cleared.');
      return { success: true };
    } catch (error) {
      logger.error('Error clearing training dataset', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerDatasetHandlers };
