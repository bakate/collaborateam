export const createInMemoryRateLimiter = () => {
  const store = new Map();

  return Object.freeze({
    /**
     * Checks if a given key has exceeded the limit within a time window.
     * @param {Object} input - { key, limit, windowMs }
     * @returns {Promise<boolean>} True if allowed, False if limited
     */
    async checkLimit({ key, limit, windowMs }) {
      const now = Date.now();
      
      if (!store.has(key)) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      const record = store.get(key);

      // Reset if window has passed
      if (now > record.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      // Increment count
      record.count += 1;
      
      if (record.count > limit) {
        return false;
      }

      return true;
    },

    // Useful for testing or manual cleanup
    clear() {
      store.clear();
    }
  });
};
