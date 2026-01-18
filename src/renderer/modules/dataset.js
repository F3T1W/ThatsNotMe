const { ipcRenderer } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');

/**
 * Dataset management module for UI.
 * @module dataset-module
 */
class DatasetModule {
    constructor() {
        this.previewContainer = document.getElementById('training-preview');
        this.selectBtn = document.getElementById('btn-select-training');
        this.resetBtn = document.getElementById('btn-reset-dataset');
        this.countDisplay = document.getElementById('stat-training-count');
        
        this.init();
    }

    /**
     * Initializes event listeners.
     */
    init() {
        if (this.selectBtn) {
            this.selectBtn.addEventListener('click', () => this.handleSelection());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.handleReset());
        }
        this.loadExistingImages();
    }

    /**
     * Handles reset dataset button click.
     */
    async handleReset() {
        if (!confirm('Are you sure you want to delete all training images? This cannot be undone.')) {
            return;
        }

        try {
            const result = await ipcRenderer.invoke('clear-training-dataset');
            if (result.success) {
                notifications.show('Dataset cleared successfully', 'success');
                await this.loadExistingImages();
            } else {
                notifications.show(`Error clearing dataset: ${result.error}`, 'danger');
            }
        } catch (error) {
            logger.error('Error clearing dataset', error);
            notifications.show('Failed to clear dataset', 'danger');
        }
    }

    /**
     * Handles file selection button click.
     */
    async handleSelection() {
        try {
            this.selectBtn.disabled = true;
            this.selectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            
            const filePaths = await ipcRenderer.invoke('select-training-images');
            
            if (filePaths.length > 0) {
                logger.info('Selected images', { count: filePaths.length });
                const result = await ipcRenderer.invoke('save-training-images', filePaths);
                
                if (result.success) {
                    notifications.show(`Successfully saved ${result.count} images`, 'success');
                    await this.loadExistingImages();
                    this.validateDataset();
                } else {
                    notifications.show(`Error: ${result.error}`, 'danger');
                }
            }
        } catch (error) {
            logger.error('Error selecting images', error);
            notifications.show('Failed to select images', 'danger');
        } finally {
            this.selectBtn.disabled = false;
            this.selectBtn.innerHTML = '<i class="bi bi-folder-plus"></i> Select Training Images';
        }
    }

    /**
     * Validates the current dataset using Python backend.
     */
    async validateDataset() {
        try {
            notifications.show('Validating images for faces...', 'info');
            // Assuming default training path for now, matching backend
            const datasetPath = 'datasets/training'; 
            // We need absolute path for python script usually, but let's see how python handler handles it. 
            // The python handler joins it with cwd if not absolute? No, it passes args directly.
            // face_swap_trainer.py expects a path. If relative, it's relative to where python is run? 
            // Actually python handler uses execFile, cwd is likely project root.
            // So 'datasets/training' should work if relative to project root.
            const validationPath = require('path').join(process.cwd(), 'datasets/training');

            const result = await ipcRenderer.invoke('validate-images', validationPath);
            
            if (result.error) {
                logger.error('Validation error', result.error);
                notifications.show(`Validation failed: ${result.error}`, 'danger');
                return;
            }

            if (result.results) {
                const noFaces = result.results.filter(r => r.faces_count === 0);
                if (noFaces.length > 0) {
                    notifications.show(`Warning: ${noFaces.length} images have no detected faces.`, 'warning');
                } else {
                    notifications.show('All images have valid faces!', 'success');
                }
            }
        } catch (error) {
            logger.error('Error validating dataset', error);
        }
    }

    /**
     * Loads and displays existing images in the dataset.
     */
    async loadExistingImages() {
        try {
            const images = await ipcRenderer.invoke('load-training-dataset');
            this.renderPreview(images);
            if (this.countDisplay) {
                this.countDisplay.textContent = images.length;
            }
        } catch (error) {
            logger.error('Error loading dataset', error);
        }
    }

    /**
     * Renders image previews.
     * @param {string[]} images - Array of image paths.
     */
    renderPreview(images) {
        if (!this.previewContainer) return;
        
        this.previewContainer.innerHTML = images.map(src => `
            <div class="col-6 col-md-4 col-lg-3 fade-in">
                <div class="card h-100">
                    <img src="file://${src}" class="card-img-top img-thumbnail" style="height: 150px; object-fit: cover;" alt="Dataset Image">
                </div>
            </div>
        `).join('');
    }
}

module.exports = { datasetModule: new DatasetModule() };
