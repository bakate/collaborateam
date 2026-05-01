export class QueryStringParser {
  /**
   * Parses a query string into a key-value object
   * @param {string} search The query string, e.g: "?sort=asc&page=2"
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
   * Separates a full pathname from its query string
   * @param {string} fullPath The full path, e.g: "/projects?sort=asc"
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
