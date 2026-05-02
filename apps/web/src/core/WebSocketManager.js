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
    this.messageQueue = [];
  }

  connect() {
    if (this.socket || !authStore.token || !authStore.user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${authStore.user.id}`;

    console.warn("[WS] Connecting to", wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.warn("[WS] Connected");
      this.reconnectAttempts = 0;
      this._dispatch({ type: "ws:status", data: "connected" });
      this._flushQueue();
    };
    // ... suite (rest of the socket handlers remain the same)

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
      this._dispatch({ type: 'ws:status', data: 'disconnected' });
      this._attemptReconnect();
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error:', err);
      this._dispatch({ type: 'ws:status', data: 'error' });
    };
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.warn(`[WS] Reconnecting in ${delay}ms...`);
      this._dispatch({ type: 'ws:status', data: 'connecting' });
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
}

export const wsManager = new WebSocketManager();
