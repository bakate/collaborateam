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
    
    // Find matching route
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
      // Default to / projects or login
      return this.navigate('/login');
    }

    this._renderRoute(match, params);
  }

  async _renderRoute(route, params) {
    // Auth Guard
    if (route.protected && !this._isAuthenticated()) {
      return this.navigate('/login');
    }

    // Clean up current component
    if (this.currentComponent) {
      this.currentComponent.unmount();
    }

    // Clear container
    this.container.innerHTML = '';

    // Instantiate and mount new component
    const ComponentClass = route.component;
    this.currentComponent = new ComponentClass({ ...params, router: this });
    
    // Apply layout class if defined
    if (route.layout) {
      this.container.className = route.layout;
    } else {
      this.container.className = 'main-layout';
    }

    this.currentComponent.mount(this.container);
  }

  _isAuthenticated() {
    // This should be provided by an AuthStore
    return !!sessionStorage.getItem('accessToken');
  }
}
