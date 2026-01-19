const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { logger } = require('./utils/logger');
const { registerDatasetHandlers } = require('./handlers/dataset');
const { registerPythonHandlers } = require('./handlers/python');
const { registerTrainingHandlers } = require('./handlers/training');
const { registerSwapHandlers } = require('./handlers/swap');
const { registerUpdateHandlers } = require('./handlers/updates');
const { pythonEnv } = require('./utils/python-env');

let mainWindow;

/**
 * Creates the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // For simplicity as requested in MVP, ideally should be true with preload
    },
    backgroundColor: '#121212',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Open DevTools in development
  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.webContents.openDevTools();
  // }
}

/**
 * Initializes the application.
 */
async function initialize() {
  logger.info('Starting application...');

  await app.whenReady();
  createWindow();

  // Register Handlers
  registerDatasetHandlers(ipcMain);
  registerPythonHandlers(ipcMain);
  registerTrainingHandlers(ipcMain);
  registerSwapHandlers(ipcMain);

  // Setup Python Environment in background
  pythonEnv.setup().then(() => {
      logger.info('Python environment ready');
      mainWindow?.webContents.send('python-ready');
  }).catch(err => {
      logger.error('Failed to setup Python environment', err);
      mainWindow?.webContents.send('python-error', err.message);
  });
  
  // Auto-updater setup
  autoUpdater.logger = logger;
  registerUpdateHandlers(ipcMain, mainWindow, {
    updaterAvailable: true,
    autoUpdater: autoUpdater,
    checkForUpdates: () => autoUpdater.checkForUpdates()
  });
  
  // Check for updates in production
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

initialize().catch(err => {
  logger.error('Failed to initialize application', err);
});
