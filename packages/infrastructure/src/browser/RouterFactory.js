import { Router, RouteRegistry } from '@collaborateam/application';
import { BrowserHistoryAdapter } from './BrowserHistoryAdapter.js';
import { DOMLinkInterceptor } from './DOMLinkInterceptor.js';
import { EventRouteRenderer } from './EventRouteRenderer.js';

export class RouterFactory {
  /**
   * Crée un routeur configuré pour le navigateur (production)
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
   * Crée un routeur avec des dépendances injectées (pour les tests)
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
