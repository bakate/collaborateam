/**
 * Lightweight DOM diffing algorithm to avoid destroying elements
 * and losing focus/selection during updates.
 */
function updateElement(target, newEl) {
  if (!target || !newEl) return target;

  // If node types or tags are different, we must replace entirely
  if (target.nodeType !== newEl.nodeType || target.tagName !== newEl.tagName) {
    target.replaceWith(newEl.cloneNode(true));
    return newEl;
  }

  // Update text node
  if (target.nodeType === Node.TEXT_NODE) {
    if (target.textContent !== newEl.textContent) {
      target.textContent = newEl.textContent;
    }
    return target;
  }

  // Update attributes for element nodes
  if (target.nodeType === Node.ELEMENT_NODE) {
    const targetAttrs = Array.from(target.attributes);
    const newAttrs = Array.from(newEl.attributes);

    // Remove old attributes
    for (const attr of targetAttrs) {
      if (!newEl.hasAttribute(attr.name)) {
        target.removeAttribute(attr.name);
      }
    }

    // Add/Update new attributes (ignore value for focused inputs to prevent cursor jump)
    for (const attr of newAttrs) {
      if (attr.name === "value" && target === document.activeElement) continue;

      if (target.getAttribute(attr.name) !== attr.value) {
        target.setAttribute(attr.name, attr.value);
      }
    }

    // Sync special properties that aren't purely attributes
    if (
      target.value !== undefined &&
      target.value !== newEl.value &&
      target !== document.activeElement
    ) {
      target.value = newEl.value;
    }
    if (target.checked !== undefined && target.checked !== newEl.checked) {
      target.checked = newEl.checked;
    }
  }

  // Update children
  const targetChildren = Array.from(target.childNodes);
  const newChildren = Array.from(newEl.childNodes);
  const max = Math.max(targetChildren.length, newChildren.length);

  for (let i = 0; i < max; i++) {
    if (!targetChildren[i]) {
      target.appendChild(newChildren[i].cloneNode(true));
    } else if (!newChildren[i]) {
      target.removeChild(targetChildren[i]);
    } else {
      updateElement(targetChildren[i], newChildren[i]);
    }
  }

  return target;
}

export class Component {
  constructor(props = {}) {
    this.props = Object.freeze({ ...props });
    this.state = Object.freeze(this.defaultState());
    this.container = null;
    this.element = null;
    this.handlers = new Map();
    this.delegatedListeners = new Map();
    this.mounted = false;
  }

  /**
   * Defines default state. Can be overridden.
   */
  defaultState() {
    return {};
  }

  /**
   * Defines event delegations.
   * Format: { 'eventName selector': 'methodName' }
   * Example: { 'click .btn-save': 'onSave' }
   */
  events() {
    return {};
  }

  mount(container) {
    if (this.mounted) return;
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this._attachEventDelegation();
    this.mounted = true;
    this.onMount();
  }

  unmount() {
    if (!this.mounted) return;
    this.onUnmount();
    this._removeEventDelegation();

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.container = null;
    this.mounted = false;
  }

  update(newProps = {}) {
    if (!this.mounted) return;
    const oldProps = this.props;
    this.props = Object.freeze({ ...this.props, ...newProps });
    this.onUpdate(oldProps, this.props);
    this._rerender();
  }

  setState(updater) {
    if (typeof updater === "function") {
      this.state = Object.freeze({ ...this.state, ...updater(this.state) });
    } else {
      this.state = Object.freeze({ ...this.state, ...updater });
    }
    if (this.mounted) {
      this._rerender();
    }
  }

  getState() {
    return this.state;
  }

  render() {
    throw new Error("[Component] render() must be implemented");
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.handlers.has(event)) this.handlers.get(event).delete(handler);
  }

  emit(event, data) {
    if (this.handlers.has(event)) {
      for (const handler of this.handlers.get(event)) handler(data);
    }
  }

  // Lifecycles
  onMount() {}
  onUnmount() {}
  onUpdate(_oldProps, _newProps) {}

  /**
   * Parses the events() object and delegates to the root element.
   */
  _attachEventDelegation() {
    const eventsMap = this.events();
    if (!this.element) return;

    for (const [key, methodName] of Object.entries(eventsMap)) {
      const [eventName, ...selectorParts] = key.split(" ");
      const selector = selectorParts.join(" ");

      if (!this.delegatedListeners.has(eventName)) {
        const rootHandler = (e) =>
          this._handleDelegatedEvent(e, eventName, eventsMap);
        this.element.addEventListener(eventName, rootHandler);
        this.delegatedListeners.set(eventName, rootHandler);
      }
    }
  }

  _handleDelegatedEvent(e, eventName, eventsMap) {
    let target = e.target;
    // Traverse up to find if a matching selector was clicked
    while (target && target !== this.element) {
      for (const [key, methodName] of Object.entries(eventsMap)) {
        const [mappedEvent, ...selectorParts] = key.split(" ");
        const selector = selectorParts.join(" ");

        if (mappedEvent === eventName && target.matches(selector)) {
          if (typeof this[methodName] === "function") {
            this[methodName](e, target);
          } else {
            console.warn(
              `[Component] Method ${methodName} not found for event ${key}`,
            );
          }
        }
      }
      target = target.parentNode;
    }
  }

  _removeEventDelegation() {
    if (!this.element) return;
    for (const [eventName, handler] of this.delegatedListeners) {
      this.element.removeEventListener(eventName, handler);
    }
    this.delegatedListeners.clear();
  }

  _rerender() {
    if (!this.mounted || !this.element || !this.container) return;
    const newElement = this.render();
    if (this.element && newElement) {
      // Lightweight virtual DOM diffing instead of complete replacement
      updateElement(this.element, newElement);
      // We don't need to re-attach event delegation because it's attached to this.element
      // and updateElement mutates this.element directly without changing its identity
      // (unless the root tag changed, which is an edge case we handle by replacing).
      if (this.element.tagName !== newElement.tagName) {
        this._removeEventDelegation();
        this.element = newElement;
        this._attachEventDelegation();
      }
    }
  }
}
