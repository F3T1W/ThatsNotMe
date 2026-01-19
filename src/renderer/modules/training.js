const { ipcRenderer } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');
const { i18n } = require('../utils/i18n');

class TrainingModule {
    constructor() {
        this.container = document.getElementById('page-train-model');
        this.init();
    }

    init() {
        this.render();
        this.attachListeners();
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card fade-in">
                        <div class="card-header">
                            <h5 class="mb-0 text-white" data-i18n="training.title">Train New Model</h5>
                        </div>
                        <div class="card-body">
                            <form id="train-form">
                                <div class="mb-4">
                                    <label class="form-label text-white" data-i18n="training.model_name">Model Name</label>
                                    <input type="text" class="form-control form-control-lg" id="model-name-input" data-i18n="training.enter_name" placeholder="e.g. My Face" required>
                                    <div class="form-text text-white-50" data-i18n="training.helper">.fsem will be appended automatically</div>
                                </div>
                                
                                <div class="alert alert-info border-0 bg-opacity-10 bg-info text-info">
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    <span data-i18n="dataset.info">Ensure you have uploaded at least 10-20 photos in "Training Dataset" tab before starting.</span>
                                </div>

                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary btn-lg" id="btn-start-training">
                                        <i class="bi bi-cpu-fill me-2"></i> <span data-i18n="training.start">Start Training</span>
                                    </button>
                                </div>
                            </form>
                            
                            <div id="training-status" class="mt-4 d-none">
                                <h6 class="text-white mb-2" data-i18n="training.progress">Training Progress</h6>
                                <div class="progress" style="height: 6px; background-color: #333;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" style="width: 100%"></div>
                                </div>
                                <p class="text-white-50 mt-2 small text-center" data-i18n="training.in_progress">Processing images and extracting features... This may take a minute.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachListeners() {
        const form = document.getElementById('train-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleTrain(e));
        }
    }

    async handleTrain(e) {
        e.preventDefault();
        const nameInput = document.getElementById('model-name-input');
        const btn = document.getElementById('btn-start-training');
        const status = document.getElementById('training-status');
        const modelName = nameInput.value.trim();

        if (!modelName) {
            notifications.show('Please enter a model name', 'warning');
            return;
        }

        try {
            // UI Update
            btn.disabled = true;
            nameInput.disabled = true;
            status.classList.remove('d-none');
            
            notifications.show('Training started. Please wait...', 'info');

            const result = await ipcRenderer.invoke('train-model', { modelName });

            if (result.success) {
                notifications.show(`Model "${modelName}" created successfully!`, 'success');
                logger.info('Model trained', result);
                // Reset form
                document.getElementById('train-form').reset();
            } else {
                 throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            logger.error('Training failed', error);
            notifications.show(`Training failed: ${error.error || error.message}`, 'danger');
        } finally {
            btn.disabled = false;
            nameInput.disabled = false;
            status.classList.add('d-none');
        }
    }
}

module.exports = { trainingModule: new TrainingModule() };
