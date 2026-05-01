import { IRouteRenderer } from '@collaborateam/application';

export class EventRouteRenderer extends IRouteRenderer {
  /**
   * @param {Window} windowObject 
   */
  constructor(windowObject) {
    super();
    this.window = windowObject;
  }

  render(route, context) {
    // Emet un custom event que l'application frontend écoutera pour faire le rendu
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
