import { authStore } from './AuthStore.js';

/**
 * WebSocketManager — Handles real-time communication with the backend.
 * Dispatches events to components based on project ID.
 */
class WebSocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket || !authStore.token || !authStore.user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Server requires userId in query params for upgrade
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${authStore.user.id}`;

    console.log('[WS] Connecting to', wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('[WS] Received:', payload);
        
        // Normalize event naming (server uses 'event', client likes 'type')
        const normalized = {
          type: payload.type || payload.event,
          data: payload.data,
          projectId: payload.projectId
        };
        
        this._dispatch(normalized);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    this.socket.onclose = () => {
      console.log('[WS] Disconnected');
      this.socket = null;
      this._attemptReconnect();
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[WS] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _dispatch(payload) {
    this.listeners.forEach(callback => callback(payload));
  }

  send(action, projectId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, projectId }));
    }
  }

  joinProject(projectId) {
    this.send('join', projectId);
  }

  leaveProject(projectId) {
    this.send('leave', projectId);
  }
}

export const wsManager = new WebSocketManager();
