import { QueryStringParser } from '@workspace/domain/services/QueryStringParser';
import { GuardExecutor } from './GuardExecutor.js';

export class Router {
  /**
   * @param {Object} deps
   * @param {import('../ports/browser/IHistoryAdapter.js').IHistoryAdapter} deps.historyAdapter
   * @param {import('../ports/browser/ILinkInterceptor.js').ILinkInterceptor} deps.linkInterceptor
   * @param {import('../ports/browser/IRouteRenderer.js').IRouteRenderer} deps.renderer
   * @param {import('./RouteRegistry.js').RouteRegistry} deps.registry
   */
  constructor({ historyAdapter, linkInterceptor, renderer, registry }) {
    this.historyAdapter = historyAdapter;
    this.linkInterceptor = linkInterceptor;
    this.renderer = renderer;
    this.registry = registry;
  }

  start() {
    this.linkInterceptor.intercept((url) => {
      this.navigate(url);
    });

    this.historyAdapter.onPopState(() => {
      this.handleCurrentRoute();
    });

    this.handleCurrentRoute();
  }

  async navigate(fullPath) {
    // Avoid re-renders if we are already on the route
    const currentPath = this.historyAdapter.getPathname() + this.historyAdapter.getSearch();
    if (fullPath === currentPath) return;

    this.historyAdapter.pushState({}, '', fullPath);
    await this.handleCurrentRoute();
  }

  back() {
    this.historyAdapter.back();
  }

  forward() {
    this.historyAdapter.forward();
  }

  async handleCurrentRoute() {
    const fullPath = this.historyAdapter.getPathname() + this.historyAdapter.getSearch();
    const { pathname, search } = QueryStringParser.parsePath(fullPath);
    
    const match = this.registry.find(pathname);
    
    if (!match) {
      this.renderer.renderNotFound(pathname);
      return;
    }

    const context = {
      pathname,
      search,
      query: QueryStringParser.parse(search),
      params: match.params
    };

    const guardResult = await GuardExecutor.execute(match.route.guards, context);
    
    if (guardResult === true) {
      this.renderer.render(match.route, context);
    } else if (typeof guardResult === 'string') {
      // Redirect if the guard returns a string
      this.navigate(guardResult);
    }
  }

  destroy() {
    this.linkInterceptor.destroy();
  }
}
