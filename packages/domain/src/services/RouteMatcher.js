export class RouteMatcher {
  /**
   * Extracts parameter names from a route
   * @param {string} path The path, e.g: "/projects/:id"
   * @returns {string[]} An array containing parameter names, e.g: ["id"]
   */
  static extractParamNames(path) {
    if (!path) return [];
    const matches = path.match(/:([a-zA-Z0-9_]+)/g);
    return matches ? matches.map((match) => match.slice(1)) : [];
  }

  /**
   * Converts a path with parameters to a RegExp for matching
   * @param {string} path The path with parameters
   * @returns {RegExp} The corresponding regular expression
   */
  static pathToRegex(path) {
    if (path === '*' || path === '(.*)') {
      return new RegExp('^.*$');
    }
    const regexStr = path
      .replace(/\//g, '\\/')
      .replace(/:[a-zA-Z0-9_]+/g, '([^\\/]+)');
    return new RegExp(`^${regexStr}$`);
  }


   /**
   * Match a pathname against a route pattern
   * @param {string} pathname - Pathname to match
   * @param {RegExp} pattern - Route pattern regex
   * @param {Array<string>} paramNames - Parameter names
   * @returns {Object|null} - Match result with params or null
   */
  match(pathname, pattern, paramNames) {
    const match = pathname.match(pattern);
    if (!match) return null;

    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return { params };
  }
}
