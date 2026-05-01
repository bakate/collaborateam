export class QueryStringParser {
  /**
   * Parse une query string en objet clé-valeur
   * @param {string} search La query string, ex: "?sort=asc&page=2"
   * @returns {Object.<string, string>}
   */
  static parse(search) {
    if (!search) return {};
    
    const queryString = search.startsWith('?') ? search.slice(1) : search;
    if (!queryString) return {};

    const pairs = queryString.split('&');
    const result = {};

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    
    return result;
  }

  /**
   * Sépare un pathname complet de sa query string
   * @param {string} fullPath Le chemin complet, ex: "/projects?sort=asc"
   * @returns {{ pathname: string, search: string }}
   */
  static parsePath(fullPath) {
    if (!fullPath) return { pathname: '', search: '' };
    
    const index = fullPath.indexOf('?');
    if (index === -1) {
      return { pathname: fullPath, search: '' };
    }
    
    const pathname = fullPath.slice(0, index);
    const search = fullPath.slice(index);
    
    return { pathname, search };
  }
}
