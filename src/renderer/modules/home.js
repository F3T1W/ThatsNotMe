const { ipcRenderer } = require('electron');
const { logger } = require('../utils/logger');
const { notifications } = require('../utils/notifications');
const { i18n } = require('../utils/i18n');

class HomeModule {
    constructor() {
        this.resetBtn = document.getElementById('btn-reset-stats');
        this.init();
    }

    init() {
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.handleResetStats());
        }
        // Stats are updated by other modules, but we can force refresh if needed.
        // For now, rely on dynamic updates or shared state if implemented later.
        // Actually, dataset module updates training count on load.
        // Training module should update models count.
        // Let's implement a simple refresher here for when page is shown
        const link = document.querySelector('.nav-link[data-page="home"]');
        if (link) {
            link.addEventListener('click', () => this.refreshStats());
        }
    }

    async refreshStats() {
        // Trigger dataset count update
        try {
            const images = await ipcRenderer.invoke('load-training-dataset');
            const countDisplay = document.getElementById('stat-training-count');
            if (countDisplay) countDisplay.textContent = images.length;
        } catch (e) { console.error(e); }

        // Trigger models count update
        try {
            const models = await ipcRenderer.invoke('get-models-list');
            const countDisplay = document.getElementById('stat-models-count');
            if (countDisplay) countDisplay.textContent = models.length;
        } catch (e) { console.error(e); }
    }

    async handleResetStats() {
        if (!confirm(i18n.t('home.reset_confirm'))) {
            return;
        }

        try {
            // 1. Clear Dataset
            const datasetResult = await ipcRenderer.invoke('clear-training-dataset');
            if (!datasetResult.success) throw new Error(datasetResult.error);

            // 2. Clear Models (Need new handler or manual deletion via node in renderer? No, main process)
            // We need to add 'clear-models' handler in main/handlers/training.js
            const modelsResult = await ipcRenderer.invoke('clear-models'); 
            if (!modelsResult.success) throw new Error(modelsResult.error);

            notifications.show('Statistics and data reset successfully', 'success');
            this.refreshStats();

        } catch (error) {
            logger.error('Error resetting stats', error);
            notifications.show(`Failed to reset: ${error.message}`, 'danger');
        }
    }
}

module.exports = { homeModule: new HomeModule() };
