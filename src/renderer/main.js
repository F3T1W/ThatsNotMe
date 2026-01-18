const { ipcRenderer } = require('electron');
const { logger } = require('./utils/logger');
// Import modules to initialize them
const { datasetModule } = require('./modules/dataset');
const { trainingModule } = require('./modules/training');
const { swapModule } = require('./modules/swap');

const { notifications } = require('./utils/notifications');

/**
 * Main renderer orchestrator.
 * Handles navigation and global events.
 */
class App {
    constructor() {
        this.initNavigation();
        this.initUpdates();
        this.initPythonStatus();
        logger.info('Renderer app initialized');
    }

    /**
     * Initializes Python status listeners.
     */
    initPythonStatus() {
        ipcRenderer.on('python-ready', () => {
            logger.info('Python environment is ready');
            notifications.show('AI Engine Ready', 'success');
        });

        ipcRenderer.on('python-error', (event, error) => {
            logger.error('Python environment error', error);
            notifications.show(`AI Engine Error: ${error}`, 'danger');
        });
    }

    /**
     * Initializes navigation logic.
     */
    initNavigation() {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });
    }

    /**
     * Navigates to a specific page.
     * @param {string} pageId - The ID of the page to show.
     */
    navigateTo(pageId) {
        // Update Sidebar
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-page="${pageId}"]`)?.classList.add('active');

        // Update Main Content
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('d-none'));
        const page = document.getElementById(`page-${pageId}`);
        if (page) {
            page.classList.remove('d-none');
        } else {
            logger.warn(`Page ${pageId} not found`);
        }
    }

    /**
     * Initializes update listeners.
     */
    initUpdates() {
        ipcRenderer.on('update-available', (event, info) => {
            logger.info('Update available:', info);
            // In a real app, show a modal or toast. For now, log it.
        });
    }
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
