import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Component } from "./Component.js";

class TestComponent extends Component {
  render() {
    const div = document.createElement("div");
    div.textContent = this.props.text || "Test";
    div.className = "test-component";
    return div;
  }
}

class CounterComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    const div = document.createElement("div");
    div.textContent = `Count: ${this.state.count}`;
    return div;
  }
}

describe("Component Unit Tests", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should mount the component into the container", () => {
    const component = new TestComponent({ text: "Hello" });
    component.mount(container);

    expect(component.mounted).toBe(true);
    expect(container.querySelector(".test-component")).not.toBeNull();
    expect(container.textContent).toBe("Hello");
  });

  it("should unmount the component from the DOM", () => {
    const component = new TestComponent();
    component.mount(container);
    component.unmount();

    expect(component.mounted).toBe(false);
    expect(container.querySelector(".test-component")).toBeNull();
  });

  it("should update component props", () => {
    const component = new TestComponent({ text: "Initial" });
    component.mount(container);

    expect(container.textContent).toBe("Initial");

    component.update({ text: "Updated" });

    expect(container.textContent).toBe("Updated");
  });

  it("should update component state and re-render", () => {
    const component = new CounterComponent();
    component.mount(container);

    expect(container.textContent).toBe("Count: 0");

    component.setState({ count: 5 });

    expect(container.textContent).toBe("Count: 5");
    expect(component.getState().count).toBe(5);
  });

  it("should call onMount and onUnmount lifecycle hooks", () => {
    const onMountSpy = vi.fn();
    const onUnmountSpy = vi.fn();

    class LifecycleComponent extends Component {
      render() {
        return document.createElement("div");
      }
      onMount() {
        onMountSpy();
      }
      onUnmount() {
        onUnmountSpy();
      }
    }

    const component = new LifecycleComponent();
    component.mount(container);

    expect(onMountSpy).toHaveBeenCalledTimes(1);

    component.unmount();

    expect(onUnmountSpy).toHaveBeenCalledTimes(1);
  });

  it("should emit and listen to events", () => {
    const component = new TestComponent();
    const handler = vi.fn();

    component.on("custom-event", handler);
    component.emit("custom-event", { data: "test" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ data: "test" });

    component.off("custom-event", handler);
    component.emit("custom-event", { data: "again" });

    expect(handler).toHaveBeenCalledTimes(1); // Should still be 1
  });

  it("should manage event listeners with automatic cleanup", () => {
    class ClickComponent extends Component {
      render() {
        const button = document.createElement("button");
        button.textContent = "Click Me";
        return button;
      }

      _attachEventListeners() {
        if (this.element) {
          this._addEventListener(this.element, "click", () => {
            this.emit("clicked");
          });
        }
      }
    }

    const clickHandler = vi.fn();
    const component = new ClickComponent();
    component.on("clicked", clickHandler);
    component.mount(container);

    // Simulate click
    component.element.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    component.unmount();

    // Verify listeners are cleaned up
    expect(component.eventListeners.length).toBe(0);
  });
});
