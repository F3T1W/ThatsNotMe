const path = require('path');
const { dialog, app } = require('electron');
const { logger } = require('../utils/logger');
const { pythonEnv } = require('../utils/python-env');
const { execFile } = require('child_process');

// Helper function to get results directory
function getResultsDir() {
    return path.join(app.getPath('userData'), 'datasets', 'results');
}

/**
 * Registers swap-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance.
 */
function registerSwapHandlers(ipcMain) {
  
  /**
   * Selects a target image for swapping.
   */
  ipcMain.handle('select-swap-target', async () => {
      const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
      });
      
      if (result.canceled) return null;
      return result.filePaths[0];
  });

  /**
   * Starts the face swap process.
   * @param {Electron.IpcMainInvokeEvent} event - IPC event.
   * @param {Object} params - Swap parameters.
   * @param {string} params.modelPath - Path to the .fsem model file.
   * @param {string} params.targetPath - Path to the target image.
   * @param {boolean} params.enhance - Whether to enhance the face.
   * @param {number} params.upscale - Upscale factor (1-4).
   */
  ipcMain.handle('start-face-swap', async (event, { modelPath, targetPath, enhance, upscale }) => {
    logger.info('Starting face swap', { modelPath, targetPath, enhance, upscale });
    
    return new Promise((resolve, reject) => {
        const pythonPath = pythonEnv.getPythonPath();
        const scriptPath = path.join(pythonEnv.pythonScriptsDir, 'face_swap_trainer.py');
        
        // Output path: datasets/results/swap_TIMESTAMP.jpg
        const outputDir = getResultsDir();
        const timestamp = Date.now();
        const outputPath = path.join(outputDir, `swap_${timestamp}.jpg`);

        const args = [
            '--command', 'swap',
            '--model_path', modelPath,
            '--target_image', targetPath,
            '--output_path', outputPath
        ];
        
        if (enhance) {
            args.push('--enhance');
            if (upscale) {
                args.push('--upscale', upscale.toString());
            }
        }

        logger.info('Executing python script for swap', { args });

        // Pass env with MODELS_DIR
        const env = pythonEnv.getEnv();

        // Using execFile with default encoding which is 'utf8'
        // If stderr has content, it might not be a crash, just warnings (TensorFlow/InsightFace are noisy)
        // Pass cwd to ensure writing temp files in userdata if needed
        const options = { 
            env, 
            maxBuffer: 1024 * 1024 * 50,
            cwd: pythonEnv.modelsDir // Set cwd to models dir (writable)
        };
        
        execFile(pythonPath, [scriptPath, ...args], options, (error, stdout, stderr) => {
            if (error) {
                logger.error('Swap script failed', { error, stderr });
                // Don't reject immediately on stderr unless error is set
                // reject({ error: stderr || error.message });
                // Check stdout first
            }
            
            // InsightFace prints a lot of logs to stderr/stdout that aren't errors
            // We only care if we get a valid JSON response at the end

            try {
                // Find JSON in output
                const lines = stdout.trim().split('\n');
                let result = null;
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
                        logger.info('Swap completed successfully');
                        resolve(result);
                    } else {
                        logger.error('Swap failed logic', result);
                        reject(new Error(result.error));
                    }
                } else {
                     // If we have an error object, reject with it, otherwise if stdout is empty but stderr has something
                     if (error) {
                         const msg = stderr || error.message;
                         logger.error('Swap script crashed', { msg });
                         reject(new Error(msg));
                     } else {
                         logger.warn('No JSON output from swap script', { stdout, stderr });
                         reject(new Error('No valid response from swap engine. Check logs.'));
                     }
                }
            } catch (e) {
                logger.error('Error parsing swap output', e);
                reject(new Error(`Failed to parse output: ${e.message}`));
            }
        });
    });
  });

  /**
   * Starts batch face swapping or video swapping process.
   */
  ipcMain.handle('start-batch-swap', async (event, { modelPath, inputPath, inputDir, enhance, upscale, mode }) => {
      return new Promise((resolve, reject) => {
          const { spawn } = require('child_process');
          const pythonPath = pythonEnv.getPythonPath();
          const scriptPath = path.join(pythonEnv.pythonScriptsDir, 'face_swap_trainer.py');
          
          // Handle backward compatibility if inputDir is passed
          const actualInputPath = inputPath || inputDir;
          const actualMode = mode || 'batch';

          let command = 'batch_swap';
          let outputTarget = '';
          
          if (actualMode === 'video') {
              command = 'video_swap';
              // Output file
              outputTarget = path.join(getResultsDir(), `video_swap_${Date.now()}.mp4`);
          } else {
              command = 'batch_swap';
              // Output directory
              outputTarget = path.join(getResultsDir(), `batch_${Date.now()}`);
          }
          
          const args = [
              scriptPath,
              '--command', command,
              '--model_path', modelPath,
              '--dataset_path', actualInputPath, // dataset_path arg is used for input dir/file
              '--output_path', outputTarget,
              '--upscale', String(upscale)
          ];
          
          if (enhance) args.push('--enhance');

          logger.info(`Starting ${actualMode} swap`, { args });

          const env = pythonEnv.getEnv();
          // Ensure we have PATH for ffmpeg if needed (moviepy usually handles it but good to know)
          const child = spawn(pythonPath, args, { env, cwd: pythonEnv.modelsDir });

          child.stdout.on('data', (data) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed) continue;
                  try {
                      const json = JSON.parse(trimmed);
                      if (json.progress !== undefined) {
                          event.sender.send('batch-progress', json);
                      } else if (json.success) {
                          resolve(json);
                      } else if (json.error) {
                          if (!json.count) { // If count exists, it might be partial success in batch
                              reject(new Error(json.error)); 
                          }
                      }
                  } catch (e) {
                      logger.debug(`${actualMode} stdout: ${trimmed}`);
                  }
              }
          });

          child.stderr.on('data', (data) => {
              // Moviepy writes progress to stderr, we might want to parse it if we didn't disable logger
              // But we disabled logger in python script and print our own JSON progress
              logger.warn(`${actualMode} stderr: ${data}`);
          });

          child.on('close', (code) => {
              if (code !== 0) {
                  reject(new Error(`Process exited with code ${code}`));
              }
          });
      });
  });
}

module.exports = { registerSwapHandlers };
