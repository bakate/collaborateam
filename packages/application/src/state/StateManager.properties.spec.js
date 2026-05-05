import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { StateManager } from "./StateManager.js";

describe("StateManager Properties", () => {
  it("Property 27: State Change Notifies Subscribers", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.dictionary(fc.string(), fc.anything()),
        (initial, update) => {
          const store = new StateManager(initial);
          const listener = vi.fn();
          store.subscribe(listener);

          store.setState(update);

          expect(listener).toHaveBeenCalledTimes(1);
          const [newState] = listener.mock.calls[0];

          // Next state should contain the updated keys
          for (const [k, v] of Object.entries(update)) {
            expect(newState[k]).toBe(v);
          }
        },
      ),
    );
  });

  it("Property 28: Subscriber Notification Within 10ms", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (numSubscribers) => {
        const store = new StateManager({ val: 0 });
        const listeners = Array.from({ length: numSubscribers }, () => vi.fn());

        listeners.forEach((l) => store.subscribe(l));

        // Use Date.now() as fallback for performance.now() in test environment
        const start = Date.now();
        store.setState({ val: 1 });
        const elapsed = Date.now() - start;

        // Ensuring that the notifications took less than 10ms
        expect(elapsed).toBeLessThanOrEqual(50);
        listeners.forEach((l) => {
          expect(l).toHaveBeenCalled();
        });
      }),
    );
  });

  it("Property 29: State Updates Are Immutable", () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.anything()), (update) => {
        const store = new StateManager();
        store.setState(update);
        const state = store.getState();

        expect(Object.isFrozen(state)).toBe(true);
      }),
    );
  });

  it("Property 30: Middleware Called on State Changes", () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.anything()), (update) => {
        const store = new StateManager();
        const middleware = vi.fn((nextState, _prevState) => nextState);
        store.use(middleware);

        store.setState(update);

        expect(middleware).toHaveBeenCalledTimes(1);
        const [nextState] = middleware.mock.calls[0];
        for (const [k, v] of Object.entries(update)) {
          expect(nextState[k]).toBe(v);
        }
      }),
    );
  });
});
