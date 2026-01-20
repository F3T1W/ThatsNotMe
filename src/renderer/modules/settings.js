const { ipcRenderer, shell } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');
const { i18n } = require('../utils/i18n');

class SettingsModule {
    constructor() {
        this.container = document.getElementById('page-settings');
        this.themes = [
            { id: 'dark', name: 'Dark', color: '#dc3545', bg: '#121212' },
            { id: 'green', name: 'Green', color: '#198754', bg: '#0f291e' },
            { id: 'cyan', name: 'Cyan', color: '#0dcaf0', bg: '#052c36' },
            { id: 'pink', name: 'Pink', color: '#d63384', bg: '#2e0b1d' },
            { id: 'indigo', name: 'Indigo', color: '#6610f2', bg: '#100b2e' },
            { id: 'amber', name: 'Amber', color: '#ffc107', bg: '#332701' }
        ];
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
        this.attachEventListeners();
        this.applyTheme(this.currentTheme);
        this.updatePythonStatus();
        i18n.updateAll(); // Initial translation
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <h2 class="mb-4 text-center"><i class="bi bi-gear me-2"></i><span data-i18n="settings.title">Settings</span></h2>
                    
                    <!-- Language -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white"><i class="bi bi-translate me-2"></i><span data-i18n="settings.language">Language</span></h5>
                        </div>
                        <div class="card-body">
                            <select class="form-select bg-dark text-white border-secondary" id="language-select">
                                <option value="en">English</option>
                                <option value="ru">Русский</option>
                                <option value="ja">日本語</option>
                                <option value="uz">O'zbek</option>
                            </select>
                        </div>
                    </div>

                    <!-- Python Environment -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white"><i class="bi bi-code-square me-2"></i><span data-i18n="settings.python_env">Python Environment</span></h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style="background: rgba(255,255,255,0.05);">
                                <div>
                                    <div class="d-flex align-items-center mb-1">
                                        <span class="me-2" data-i18n="settings.python_status">Python Status:</span>
                                        <span class="badge bg-secondary" id="py-status-badge" data-i18n="settings.checking">Checking...</span>
                                    </div>
                                    <div class="d-flex align-items-center mb-1">
                                        <span class="me-2" data-i18n="settings.venv_status">Virtual Environment:</span>
                                        <span class="badge bg-secondary" id="venv-status-badge" data-i18n="settings.checking">Checking...</span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <span class="me-2" data-i18n="settings.pkg_status">Packages:</span>
                                        <span class="badge bg-secondary" id="pkg-status-badge" data-i18n="settings.checking">Checking...</span>
                                    </div>
                                </div>
                                <div class="text-end text-muted small">Python 3.9.x</div>
                            </div>

                            <div class="d-flex gap-2 mb-3">
                                <button class="btn btn-outline-primary" id="btn-check-python">
                                    <i class="bi bi-search me-2"></i><span data-i18n="settings.check">Check Python</span>
                                </button>
                                <button class="btn btn-outline-primary" id="btn-setup-python">
                                    <i class="bi bi-tools me-2"></i><span data-i18n="settings.setup">Setup Environment</span>
                                </button>
                                <button class="btn btn-outline-primary" id="btn-install-pkgs">
                                    <i class="bi bi-box-seam me-2"></i><span data-i18n="settings.install">Install Packages</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Updates -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white"><i class="bi bi-arrow-clockwise me-2"></i><span data-i18n="settings.updates">Updates</span></h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span data-i18n="settings.current_version">Current Version:</span>
                                <span class="badge bg-primary">1.0.0</span>
                            </div>
                            <p class="text-white-50 small" data-i18n="settings.auto_update_disabled">Auto-update is disabled. Please download updates manually from GitHub Releases.</p>
                            <button class="btn btn-primary w-100" id="btn-download-update">
                                <i class="bi bi-download me-2"></i><span data-i18n="settings.download">Download Latest Release</span>
                            </button>
                        </div>
                    </div>

                    <!-- Models Folder -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white"><i class="bi bi-folder2-open me-2"></i><span data-i18n="settings.models_folder">Models Folder</span></h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <h6 class="text-white mb-2"><i class="bi bi-cloud-arrow-down me-2"></i><span data-i18n="settings.download_models">Download Models</span></h6>
                                <p class="text-white-50 mb-2" data-i18n="settings.download_desc">Download all required models (GFPGAN, RealESRGAN, Inswapper) automatically.</p>
                                <button class="btn btn-success" id="btn-download-models">
                                    <i class="bi bi-cloud-download me-2"></i><span data-i18n="settings.download_models">Download Models</span>
                                </button>
                            </div>
                            <hr class="border-secondary">
                            <p class="text-white-50 mb-3" data-i18n="settings.open_folder_desc">Open the folder containing all trained model versions.</p>
                            <button class="btn btn-primary" id="btn-open-models">
                                <i class="bi bi-folder me-2"></i><span data-i18n="settings.open_folder">Open Models Folder</span>
                            </button>
                        </div>
                    </div>

                    <!-- Theme -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0 text-white"><i class="bi bi-palette me-2"></i><span data-i18n="settings.theme">Theme</span></h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3" id="theme-grid">
                                <!-- Themes render here -->
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Download Progress Modal -->
            <div class="modal fade" id="downloadModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark border-secondary">
                  <div class="modal-header border-secondary">
                    <h5 class="modal-title text-white"><i class="bi bi-download me-2"></i><span data-i18n="settings.downloading">Downloading models...</span></h5>
                  </div>
                  <div class="modal-body">
                    <div class="mb-2 d-flex justify-content-between text-white">
                        <span id="download-filename">Initializing...</span>
                        <span id="download-percent">0%</span>
                    </div>
                    <div class="progress bg-secondary" style="height: 20px;">
                      <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" id="download-progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <p class="text-white-50 small mt-2 text-center" id="download-status">Please wait, this may take a while.</p>
                  </div>
                  <div class="modal-footer border-secondary" id="download-modal-footer" style="display: none;">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
        `;

        // Set selected language
        const langSelect = document.getElementById('language-select');
        if(langSelect) langSelect.value = i18n.locale;

        this.renderThemes();
    }

    renderThemes() {
        const grid = document.getElementById('theme-grid');
        if (!grid) return;

        grid.innerHTML = this.themes.map(theme => `
            <div class="col-4">
                <div class="theme-card ${this.currentTheme === theme.id ? 'active' : ''}" 
                     data-theme="${theme.id}" 
                     style="cursor: pointer; border: 2px solid ${this.currentTheme === theme.id ? '#dc3545' : 'transparent'}; border-radius: 8px; overflow: hidden;">
                    <div style="height: 40px; background-color: ${theme.bg}; position: relative;">
                         <div style="position: absolute; bottom: 10px; left: 10px; width: 60%; height: 10px; background-color: ${theme.color}; border-radius: 4px;"></div>
                    </div>
                    <div class="p-2 text-center small text-white bg-dark">
                        ${theme.name}
                    </div>
                </div>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Language Selection
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                i18n.setLocale(e.target.value);
            });
        }

        // Theme Selection
        const grid = document.getElementById('theme-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.theme-card');
                if (card) {
                    const themeId = card.dataset.theme;
                    this.setTheme(themeId);
                }
            });
        }

        // Python Buttons
        document.getElementById('btn-check-python')?.addEventListener('click', () => this.checkPython());
        document.getElementById('btn-setup-python')?.addEventListener('click', () => this.setupPython());
        document.getElementById('btn-install-pkgs')?.addEventListener('click', () => this.installPackages());

        // Update Button
        document.getElementById('btn-download-update')?.addEventListener('click', () => {
             shell.openExternal('https://github.com/F3T1W/ThatsNotMe/releases');
        });

        // Models Folder
        document.getElementById('btn-open-models')?.addEventListener('click', () => {
            ipcRenderer.invoke('open-models-folder');
        });

        // Download Models Button
        document.getElementById('btn-download-models')?.addEventListener('click', () => {
            this.startModelDownload();
        });
        
        // Listen for download events (ensure single listener)
        ipcRenderer.removeAllListeners('download-progress');
        ipcRenderer.removeAllListeners('download-complete');
        ipcRenderer.removeAllListeners('download-error');

        ipcRenderer.on('download-progress', (event, data) => {
            this.updateDownloadProgress(data);
        });

        ipcRenderer.on('download-complete', () => {
            this.finishDownload(true);
        });

        ipcRenderer.on('download-error', (event, error) => {
            this.finishDownload(false, error);
        });
    }

    startModelDownload() {
        // Show Modal
        try {
            const modalEl = document.getElementById('downloadModal');
            this.downloadModal = new bootstrap.Modal(modalEl);
            this.downloadModal.show();
        } catch (e) {
            console.error("Bootstrap modal error:", e);
            // Fallback if bootstrap is not defined
            notifications.show("Starting download (Modal failed to open)...", "info");
        }

        // Reset Progress UI
        document.getElementById('download-filename').innerText = i18n.t('test.initializing');
        document.getElementById('download-percent').innerText = '0%';
        const bar = document.getElementById('download-progress-bar');
        bar.style.width = '0%';
        bar.classList.add('progress-bar-animated');
        bar.classList.remove('bg-danger', 'bg-success');
        
        document.getElementById('download-status').innerText = i18n.t('swap.wait');
        document.getElementById('download-modal-footer').style.display = 'none';

        // Trigger IPC
        ipcRenderer.send('download-models');
    }

    updateDownloadProgress(data) {
        if (data.status === 'completed' || data.status === 'exists') {
            document.getElementById('download-filename').innerText = `Checked: ${data.filename}`;
        } else {
             document.getElementById('download-filename').innerText = `${i18n.t('settings.downloading')} ${data.filename}`;
        }
        
        document.getElementById('download-percent').innerText = `${data.progress}%`;
        document.getElementById('download-progress-bar').style.width = `${data.progress}%`;
    }

    finishDownload(success, error) {
        const bar = document.getElementById('download-progress-bar');
        bar.classList.remove('progress-bar-animated');
        
        if (success) {
            bar.classList.add('bg-success');
            bar.style.width = '100%';
            document.getElementById('download-filename').innerText = i18n.t('settings.download_complete');
            document.getElementById('download-status').innerText = i18n.t('settings.download_complete');
            notifications.show(i18n.t('settings.download_complete'), 'success');
        } else {
            bar.classList.add('bg-danger');
            document.getElementById('download-filename').innerText = i18n.t('settings.download_error');
             document.getElementById('download-status').innerText = error || 'Unknown error';
             notifications.show(i18n.t('settings.download_error'), 'danger');
        }

        // Show close button
        document.getElementById('download-modal-footer').style.display = 'block';
    }

    setTheme(themeId) {
        this.currentTheme = themeId;
        localStorage.setItem('theme', themeId);
        this.applyTheme(themeId);
        this.renderThemes(); // Re-render to update active border
    }

    applyTheme(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (theme) {
            document.documentElement.style.setProperty('--primary-color', theme.color);
            // Hex to RGB
            const r = parseInt(theme.color.slice(1, 3), 16);
            const g = parseInt(theme.color.slice(3, 5), 16);
            const b = parseInt(theme.color.slice(5, 7), 16);
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
            
            // Override Bootstrap Primary Color
            document.documentElement.style.setProperty('--bs-primary', theme.color);
            document.documentElement.style.setProperty('--bs-primary-rgb', `${r}, ${g}, ${b}`);
        }
    }

    async checkPython() {
        try {
             const result = await ipcRenderer.invoke('check-python-installation');
             if (result.installed) {
                 this.updateStatusBadges(true, true, true);
                 notifications.show(i18n.t('settings.installed'), 'success');
             } else {
                 this.updateStatusBadges(false, false, false);
                 notifications.show(i18n.t('settings.missing'), 'danger');
             }
        } catch (e) {
            this.updateStatusBadges(false, false, false);
            notifications.show(`Error: ${e.message}`, 'danger');
        }
    }

    async setupPython() {
        notifications.show(i18n.t('settings.setup_info'), 'info');
    }

    async installPackages() {
         this.checkPython();
    }

    updatePythonStatus() {
        // Initial check
        this.checkPython();
    }

    updateStatusBadges(python, venv, packages) {
        const setBadge = (id, active) => {
            const el = document.getElementById(id);
            if (el) {
                el.className = `badge bg-${active ? 'success' : 'danger'}`;
                // Use i18n for badge text
                const key = active ? (id === 'py-status-badge' ? 'settings.installed' : (id === 'venv-status-badge' ? 'settings.exists' : 'settings.installed')) : 'settings.missing';
                el.innerText = i18n.t(key);
                el.setAttribute('data-i18n', key);
            }
        };
        setBadge('py-status-badge', python);
        setBadge('venv-status-badge', venv);
        setBadge('pkg-status-badge', packages);
    }
}

module.exports = { settingsModule: new SettingsModule() };
