const path = require('path');
const { logger } = require('../utils/logger');
const { pythonEnv } = require('../utils/python-env');
const { execFile } = require('child_process');
const { shell, app } = require('electron');

/**
 * Registers training-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance.
 */
function registerTrainingHandlers(ipcMain) {
  
  /**
   * Starts the training process (Smart Embedding Extraction).
   * @param {Electron.IpcMainInvokeEvent} event - IPC event.
   * @param {Object} params - Training parameters.
   * @param {string} params.modelName - Name of the model.
   */
  ipcMain.handle('train-model', async (event, { modelName }) => {
    logger.info(`Starting training for model: ${modelName}`);
    
    return new Promise((resolve, reject) => {
        const pythonPath = pythonEnv.getPythonPath();
        const scriptPath = path.join(pythonEnv.pythonScriptsDir, 'face_swap_trainer.py');
        const datasetPath = path.join(app.getPath('userData'), 'datasets', 'training');
        
        // Output path: models/MyModel.fsem
        const outputDir = pythonEnv.modelsDir;
        const outputPath = path.join(outputDir, `${modelName}.fsem`);
        
        // Ensure models dir exists
        const fs = require('fs-extra');
        fs.ensureDirSync(outputDir);

        const args = [
            '--command', 'train',
            '--dataset_path', datasetPath,
            '--output_path', outputPath,
            '--model_name', modelName
        ];
        
        // Pass env with MODELS_DIR
        const env = pythonEnv.getEnv();

        logger.info('Executing python script', { args });

        // Corrected syntax: options object merges env and maxBuffer
        execFile(pythonPath, [scriptPath, ...args], { env, maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                logger.error('Training script failed', { error, stderr });
                // Don't return immediately, check stdout for result
            }

            try {
                // Find JSON in output
                const lines = stdout.trim().split('\n');
                let result = null;
                // Parse last valid JSON line
                for (let i = lines.length - 1; i >= 0; i--) {
                    try {
                        const potentialJson = lines[i].trim();
                        if (potentialJson.startsWith('{') && potentialJson.endsWith('}')) {
                            result = JSON.parse(potentialJson);
                            break;
                        }
                    } catch (e) {}
                }

                if (result) {
                    if (result.success) {
                        logger.info('Training completed successfully');
                        resolve(result);
                    } else {
                        logger.error('Training failed logic', result);
                        reject(new Error(result.error));
                    }
                } else {
                     if (error) {
                         const msg = stderr || error.message;
                         logger.error('Training script crashed', { msg });
                         reject(new Error(msg));
                     } else {
                         logger.warn('No JSON output from training script', { stdout, stderr });
                         reject(new Error('No valid response from training script. Check logs.'));
                     }
                }
            } catch (e) {
                logger.error('Error parsing training output', e);
                reject(new Error(`Failed to parse output: ${e.message}`));
            }
        });
    });
  });

  /**
   * Get list of trained models.
   */
  ipcMain.handle('get-models-list', async () => {
      const fs = require('fs-extra');
      const modelsDir = pythonEnv.modelsDir;
      await fs.ensureDir(modelsDir);
      
      const files = await fs.readdir(modelsDir);
      // Filter .fsem files
      const models = files
          .filter(f => f.endsWith('.fsem'))
          .map(f => {
              const name = path.basename(f, '.fsem');
              // Check if preview image exists
              const previewPath = path.join(modelsDir, `${name}.jpg`);
              const hasPreview = fs.existsSync(previewPath);
              return {
                  name: name,
                  path: path.join(modelsDir, f),
                  preview: hasPreview ? previewPath : null
              };
          });
          
      return models;
  });

  ipcMain.handle('clear-models', async () => {
      const fs = require('fs-extra');
      const modelsDir = pythonEnv.modelsDir;
      try {
          // Delete all .fsem and associated .jpg previews
          const files = await fs.readdir(modelsDir);
          for (const file of files) {
              if (file.endsWith('.fsem') || file.endsWith('.jpg')) {
                  // Keep default models if any? No, we only keep models in 'models' folder which are user trained.
                  // Checkpoints are in 'models/checkpoints'. 'models' root is for user models.
                  // BUT WAIT: 'checkpoints' is inside 'models'. We MUST NOT delete 'models/checkpoints'.
                  const filePath = path.join(modelsDir, file);
                  // Safety check: Don't delete directories (like checkpoints)
                  if ((await fs.stat(filePath)).isFile()) {
                       await fs.unlink(filePath);
                  }
              }
          }
          return { success: true };
      } catch (error) {
          logger.error('Failed to clear models', error);
          return { success: false, error: error.message };
      }
  });

  ipcMain.handle('open-models-folder', async () => {
      const modelsPath = pythonEnv.modelsDir;
      await shell.openPath(modelsPath);
      return { success: true };
  });
}

module.exports = { registerTrainingHandlers };
