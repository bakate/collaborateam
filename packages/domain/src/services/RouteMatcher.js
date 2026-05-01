export class RouteMatcher {
  /**
   * Extrait les noms des paramètres d'une route
   * @param {string} path Le chemin, ex: "/projects/:id"
   * @returns {string[]} Un tableau contenant les noms des paramètres, ex: ["id"]
   */
  static extractParamNames(path) {
    if (!path) return [];
    const matches = path.match(/:([a-zA-Z0-9_]+)/g);
    return matches ? matches.map((match) => match.slice(1)) : [];
  }

  /**
   * Convertit un chemin avec paramètres en RegExp pour le matching
   * @param {string} path Le chemin avec paramètres
   * @returns {RegExp} L'expression régulière correspondante
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
