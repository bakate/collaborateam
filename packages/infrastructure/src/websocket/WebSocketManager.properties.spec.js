import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import { WebSocketManager } from "./WebSocketManager.js";

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
  }
  send(_data) {}
  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }
  simulateClose() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

describe("WebSocketManager Properties", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Property 24: WebSocket Reconnection on Connection Loss", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (drops) => {
        const wsManager = new WebSocketManager(
          "ws://localhost:8080",
          MockWebSocket,
        );
        wsManager.baseDelay = 10;
        wsManager.maxReconnectAttempts = 10;
        wsManager.connect("proj-123");

        for (let i = 0; i < drops; i++) {
          wsManager.socket.simulateClose();
          // Advance timers for exponential backoff
          const delay =
            wsManager.baseDelay * Math.pow(2, wsManager.reconnectAttempts - 1);
          vi.advanceTimersByTime(delay);
        }

        // It should attempt to reconnect exactly `drops` times if it didn't exceed max
        // However, on the last drop, it reconnects, but we haven't opened it yet
        expect(wsManager.socket).not.toBeNull();
        expect(wsManager.reconnectAttempts).toBe(drops);

        wsManager.disconnect();
      }),
    );
  });

  it("Property 25: State Synchronization After Reconnection", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (drops) => {
        const wsManager = new WebSocketManager(
          "ws://localhost:8080",
          MockWebSocket,
        );
        const connectHandler = vi.fn();
        wsManager.on("connected", connectHandler);

        wsManager.baseDelay = 10;
        wsManager.connect("proj-123");

        for (let i = 0; i < drops; i++) {
          wsManager.socket.simulateOpen(); // Successful connection
          wsManager.socket.simulateClose(); // Drop connection
          // Since it was successful, reconnectAttempts starts at 1 for the first retry
          const delay = wsManager.baseDelay;
          vi.advanceTimersByTime(delay);
        }

        // Open it finally after the last reconnect attempt
        wsManager.socket.simulateOpen();

        // The first connect + each drop reconnect (so drops + 1)
        expect(connectHandler).toHaveBeenCalledTimes(drops + 1);

        wsManager.disconnect();
      }),
    );
  });
});
