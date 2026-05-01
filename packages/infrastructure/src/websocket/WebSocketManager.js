export class WebSocketManager {
  /**
   * @param {string} url - The WebSocket server URL
   * @param {Object} WebSocketClass - Injectable WebSocket class for testing
   */
  constructor(url, WebSocketClass = globalThis.WebSocket) {
    this.url = url;
    this.WebSocketClass = WebSocketClass;
    this.socket = null;
    this.handlers = new Map();
    
    // Reconnection config
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseDelay = 1000;
    this.reconnectTimer = null;
    
    // Heartbeat config
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.pingInterval = 30000;
    this.pongTimeout = 5000;
    
    this.projectId = null;
  }

  /**
   * Connects to the WebSocket server and joins a specific project room.
   * @param {string} projectId 
   */
  connect(projectId = null) {
    this.projectId = projectId;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this._connect();
  }

  _connect() {
    if (this.socket && (this.socket.readyState === 0 /* CONNECTING */ || this.socket.readyState === 1 /* OPEN */)) {
      return;
    }

    try {
      this.socket = new this.WebSocketClass(this.url);
    } catch (error) {
      this._emit('error', error);
      if (this.shouldReconnect) {
        this._scheduleReconnect();
      }
      return;
    }
    
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this._startHeartbeat();
      
      if (this.projectId) {
        this.send('join', { projectId: this.projectId });
      }
      
      this._emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          this._handlePong();
        } else {
          this._emit(data.type, data.payload);
        }
      } catch (err) {
        console.error('[WebSocketManager] Failed to parse message:', err);
      }
    };

    this.socket.onclose = () => {
      this._stopHeartbeat();
      this._emit('disconnected');
      if (this.shouldReconnect) {
        this._scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      this._emit('error', error);
      // The socket usually closes after an error, triggering onclose.
    };
  }

  /**
   * Closes the connection and prevents automatic reconnection.
   */
  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    this._stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Sends a typed message to the server.
   * @param {string} type 
   * @param {Object} payload 
   */
  send(type, payload = {}) {
    if (this.socket && this.socket.readyState === 1 /* OPEN */) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn(`[WebSocketManager] Cannot send message "${type}": socket is not open.`);
    }
  }

  /**
   * Registers an event listener.
   * @param {string} event 
   * @param {Function} handler 
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
  }

  /**
   * Unregisters an event listener.
   * @param {string} event 
   * @param {Function} handler 
   */
  off(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  _emit(event, data) {
    if (this.handlers.has(event)) {
      for (const handler of this.handlers.get(event)) {
        handler(data);
      }
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._emit('max_reconnect_attempts_reached');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this._emit('reconnecting', { attempt: this.reconnectAttempts, delay });
      this._connect();
    }, delay);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send('ping');
      
      this.heartbeatTimeout = setTimeout(() => {
        // Dead connection detected
        if (this.socket) {
          this.socket.close();
        }
      }, this.pongTimeout);
      
    }, this.pingInterval);
  }

  _stopHeartbeat() {
    clearInterval(this.heartbeatInterval);
    clearTimeout(this.heartbeatTimeout);
  }

  _handlePong() {
    clearTimeout(this.heartbeatTimeout);
  }
}
