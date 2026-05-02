import { Component } from '../core/Component.js';
import { wsManager } from '../core/WebSocketManager.js';

export class WebSocketStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: wsManager.socket?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected'
    };
  }

  onMount() {
    // Subscribe to WebSocket status changes
    this._unsubscribe = wsManager.subscribe((payload) => {
      if (payload.type === 'ws:status') {
        this.setState({ status: payload.data });
      }
    });
  }

  onUnmount() {
    if (this._unsubscribe) this._unsubscribe();
  }

  render() {
    const status = this.state.status;
    const labels = {
      connected: 'Live',
      connecting: 'Connecting...',
      disconnected: 'Offline',
      error: 'Error'
    };

    const container = document.createElement('div');
    container.className = `ws-status ws-status--${status}`;
    container.title = `WebSocket Connection: ${labels[status]}`;
    container.innerHTML = `
      <span class="ws-status__dot"></span>
      <span class="ws-status__label">${labels[status]}</span>
    `;

    return container;
  }
}
