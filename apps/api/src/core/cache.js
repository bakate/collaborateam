/**
 * Simple in-memory cache utility.
 */
class MemoryCache {
  constructor() {
    this._cache = new Map();
  }

  set(key, value, ttlMs = 60000) {
    const expiresAt = Date.now() + ttlMs;
    this._cache.set(key, { value, expiresAt });
  }

  get(key) {
    const cached = this._cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this._cache.delete(key);
      return null;
    }

    return cached.value;
  }

  delete(key) {
    this._cache.delete(key);
  }

  clear() {
    this._cache.clear();
  }
}

export const cache = new MemoryCache();
