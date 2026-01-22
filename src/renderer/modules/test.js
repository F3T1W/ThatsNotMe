const { ipcRenderer } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');
const { i18n } = require('../utils/i18n');

class TestModule {
    constructor() {
        this.container = document.getElementById('page-face-swap');
        this.selectedModelPath = null;
        this.selectedInputPath = null; // Can be folder or file
        this.outputFolder = null;
        this.mode = 'batch'; // 'batch' or 'video'
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
        
        // Listen for progress
        ipcRenderer.on('batch-progress', (event, data) => {
            this.updateProgress(data);
        });
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="row justify-content-center w-100">
                <div class="col-md-8 col-lg-6">
                    <div class="card fade-in">
                        <div class="card-header">
                            <h5 class="mb-0 text-white" data-i18n="test.title">Batch Face Swap</h5>
                        </div>
                        <div class="card-body">
                            <!-- Mode Selection -->
                            <div class="mb-4">
                                <label class="form-label text-white" data-i18n="test.mode">Mode</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="swap-mode" id="mode-batch" autocomplete="off" checked>
                                    <label class="btn btn-outline-primary" for="mode-batch">
                                        <i class="bi bi-images me-2"></i><span data-i18n="test.mode_photos">Photos (Batch)</span>
                                    </label>

                                    <input type="radio" class="btn-check" name="swap-mode" id="mode-video" autocomplete="off">
                                    <label class="btn btn-outline-primary" for="mode-video">
                                        <i class="bi bi-camera-video me-2"></i><span data-i18n="test.mode_video">Video</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Model Selector -->
                            <div class="mb-4">
                                <label class="form-label text-white" data-i18n="swap.select_model">Select Model</label>
                                <select class="form-select bg-dark text-white border-secondary" id="test-model-select">
                                    <option selected disabled data-i18n="swap.loading_models">Loading models...</option>
                                </select>
                            </div>

                            <!-- Input Selection -->
                            <div class="mb-4">
                                <label class="form-label text-white" id="label-input-selection" data-i18n="test.input_folder">Input Folder</label>
                                <div class="d-grid">
                                    <button class="btn btn-outline-primary btn-lg" id="btn-select-input">
                                        <i class="bi bi-folder2-open me-2"></i> <span id="btn-select-text" data-i18n="test.select_folder_btn">Select Folder with Photos</span>
                                    </button>
                                </div>
                                <div class="form-text text-white-50 mt-1" id="input-path-display" data-i18n="test.no_selection">No selection</div>
                            </div>
                            
                            <!-- Enhancement Options -->
                            <div class="mb-4">
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input" type="checkbox" id="test-check-enhance">
                                    <label class="form-check-label text-white" for="test-check-enhance" data-i18n="swap.enhance">
                                        Enhance Face Quality
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Action -->
                            <div class="d-grid mt-4">
                                <button class="btn btn-primary btn-lg py-3" id="btn-start-batch" disabled>
                                    <i class="bi bi-play-circle-fill me-2"></i> <span id="btn-start-text" data-i18n="test.start_batch">Start Batch Processing</span>
                                </button>
                            </div>
                            
                            <!-- Progress -->
                            <div id="batch-status" class="mt-4 d-none">
                                <div class="d-flex justify-content-between text-white-50 small mb-1">
                                    <span data-i18n="test.progress">Progress</span>
                                    <span id="batch-eta" data-i18n="test.calculating">Calculating ETA...</span>
                                </div>
                                <div class="progress mb-2" style="height: 10px; background-color: #333;">
                                    <div id="batch-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p class="text-center text-white small mb-3" id="batch-details" data-i18n="test.initializing">Processing...</p>
                            </div>

                            <!-- Output -->
                            <div class="d-grid mt-2">
                                <button class="btn btn-outline-success" id="btn-open-output" disabled>
                                    <i class="bi bi-folder-check me-2"></i> <span data-i18n="test.open_output">Open Output Folder</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachListeners() {
        const selectBtn = document.getElementById('btn-select-input');
        const startBtn = document.getElementById('btn-start-batch');
        const openBtn = document.getElementById('btn-open-output');
        const modelSelect = document.getElementById('test-model-select');
        const modeBatch = document.getElementById('mode-batch');
        const modeVideo = document.getElementById('mode-video');

        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.handleSelectInput());
        }
        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStartBatch());
        }
        if (openBtn) {
            openBtn.addEventListener('click', () => this.handleOpenOutput());
        }
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.selectedModelPath = e.target.value;
                this.updateStartButton();
            });
        }
        if (modeBatch) {
            modeBatch.addEventListener('change', () => this.setMode('batch'));
        }
        if (modeVideo) {
            modeVideo.addEventListener('change', () => this.setMode('video'));
        }
    }

    setMode(mode) {
        this.mode = mode;
        this.selectedInputPath = null;
        
        const labelInput = document.getElementById('label-input-selection');
        const btnText = document.getElementById('btn-select-text');
        const pathDisplay = document.getElementById('input-path-display');
        const startText = document.getElementById('btn-start-text');
        
        // Reset display
        pathDisplay.textContent = i18n.t('test.no_selection');
        pathDisplay.setAttribute('data-i18n', 'test.no_selection');
        this.updateStartButton();

        if (mode === 'batch') {
            labelInput.textContent = i18n.t('test.input_folder');
            labelInput.setAttribute('data-i18n', 'test.input_folder');
            btnText.textContent = i18n.t('test.select_folder_btn');
            btnText.setAttribute('data-i18n', 'test.select_folder_btn');
            startText.textContent = i18n.t('test.start_batch');
            startText.setAttribute('data-i18n', 'test.start_batch');
        } else {
            labelInput.textContent = i18n.t('test.input_video');
            labelInput.setAttribute('data-i18n', 'test.input_video');
            btnText.textContent = i18n.t('test.select_video_btn');
            btnText.setAttribute('data-i18n', 'test.select_video_btn');
            startText.textContent = i18n.t('test.start_video');
            startText.setAttribute('data-i18n', 'test.start_video');
        }
    }

    async refreshModels() {
        const select = document.getElementById('test-model-select');
        if (!select) return;

        try {
            const models = await ipcRenderer.invoke('get-models-list');
            
            if (models.length === 0) {
                select.innerHTML = `<option disabled selected data-i18n="swap.no_models">${i18n.t('swap.no_models')}</option>`;
            } else {
                select.innerHTML = `<option disabled selected value="" data-i18n="swap.select_placeholder">${i18n.t('swap.select_placeholder')}</option>` + 
                    models.map(m => `<option value="${m.path}">${m.name}</option>`).join('');
            }
        } catch (error) {
            logger.error('Failed to load models', error);
            select.innerHTML = `<option disabled data-i18n="swap.error_loading">${i18n.t('swap.error_loading')}</option>`;
        }
    }

    async handleSelectInput() {
        try {
            let path;
            if (this.mode === 'batch') {
                path = await ipcRenderer.invoke('select-folder');
            } else {
                path = await ipcRenderer.invoke('select-video-file');
            }

            if (path) {
                this.selectedInputPath = path;
                const pathEl = document.getElementById('input-path-display');
                pathEl.textContent = path;
                pathEl.removeAttribute('data-i18n');
                this.updateStartButton();
            }
        } catch (error) {
            logger.error('Error selecting input', error);
        }
    }

    updateStartButton() {
        const btn = document.getElementById('btn-start-batch');
        if (btn) {
            btn.disabled = !(this.selectedModelPath && this.selectedInputPath);
        }
    }

    async handleStartBatch() {
        const btn = document.getElementById('btn-start-batch');
        const status = document.getElementById('batch-status');
        const enhanceCheck = document.getElementById('test-check-enhance');
        const openBtn = document.getElementById('btn-open-output');
        
        try {
            btn.disabled = true;
            openBtn.disabled = true;
            status.classList.remove('d-none');
            this.resetProgress();
            
            const result = await ipcRenderer.invoke('start-batch-swap', {
                modelPath: this.selectedModelPath,
                inputPath: this.selectedInputPath, // Renamed from inputDir
                enhance: enhanceCheck ? enhanceCheck.checked : false,
                upscale: 1,
                mode: this.mode // Pass mode
            });

            if (result.success) {
                this.outputFolder = this.mode === 'batch' ? result.output_dir : require('path').dirname(result.output_path);
                openBtn.disabled = false;
                
                const msg = this.mode === 'batch' 
                    ? i18n.t('test.success_msg').replace('{count}', result.count)
                    : i18n.t('test.video_success');
                    
                notifications.show(msg, 'success');
                document.getElementById('batch-details').textContent = i18n.t('test.completed');
                document.getElementById('batch-progress-bar').style.width = '100%';
                document.getElementById('batch-progress-bar').classList.remove('progress-bar-animated');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Process failed', error);
            notifications.show(i18n.t('test.fail_msg').replace('{error}', error.message), 'danger');
            document.getElementById('batch-details').textContent = i18n.t('test.failed');
        } finally {
            btn.disabled = false;
        }
    }

    resetProgress() {
        document.getElementById('batch-progress-bar').style.width = '0%';
        document.getElementById('batch-progress-bar').classList.add('progress-bar-animated');
        document.getElementById('batch-eta').textContent = i18n.t('test.calculating');
        document.getElementById('batch-details').textContent = i18n.t('test.initializing');
    }

    updateProgress(data) {
        if (!data) return;
        const bar = document.getElementById('batch-progress-bar');
        const eta = document.getElementById('batch-eta');
        const details = document.getElementById('batch-details');
        
        if (bar) bar.style.width = `${data.progress}%`;
        if (eta) eta.textContent = i18n.t('test.eta').replace('{seconds}', data.eta_seconds);
        if (details) details.textContent = i18n.t('test.processing')
            .replace('{current}', data.current)
            .replace('{total}', data.total)
            .replace('{filename}', data.filename);
    }

    async handleOpenOutput() {
        if (this.outputFolder) {
            await ipcRenderer.invoke('open-folder', this.outputFolder);
        }
    }
}

module.exports = { testModule: new TestModule() };
