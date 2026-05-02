import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { faker } from "@faker-js/faker";
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
  defaultState() {
    return { count: 0 };
  }

  events() {
    return {
      "click .increment": "onIncrement"
    };
  }

  onIncrement(e) {
    this.setState(s => ({ count: s.count + 1 }));
  }

  render() {
    const div = document.createElement("div");
    div.innerHTML = `
      <span class="count">${this.state.count}</span>
      <button class="increment">Add</button>
    `;
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
    const text = faker.lorem.word();
    const component = new TestComponent({ text });
    component.mount(container);

    expect(component.mounted).toBe(true);
    expect(container.querySelector(".test-component")).not.toBeNull();
    expect(container.textContent).toBe(text);
  });

  it("should unmount the component from the DOM", () => {
    const component = new TestComponent();
    component.mount(container);
    component.unmount();

    expect(component.mounted).toBe(false);
    expect(container.querySelector(".test-component")).toBeNull();
  });

  it("should update component props and morph DOM", () => {
    const component = new TestComponent({ text: "Initial" });
    component.mount(container);
    const originalElement = component.element;

    component.update({ text: "Updated" });

    // It should have morphed the text, but kept the same element reference
    expect(container.textContent).toBe("Updated");
    expect(component.element).toBe(originalElement);
  });

  it("should update component state immutably and re-render", () => {
    const component = new CounterComponent();
    component.mount(container);

    expect(container.querySelector(".count").textContent).toBe("0");

    component.setState({ count: 5 });

    expect(container.querySelector(".count").textContent).toBe("5");
    expect(component.getState().count).toBe(5);
  });

  it("should support automatic event delegation", () => {
    const component = new CounterComponent();
    component.mount(container);
    
    const button = container.querySelector(".increment");
    button.click();

    expect(component.getState().count).toBe(1);
    expect(container.querySelector(".count").textContent).toBe("1");
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

  it("should emit and listen to custom events", () => {
    const component = new TestComponent();
    const handler = vi.fn();

    component.on("custom-event", handler);
    const data = { message: faker.lorem.sentence() };
    component.emit("custom-event", data);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(data);

    component.off("custom-event", handler);
    component.emit("custom-event", { message: "again" });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
