/**
 * Centralized application state management.
 * @module app-state
 */
class AppState {
    constructor() {
        this.listeners = new Map();
        this.state = {
            trainingStatus: 'idle', // idle, training, completed, failed
            trainingProgress: 0,
            currentModel: null,
            settings: {}
        };
    }

    /**
     * Updates partial state and notifies listeners.
     * @param {Object} updates - Partial state updates.
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    /**
     * Gets current state.
     * @returns {Object} Current state.
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Subscribes to state changes.
     * @param {Function} listener - Callback function.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(listener) {
        const id = Date.now();
        this.listeners.set(id, listener);
        return () => this.listeners.delete(id);
    }

    /**
     * Notifies all listeners.
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

module.exports = { appState: new AppState() };
