/**
 * Deep freezes an object to ensure immutability
 * @param {Object} object
 * @returns {Object}
 */
function deepFreeze(object) {
  if (!object || typeof object !== "object") return object;

  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

export class StateManager {
  constructor(initialState = {}) {
    this.state = deepFreeze({ ...initialState });
    this.listeners = new Set();
    this.middlewares = [];
  }

  /**
   * Retrieves the current immutable state
   * @returns {Object}
   */
  getState() {
    return this.state;
  }

  /**
   * Registers a middleware
   * @param {Function} middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Updates the state with either a partial object or an updater function
   * @param {Object|Function} updater
   */
  setState(updater) {
    let nextState;
    if (typeof updater === "function") {
      nextState = updater(this.state);
    } else {
      nextState = { ...this.state, ...updater };
    }

    const prevState = this.state;

    // Apply middlewares (they can log, persist, or even modify the nextState before it's frozen)
    let finalState = nextState;
    for (const mw of this.middlewares) {
      const result = mw(finalState, prevState);
      if (result !== undefined) {
        finalState = result;
      }
    }

    this.state = deepFreeze(finalState);
    this.notify(this.state, prevState);
  }

  /**
   * Subscribes to state changes, optionally filtered by a path (e.g. 'user.profile.name')
   * @param {Function} listener
   * @param {string|null} path
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener, path = null) {
    const subscriber = { listener, path };
    this.listeners.add(subscriber);
    return () => this.listeners.delete(subscriber);
  }

  /**
   * Internal notification mechanism
   * @private
   */
  notify(newState, prevState) {
    const start = Date.now();

    for (const { listener, path } of this.listeners) {
      if (path) {
        const newValue = this._getValueByPath(newState, path);
        const oldValue = this._getValueByPath(prevState, path);
        if (newValue !== oldValue) {
          listener(newValue, oldValue);
        }
      } else {
        if (newState !== prevState) {
          listener(newState, prevState);
        }
      }
    }

    const elapsed = Date.now() - start;
    if (elapsed > 50) {
      console.warn(
        `[StateManager] Notifications took ${elapsed}ms (exceeds 50ms threshold)`,
      );
    }
  }

  /**
   * Utility to resolve a dot-notated path
   * @private
   */
  _getValueByPath(obj, path) {
    if (!path) return obj;
    return path
      .split(".")
      .reduce(
        (acc, part) =>
          acc === undefined || acc === null ? undefined : acc[part],
        obj,
      );
  }
}
