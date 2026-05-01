import { IRouteRenderer } from '@workspace/application/ports/browser/IRouteRenderer';

export class EventRouteRenderer extends IRouteRenderer {
  /**
   * @param {Window} windowObject 
   */
  constructor(windowObject) {
    super();
    this.window = windowObject;
  }

  render(route, context) {
    // Emit a custom event that the frontend application will listen to for rendering
    const event = new this.window.CustomEvent('route:match', {
      detail: { route, context }
    });
    this.window.dispatchEvent(event);
  }

  renderNotFound(path) {
    const event = new this.window.CustomEvent('route:notfound', {
      detail: { path }
    });
    this.window.dispatchEvent(event);
  }
}
