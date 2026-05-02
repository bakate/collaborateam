import { authStore } from './AuthStore.js';

/**
 * APIClient — Centralized fetch wrapper with retry logic and auth integration.
 */
class APIClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
  }

  async request(endpoint, options = {}) {
    let attempts = 0;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Auto-inject token
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const config = { ...options, headers };

    while (attempts <= this.maxRetries) {
      try {
        const response = await fetch(url, config);

        // Handle Token Expiration (401)
        if (response.status === 401 && authStore.isAuthenticated) {
          console.warn('[APIClient] Session expired. Logging out.');
          authStore.logout();
          window.location.hash = '/login';
          throw new Error('Session expired');
        }

        // Return if success or client error (no retry for 4xx)
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // Server error (5xx) — trigger retry
        throw new Error(`Server error: ${response.status}`);

      } catch (err) {
        attempts++;
        
        // If it's a network error or 5xx, and we have retries left
        if (attempts <= this.maxRetries && this._isRetryable(err)) {
          const delay = this.baseDelay * Math.pow(2, attempts - 1);
          console.warn(`[APIClient] Request failed (${err.message}). Retrying in ${delay}ms... (Attempt ${attempts}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }
  }

  _isRetryable(err) {
    // Retry on network errors or specifically marked server errors
    return err.name === 'TypeError' || err.message.startsWith('Server error');
  }

  // Helper methods
  async get(endpoint, options) { return this.request(endpoint, { ...options, method: 'GET' }); }
  async post(endpoint, data, options) { return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }); }
  async put(endpoint, data, options) { return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }); }
  async delete(endpoint, data, options) { 
    return this.request(endpoint, { 
      ...options, 
      method: 'DELETE', 
      body: data ? JSON.stringify(data) : undefined 
    }); 
  }
}

export const apiClient = new APIClient();
