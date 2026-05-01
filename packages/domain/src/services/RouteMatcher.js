export class RouteMatcher {
  /**
   * Extrait les noms des paramètres d'une route
   * @param {string} path Le chemin, ex: "/projects/:id"
   * @returns {string[]} Un tableau contenant les noms des paramètres, ex: ["id"]
   */
  static extractParamNames(path) {
    if (!path) return [];
    const matches = path.match(/:([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(match => match.slice(1)) : [];
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
}
