import { Router } from '@workspace/application/router/Router';
import { RouteRegistry } from '@workspace/application/router/RouteRegistry';
import { BrowserHistoryAdapter } from './BrowserHistoryAdapter.js';
import { DOMLinkInterceptor } from './DOMLinkInterceptor.js';
import { EventRouteRenderer } from './EventRouteRenderer.js';

export class RouterFactory {
  /**
   * Creates a router configured for the browser (production)
   * @param {Window} windowObject 
   * @param {Document} documentObject 
   * @returns {Router}
   */
  static createBrowserRouter(windowObject, documentObject) {
    const registry = new RouteRegistry();
    
    const historyAdapter = new BrowserHistoryAdapter(windowObject);
    const linkInterceptor = new DOMLinkInterceptor(documentObject);
    const renderer = new EventRouteRenderer(windowObject);

    return new Router({
      historyAdapter,
      linkInterceptor,
      renderer,
      registry
    });
  }

  /**
   * Creates a router with injected dependencies (for tests)
   * @param {Object} deps 
   * @returns {Router}
   */
  static createCustomRouter(deps) {
    const registry = new RouteRegistry();
    return new Router({
      ...deps,
      registry
    });
  }
}
