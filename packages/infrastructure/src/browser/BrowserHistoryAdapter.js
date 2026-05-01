import { IHistoryAdapter } from '@workspace/application/ports/browser/IHistoryAdapter';

export class BrowserHistoryAdapter extends IHistoryAdapter {
  constructor(windowObject) {
    super();
    this.window = windowObject;
    this.popStateCallbacks = [];
    
    // Bind global event
    this.window.addEventListener('popstate', this._handlePopState.bind(this));
  }

  pushState(state, title, url) {
    this.window.history.pushState(state, title, url);
  }

  back() {
    this.window.history.back();
  }

  forward() {
    this.window.history.forward();
  }

  getPathname() {
    return this.window.location.pathname;
  }

  getSearch() {
    return this.window.location.search;
  }

  onPopState(callback) {
    this.popStateCallbacks.push(callback);
  }

  _handlePopState(event) {
    for (const callback of this.popStateCallbacks) {
      callback(event);
    }
  }
}
