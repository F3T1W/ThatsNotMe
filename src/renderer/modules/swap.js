const { ipcRenderer } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');

class SwapModule {
    constructor() {
        this.container = document.getElementById('page-face-swap');
        this.selectedModelPath = null;
        this.selectedTargetImage = null;
        this.init();
    }

    init() {
        this.render();
        this.attachListeners();
        // Load models list when page is shown
        const link = document.querySelector('.nav-link[data-page="face-swap"]');
        if (link) {
            link.addEventListener('click', () => this.refreshModels());
        }
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="row h-100">
                <!-- Left Column: Controls -->
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white">Settings</h5>
                        </div>
                        <div class="card-body">
                            <!-- Model Selector -->
                            <div class="mb-4">
                                <label class="form-label text-white">Select Model</label>
                                <select class="form-select form-select-lg bg-dark text-white border-secondary" id="swap-model-select">
                                    <option selected disabled>Loading models...</option>
                                </select>
                            </div>

                            <!-- Target Image -->
                            <div class="mb-4">
                                <label class="form-label text-white">Target Photo</label>
                                <div class="d-grid">
                                    <button class="btn btn-outline-secondary btn-lg" id="btn-select-target">
                                        <i class="bi bi-image me-2"></i> Choose Photo
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Enhancement Options -->
                            <div class="mb-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="check-enhance">
                                    <label class="form-check-label text-white" for="check-enhance">
                                        Enhance Face Quality (Slower)
                                    </label>
                                </div>
                                <div class="form-text text-white-50">Uses GFPGAN to restore details and fix blurriness. Requires downloading additional model (~300MB).</div>
                            </div>
                            
                            <!-- Action -->
                            <div class="d-grid mt-5">
                                <button class="btn btn-primary btn-lg py-3" id="btn-start-swap" disabled>
                                    <i class="bi bi-magic me-2"></i> Swap Face
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="swap-status" class="alert alert-info d-none fade-in">
                        <div class="d-flex align-items-center">
                            <span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>
                            <div>
                                <strong>Processing...</strong><br>
                                Applying face swap. Please wait.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Preview -->
                <div class="col-md-8">
                    <div class="card h-100" style="min-height: 500px;">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0 text-white">Preview</h5>
                            <span class="badge bg-secondary" id="preview-badge">No Image</span>
                        </div>
                        <div class="card-body d-flex align-items-center justify-content-center bg-black position-relative p-0 overflow-hidden">
                            <div id="image-comparison" class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <p class="text-white-50">Select a target photo to start</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachListeners() {
        const selectBtn = document.getElementById('btn-select-target');
        const swapBtn = document.getElementById('btn-start-swap');
        const modelSelect = document.getElementById('swap-model-select');

        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.handleSelectTarget());
        }
        if (swapBtn) {
            swapBtn.addEventListener('click', () => this.handleSwap());
        }
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.selectedModelPath = e.target.value;
                this.updateSwapButton();
            });
        }
    }

    async refreshModels() {
        const select = document.getElementById('swap-model-select');
        if (!select) return;

        try {
            const models = await ipcRenderer.invoke('get-models-list');
            
            if (models.length === 0) {
                select.innerHTML = '<option disabled selected>No models found. Train one first!</option>';
            } else {
                select.innerHTML = '<option disabled selected value="">Select a trained model...</option>' + 
                    models.map(m => `<option value="${m.path}">${m.name}</option>`).join('');
            }
        } catch (error) {
            logger.error('Failed to load models', error);
            select.innerHTML = '<option disabled>Error loading models</option>';
        }
    }

    async handleSelectTarget() {
        try {
            const filePath = await ipcRenderer.invoke('select-swap-target');
            if (filePath) {
                this.selectedTargetImage = filePath;
                this.displayImage(filePath, 'Original');
                this.updateSwapButton();
                document.getElementById('preview-badge').textContent = 'Original';
                document.getElementById('preview-badge').className = 'badge bg-primary';
            }
        } catch (error) {
            logger.error('Error selecting target', error);
        }
    }

    updateSwapButton() {
        const btn = document.getElementById('btn-start-swap');
        if (btn) {
            btn.disabled = !(this.selectedModelPath && this.selectedTargetImage);
        }
    }

    displayImage(path, label) {
        const container = document.getElementById('image-comparison');
        if (container) {
            container.innerHTML = `
                <img src="file://${path}" class="img-fluid" style="max-height: 100%; object-fit: contain;">
            `;
        }
    }

    async handleSwap() {
        const btn = document.getElementById('btn-start-swap');
        const status = document.getElementById('swap-status');
        const enhanceCheck = document.getElementById('check-enhance');
        
        try {
            btn.disabled = true;
            status.classList.remove('d-none');
            
            const result = await ipcRenderer.invoke('start-face-swap', {
                modelPath: this.selectedModelPath,
                targetPath: this.selectedTargetImage,
                enhance: enhanceCheck ? enhanceCheck.checked : false
            });

            if (result.success) {
                notifications.show('Face swap completed!', 'success');
                this.displayImage(result.output_path, 'Swapped Result');
                document.getElementById('preview-badge').textContent = 'Result';
                document.getElementById('preview-badge').className = 'badge bg-success';
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Swap failed', error);
            notifications.show(`Swap failed: ${error.message}`, 'danger');
        } finally {
            btn.disabled = false;
            status.classList.add('d-none');
        }
    }
}

module.exports = { swapModule: new SwapModule() };
