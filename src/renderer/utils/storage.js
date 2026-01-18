/**
 * LocalStorage wrapper with error handling and JSON parsing.
 * @module storage
 */
class Storage {
    /**
     * Saves data to local storage.
     * @param {string} key - Key.
     * @param {any} value - Value to store.
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to storage', e);
        }
    }

    /**
     * Retrieves data from local storage.
     * @param {string} key - Key.
     * @param {any} defaultValue - Default value if not found.
     * @returns {any} Stored value or default.
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from storage', e);
            return defaultValue;
        }
    }

    /**
     * Removes item from storage.
     * @param {string} key - Key.
     */
    remove(key) {
        localStorage.removeItem(key);
    }
}

module.exports = { storage: new Storage() };
