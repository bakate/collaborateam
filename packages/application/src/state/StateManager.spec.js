import { describe, it, expect, vi, beforeEach } from "vitest";
import { StateManager } from "./StateManager.js";

describe("StateManager Unit Tests", () => {
  let store;

  beforeEach(() => {
    store = new StateManager({ user: { name: "Alice" }, count: 0 });
  });

  it("should initialize with frozen state", () => {
    const state = store.getState();
    expect(state.count).toBe(0);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.user)).toBe(true);
  });

  it("should prevent state mutation", () => {
    const state = store.getState();
    expect(() => {
      state.count = 1;
    }).toThrow();
  });

  it("should update state and notify global subscribers", () => {
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ count: 1 });

    const newState = store.getState();
    expect(newState.count).toBe(1);
    expect(listener).toHaveBeenCalledWith(
      newState,
      expect.objectContaining({ count: 0 }),
    );
  });

  it("should notify path-specific subscribers only when path value changes", () => {
    const userListener = vi.fn();
    const countListener = vi.fn();

    store.subscribe(userListener, "user.name");
    store.subscribe(countListener, "count");

    // Update count -> should not notify userListener
    store.setState({ count: 5 });
    expect(countListener).toHaveBeenCalledWith(5, 0);
    expect(userListener).not.toHaveBeenCalled();

    // Update user -> should notify userListener
    store.setState((state) => ({ user: { ...state.user, name: "Bob" } }));
    expect(userListener).toHaveBeenCalledWith("Bob", "Alice");
  });

  it("should allow unsubscribing", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should apply middlewares", () => {
    const middleware = vi.fn((nextState, _prevState) => {
      // Modify state before it's saved and frozen
      return { ...nextState, modifiedByMiddleware: true };
    });

    store.use(middleware);
    store.setState({ count: 10 });

    const state = store.getState();
    expect(middleware).toHaveBeenCalled();
    expect(state.modifiedByMiddleware).toBe(true);
    expect(state.count).toBe(10);
  });
});
