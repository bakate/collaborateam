import { authStore } from './AuthStore.js';
import { NotFoundComponent } from '../components/NotFoundComponent.js';

/**
 * Router — Simple hash-based router for Vanilla JS.
 */
export class Router {
  constructor(routes, container) {
    this.routes = routes;
    this.container = container;
    this.currentComponent = null;
    this._isRendering = false; // Guard for concurrent renders

    window.addEventListener('hashchange', () => this.resolve());
  }

  init() {
    this.resolve();
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    
    let match = null;
    let params = {};

    for (const route of this.routes) {
      const paramNames = [];
      const regexPath = route.path
        .replace(/:([^/]+)/g, (_, name) => {
          paramNames.push(name);
          return '([^/]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPath}$`);
      const result = hash.match(regex);

      if (result) {
        match = route;
        params = paramNames.reduce((acc, name, i) => {
          acc[name] = result[i + 1];
          return acc;
        }, {});
        break;
      }
    }

    if (!match) {
      console.warn('No route found for:', hash);
      return this._renderRoute({ component: NotFoundComponent }, {});
    }

    this._renderRoute(match, params);
  }

  async _renderRoute(route, params) {
    // Auth Guard using AuthStore
    if (route.protected && !authStore.isAuthenticated) {
      return this.navigate('/login');
    }

    if (this._isRendering) return;
    this._isRendering = true;

    // Clean up current component
    if (this.currentComponent) {
      this.currentComponent.unmount();
      this.currentComponent = null;
    }

    // Clear container immediately
    this.container.innerHTML = '';

    // Lazy Loading Support
    let ComponentClass = route.component;
    if (typeof ComponentClass === 'function' && !ComponentClass.prototype?.mount) {
      const loaderTimeout = setTimeout(() => {
        this.container.innerHTML = `
          <div class="loading-screen">
            <div class="spinner"></div>
          </div>
        `;
      }, 200); // Only show loader if it takes > 200ms

      try {
        const module = await ComponentClass();
        clearTimeout(loaderTimeout);
        ComponentClass = module.default || Object.values(module)[0];
      } catch (err) {
        clearTimeout(loaderTimeout);
        console.error('[Router] Failed to lazy-load component:', err);
        return this.navigate('/');
      }
    }

    // Instantiate and mount
    this.currentComponent = new ComponentClass({ ...params, router: this });
    
    if (route.layout) {
      this.container.className = route.layout;
    } else {
      this.container.className = 'main-layout';
    }

    this.currentComponent.mount(this.container);
    this._isRendering = false;
  }
}
