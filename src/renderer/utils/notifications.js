/**
 * Utility for showing toast notifications.
 * @module notifications
 */
class NotificationSystem {
    constructor() {
        this.container = document.querySelector('.toast-container');
    }

    /**
     * Shows a toast notification.
     * @param {string} message - Message to display.
     * @param {'success'|'danger'|'warning'|'info'} type - Type of notification.
     */
    show(message, type = 'info') {
        const id = `toast-${Date.now()}`;
        const html = `
            <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', html);
        
        // Use Bootstrap's Toast API
        // Since we are in Electron with nodeIntegration, we might not have global 'bootstrap' unless loaded via script tag.
        // But we included CDN in index.html, so 'bootstrap' global should exist if scripts load correctly.
        // However, with nodeIntegration, require might be safer if we installed it, but we use CDN for styles/scripts as per spec.
        // Let's assume window.bootstrap is available (we need to load the JS in index.html, I missed the script tag for bootstrap JS).
        
        // I need to add bootstrap JS to index.html first.
        
        if (window.bootstrap) {
            const toastEl = document.getElementById(id);
            const toast = new window.bootstrap.Toast(toastEl);
            toast.show();
            
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        }
    }
}

module.exports = { notifications: new NotificationSystem() };
