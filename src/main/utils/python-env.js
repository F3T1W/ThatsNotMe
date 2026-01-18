const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('./logger');

/**
 * Manages Python virtual environment.
 * @module python-env
 */
class PythonEnv {
  constructor() {
    this.rootDir = process.cwd();
    this.venvDir = path.join(this.rootDir, 'python', 'venv');
    this.requirementsPath = path.join(this.rootDir, 'python', 'requirements.txt');
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Gets the Python executable path.
   * @returns {string} Path to python executable.
   */
  getPythonPath() {
    if (this.isWindows) {
      return path.join(this.venvDir, 'Scripts', 'python.exe');
    }
    return path.join(this.venvDir, 'bin', 'python');
  }

  /**
   * Checks if Python environment is ready.
   * @returns {Promise<boolean>} True if ready.
   */
  async checkEnv() {
    const pythonPath = this.getPythonPath();
    return await fs.pathExists(pythonPath);
  }

  /**
   * Creates virtual environment and installs requirements.
   * @returns {Promise<void>}
   */
  async setup() {
    logger.info('Setting up Python environment...');
    
    // 1. Create venv if not exists
    if (!(await this.checkEnv())) {
      logger.info('Creating virtual environment...');
      await this.createVenv();
    }

    // 2. Install requirements
    logger.info('Installing requirements...');
    await this.installRequirements();

    // 3. Download Models (SKIPPED - Manual Mode)
    // logger.info('Checking and downloading models...');
    // await this.downloadModels();
    
    logger.info('Python environment setup complete.');
  }

  /**
   * Downloads required ML models.
   */
  downloadModels() {
    return new Promise((resolve, reject) => {
        const pythonPath = this.getPythonPath();
        const scriptPath = path.join(this.rootDir, 'python', 'download_models.py');
        
        const child = spawn(pythonPath, [scriptPath]);
        
        child.stdout.on('data', (data) => logger.debug(`model_dl stdout: ${data}`));
        child.stderr.on('data', (data) => logger.debug(`model_dl stderr: ${data}`));

        child.on('close', (code) => {
            if (code !== 0) {
                logger.error(`Model download failed with code ${code}`);
                reject(new Error('Model download failed'));
            } else {
                resolve();
            }
        });
    });
  }

  /**
   * Creates virtual environment.
   * @returns {Promise<void>}
   */
  createVenv() {
    return new Promise((resolve, reject) => {
      // Assuming 'python3' or 'python' is in PATH
      const pythonCommand = this.isWindows ? 'python' : 'python3';
      
      const child = spawn(pythonCommand, ['-m', 'venv', this.venvDir]);
      
      child.stdout.on('data', (data) => logger.debug(`venv stdout: ${data}`));
      child.stderr.on('data', (data) => logger.debug(`venv stderr: ${data}`));

      child.on('close', (code) => {
        if (code !== 0) {
          const msg = `venv creation failed with code ${code}`;
          logger.error(msg);
          reject(new Error(msg));
        } else {
          resolve();
        }
      });
      
      child.on('error', (err) => {
          logger.error('Failed to start venv creation', err);
          reject(err);
      });
    });
  }

  /**
   * Installs requirements.
   * @returns {Promise<void>}
   */
  installRequirements() {
    return new Promise((resolve, reject) => {
      const pythonPath = this.getPythonPath();
      
      const child = spawn(pythonPath, ['-m', 'pip', 'install', '-r', this.requirementsPath]);
      
      child.stdout.on('data', (data) => logger.debug(`pip stdout: ${data}`));
      child.stderr.on('data', (data) => logger.debug(`pip stderr: ${data}`));

      child.on('close', (code) => {
        if (code !== 0) {
            const msg = `pip install failed with code ${code}`;
            logger.error(msg);
            reject(new Error(msg));
        } else {
            logger.info('Requirements installed successfully');
            resolve();
        }
      });
      
      child.on('error', (err) => {
        logger.error('Failed to start pip install', err);
        reject(err);
      });
    });
  }
}

module.exports = { pythonEnv: new PythonEnv() };
