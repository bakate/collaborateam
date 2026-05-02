/**
 * Interface for route rendering
 */
export class IRouteRenderer {
  /**
   * Renders a specific route
   * @param {Object} _route The route definition
   * @param {Object} _context The context (params, query, etc.)
   */
  render(_route, _context) {
    throw new Error("Not implemented");
  }

  /**
   * Renders the 404 page
   * @param {string} _path The path not found
   */
  renderNotFound(_path) {
    throw new Error("Not implemented");
  }
}
