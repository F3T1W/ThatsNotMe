const { logger } = require('../utils/logger');

/**
 * Registers update-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance.
 * @param {Electron.BrowserWindow} mainWindow - Main application window.
 * @param {Object} updaterConfig - Updater configuration.
 * @param {boolean} updaterConfig.updaterAvailable - Whether updater is available.
 * @param {Object} updaterConfig.autoUpdater - AutoUpdater instance.
 * @param {Function} updaterConfig.checkForUpdates - Function to check for updates.
 */
function registerUpdateHandlers(ipcMain, mainWindow, { updaterAvailable, autoUpdater, checkForUpdates }) {
  /**
   * Checks for application updates.
   * @returns {Promise<Object>} Result object with success status and optional error message.
   */
  ipcMain.handle('check-for-updates', async () => {
    if (!updaterAvailable || !autoUpdater) {
      return { success: false, error: 'Auto-updater not available.' };
    }
    try {
      checkForUpdates();
      return { success: true };
    } catch (error) {
      logger.error('Error checking for updates', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Downloads an available update.
   * @returns {Promise<Object>} Result object with success status and optional error message.
   */
  ipcMain.handle('download-update', async () => {
    if (!updaterAvailable || !autoUpdater) {
      return { success: false, error: 'Auto-updater not available.' };
    }
    try {
      autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      logger.error('Error downloading update', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Installs a downloaded update.
   * @returns {Promise<Object>} Result object with success status and optional error message.
   */
  ipcMain.handle('install-update', async () => {
    if (!updaterAvailable || !autoUpdater) {
      return { success: false, error: 'Auto-updater not available.' };
    }
    try {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      logger.error('Error installing update', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerUpdateHandlers };
