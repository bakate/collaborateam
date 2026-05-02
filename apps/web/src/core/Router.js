import { authStore } from './AuthStore.js';

/**
 * Router — Simple hash-based router for Vanilla JS.
 */
export class Router {
  constructor(routes, container) {
    this.routes = routes;
    this.container = container;
    this.currentComponent = null;

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
      console.error('No route found for:', hash);
      return this.navigate('/login');
    }

    this._renderRoute(match, params);
  }

  async _renderRoute(route, params) {
    // Auth Guard using AuthStore
    if (route.protected && !authStore.isAuthenticated) {
      return this.navigate('/login');
    }

    // Clean up current component
    if (this.currentComponent) {
      this.currentComponent.unmount();
    }

    // Clear container
    this.container.innerHTML = '';

    // Lazy Loading Support
    let ComponentClass = route.component;
    if (typeof ComponentClass === 'function' && !ComponentClass.prototype?.mount) {
      // Show a sleek loading state
      this.container.innerHTML = `
        <div class="loading-screen" style="display:flex; justify-content:center; align-items:center; height:100vh;">
          <div class="spinner"></div>
        </div>
      `;
      try {
        const module = await ComponentClass();
        // Handle both 'export default' and 'export const'
        ComponentClass = module.default || Object.values(module)[0];
      } catch (err) {
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
  }
}
