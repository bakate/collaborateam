import { RouteMatcher } from '@collaborateam/domain/services/RouteMatcher';

/**
 * Registre des routes
 */
export class RouteRegistry {
  constructor() {
    this.routes = [];
  }

  /**
   * Enregistre une route
   * @param {Object} routeDefinition 
   */
  add(routeDefinition) {
    const { path, component, guards = [] } = routeDefinition;
    
    this.routes.push({
      path,
      component,
      guards,
      pattern: RouteMatcher.pathToRegex(path),
      paramNames: RouteMatcher.extractParamNames(path)
    });
  }

  /**
   * Trouve une route correspondante
   * @param {string} pathname 
   * @returns {Object|null}
   */
  find(pathname) {
    for (const route of this.routes) {
      const matcher = new RouteMatcher();
      const matchResult = matcher.match(pathname, route.pattern, route.paramNames);
      
      if (matchResult) {
        return {
          route,
          params: matchResult.params
        };
      }
    }
    
    return null;
  }
}
