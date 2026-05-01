import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketManager } from './WebSocketManager.js';

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
  }
  send(data) {
    if (this.onMockSend) this.onMockSend(data);
  }
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
  // Utilities for tests
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }
  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }
  simulateClose() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

describe('WebSocketManager Unit Tests', () => {
  let wsManager;

  beforeEach(() => {
    vi.useFakeTimers();
    wsManager = new WebSocketManager('ws://localhost:8080', MockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    wsManager.disconnect();
  });

  it('should connect and join project room', () => {
    const connectHandler = vi.fn();
    wsManager.on('connected', connectHandler);
    
    wsManager.connect('proj-123');
    
    const mockSocket = wsManager.socket;
    mockSocket.onMockSend = vi.fn();
    
    mockSocket.simulateOpen();
    
    expect(connectHandler).toHaveBeenCalled();
    expect(mockSocket.onMockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'join', payload: { projectId: 'proj-123' } }));
  });

  it('should reconnect after connection loss', () => {
    wsManager.baseDelay = 10; // speed up test
    wsManager.connect('proj-123');
    wsManager.socket.simulateOpen();
    
    // Simulate connection drop
    wsManager.socket.simulateClose();
    
    expect(wsManager.reconnectAttempts).toBe(1);
    
    // Advance timers to trigger reconnect
    vi.advanceTimersByTime(10);
    
    // A new socket should have been created
    expect(wsManager.socket).not.toBeNull();
    // Simulate it opening
    wsManager.socket.simulateOpen();
    
    expect(wsManager.reconnectAttempts).toBe(0); // Reset on successful connect
  });

  it('should stop reconnecting after max attempts', () => {
    const maxReachedHandler = vi.fn();
    wsManager.on('max_reconnect_attempts_reached', maxReachedHandler);
    
    wsManager.baseDelay = 10;
    wsManager.maxReconnectAttempts = 3;
    wsManager.connect('proj-123');
    
    // Fail 1st connect
    wsManager.socket.simulateClose();
    vi.advanceTimersByTime(10); // Attempt 1
    
    // Fail 2nd
    wsManager.socket.simulateClose();
    vi.advanceTimersByTime(20); // Attempt 2
    
    // Fail 3rd
    wsManager.socket.simulateClose();
    vi.advanceTimersByTime(40); // Attempt 3
    
    // Fail 4th (should trigger max_reconnect_attempts_reached)
    wsManager.socket.simulateClose();
    
    expect(maxReachedHandler).toHaveBeenCalled();
  });

  it('should not reconnect if disconnected manually', () => {
    wsManager.connect();
    wsManager.socket.simulateOpen();
    
    wsManager.disconnect();
    
    expect(wsManager.socket).toBeNull();
    expect(wsManager.shouldReconnect).toBe(false);
  });
});
