export class Component {
  /**
   * Creates a new Component instance.
   * @param {Object} props - Initial component properties
   */
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.container = null;
    this.element = null;
    this.handlers = new Map();
    this.eventListeners = [];
    this.mounted = false;
  }

  /**
   * Mounts the component into a container element.
   * @param {HTMLElement} container - The container to mount into
   */
  mount(container) {
    if (this.mounted) {
      console.warn("[Component] Component is already mounted");
      return;
    }

    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this._attachEventListeners();
    this.mounted = true;
    this.onMount();
  }

  /**
   * Unmounts the component from the DOM.
   */
  unmount() {
    if (!this.mounted) {
      return;
    }

    this.onUnmount();
    this._removeEventListeners();

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.container = null;
    this.mounted = false;
  }

  /**
   * Updates the component with new props.
   * @param {Object} newProps - New properties to update
   */
  update(newProps = {}) {
    if (!this.mounted) {
      console.warn("[Component] Cannot update unmounted component");
      return;
    }

    const _oldProps = { ...this.props };
    this.props = { ...this.props, ...newProps };
    this.onUpdate(_oldProps, this.props);
    this._rerender();
  }

  /**
   * Renders the component's DOM structure.
   * Must be overridden by subclasses.
   * @returns {HTMLElement} The rendered element
   */
  render() {
    throw new Error("[Component] render() must be implemented by subclass");
  }

  /**
   * Updates the component's state.
   * @param {Object} newState - State updates to apply
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };

    if (this.mounted) {
      this._rerender();
    }
  }

  /**
   * Gets the current state of the component.
   * @returns {Object} The current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Registers an event listener for component events.
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
  }

  /**
   * Unregisters an event listener.
   * @param {string} event - The event name
   * @param {Function} handler - The event handler to remove
   */
  off(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  /**
   * Emits an event to all registered listeners.
   * @param {string} event - The event name
   * @param {*} data - Optional data to pass with the event
   */
  emit(event, data) {
    if (this.handlers.has(event)) {
      for (const handler of this.handlers.get(event)) {
        handler(data);
      }
    }
  }

  /**
   * Lifecycle method called after mounting.
   * Can be overridden by subclasses.
   */
  onMount() {}

  /**
   * Lifecycle method called before unmounting.
   * Can be overridden by subclasses.
   */
  onUnmount() {}

  /**
   * Lifecycle method called when props are updated.
   * Can be overridden by subclasses.
   * @param {Object} _oldProps - Previous props
   * @param {Object} _newProps - New props
   */
  onUpdate(_oldProps, _newProps) {}

  /**
   * Adds an event listener with automatic cleanup.
   * @param {HTMLElement} element - The element to attach to
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   */
  _addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  /**
   * Attaches event listeners to the rendered element.
   * Can be overridden by subclasses.
   */
  _attachEventListeners() {}

  /**
   * Removes all event listeners.
   */
  _removeEventListeners() {
    for (const { element, event, handler } of this.eventListeners) {
      element.removeEventListener(event, handler);
    }
    this.eventListeners = [];
  }

  /**
   * Re-renders the component after state/props change.
   */
  _rerender() {
    if (!this.mounted || !this.element || !this.container) {
      return;
    }

    const newElement = this.render();

    if (this.element && newElement) {
      this._removeEventListeners();
      this.container.replaceChild(newElement, this.element);
      this.element = newElement;
      this._attachEventListeners();
    }
  }
}
