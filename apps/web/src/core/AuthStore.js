/**
 * AuthStore — Manage authentication state and JWT tokens.
 */
class AuthStore {
  constructor() {
    this._user = null;
    this._accessToken = sessionStorage.getItem('accessToken');
    this._listeners = new Set();
  }

  get user() { return this._user; }
  get isAuthenticated() { return !!this._accessToken; }
  get token() { return this._accessToken; }

  /**
   * Initialize store with current session
   */
  async init() {
    if (!this._accessToken) return false;

    try {
      // Future: Call /api/auth/me to verify token and get user profile
      // For now, we trust the token existence (MVP)
      this._user = { email: 'user@example.com', name: 'User' }; 
      this._notify();
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  login(user, accessToken, refreshToken) {
    this._user = user;
    this._accessToken = accessToken;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    this._notify();
  }

  logout() {
    this._user = null;
    this._accessToken = null;
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
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
