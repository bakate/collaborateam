import { apiClient } from './APIClient.js';

/**
 * AuthStore — Manage authentication state and JWT tokens.
 */
class AuthStore {
  constructor() {
    this._user = null;
    this._accessToken = localStorage.getItem('accessToken');
    this._listeners = new Set();
  }

  get user() { return this._user; }
  get isAuthenticated() { return !!this._accessToken; }
  get token() { return this._accessToken; }

  /**
   * Initialize store with current session from localStorage
   */
  async init() {
    if (!this._accessToken) return false;

    try {
      const response = await apiClient.get('/auth/me');

      if (response.ok) {
        const { user } = await response.json();
        this._user = user;
        this._notify();
        return true;
      }
      
      this.logout();
      return false;
    } catch (err) {
      console.error('[AuthStore] Init failed:', err);
      this.logout();
      return false;
    }
  }

  login(user, accessToken, refreshToken) {
    this._user = user;
    this._accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    this._notify();
  }

  logout() {
    this._user = null;
    this._accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    for (const listener of this._listeners) {
      listener({
        user: this._user,
        isAuthenticated: this.isAuthenticated
      });
    }
  }
}

export const authStore = new AuthStore();
