const { execFile } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');
const { pythonEnv } = require('../utils/python-env');

/**
 * Registers Python-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance.
 */
function registerPythonHandlers(ipcMain) {
  /**
   * Runs a Python script command.
   * @param {string} scriptName - Name of the script in python/ folder.
   * @param {string[]} args - Arguments for the script.
   * @returns {Promise<Object>} Output object.
   */
  async function runPythonScript(scriptName, args) {
    return new Promise((resolve, reject) => {
      const pythonPath = pythonEnv.getPythonPath();
      const scriptPath = path.join(process.cwd(), 'python', scriptName);
      
      logger.info(`Running Python script: ${scriptName}`, { args });

      execFile(pythonPath, [scriptPath, ...args], (error, stdout, stderr) => {
        if (error) {
          logger.error('Python script error', { error, stderr });
          reject({ error: stderr || error.message });
          return;
        }
        
        try {
          // Attempt to parse last line as JSON if possible, or return stdout
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
           // If not JSON, return raw output
           logger.warn('Could not parse Python output as JSON', { stdout });
           resolve({ output: stdout });
        }
      });
    });
  }

  ipcMain.handle('validate-images', async (event, datasetPath) => {
     try {
         return await runPythonScript('face_swap_trainer.py', ['--command', 'detect_faces', '--dataset_path', datasetPath]);
     } catch (error) {
         return { error: error.message };
     }
  });

  ipcMain.handle('check-python-installation', async () => {
      try {
          const installed = await pythonEnv.checkEnv();
          return { installed, version: '3.9.6' }; // Hardcoded version for now as we use venv
      } catch (error) {
          return { installed: false, error: error.message };
      }
  });
}

module.exports = { registerPythonHandlers };
