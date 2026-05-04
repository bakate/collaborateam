import { authStore } from './AuthStore.js';
import { env } from './env.js';

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
    this.messageQueue = [];
    this.status = 'disconnected';
  }

  connect() {
    if (this.socket || !authStore.token || !authStore.user) return;

    // Robust URL calculation: use the same host but root /ws path
    const url = new URL(env.VITE_API_URL);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${url.host}/ws?userId=${authStore.user.id}`;

    console.warn("[WS] Connecting to", wsUrl);
    this.socket = new WebSocket(wsUrl);
    this._setStatus('connecting');

    this.socket.onopen = () => {
      console.warn("[WS] Connected");
      this.reconnectAttempts = 0;
      this._setStatus('connected');
      this._flushQueue();
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
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
      console.warn('[WS] Disconnected');
      this.socket = null;
      this._setStatus('disconnected');
      this._attemptReconnect();
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error:', err);
      this._setStatus('error');
    };
  }

  _setStatus(status) {
    this.status = status;
    this._dispatch({ type: 'ws:status', data: status });
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.warn(`[WS] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this._setStatus('connecting');
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

  _flushQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const { action, projectId } = this.messageQueue.shift();
      this.socket.send(JSON.stringify({ action, projectId }));
    }
  }

  send(action, projectId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, projectId }));
    } else {
      this.messageQueue.push({ action, projectId });
    }
  }

  joinProject(projectId) {
    this.send("join", projectId);
  }

  leaveProject(projectId) {
    this.send("leave", projectId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnection loop
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this._setStatus('disconnected');
  }
}

export const wsManager = new WebSocketManager();
