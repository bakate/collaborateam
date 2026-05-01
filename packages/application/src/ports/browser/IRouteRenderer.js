/**
 * Interface for route rendering
 */
export class IRouteRenderer {
  /**
   * Renders a specific route
   * @param {Object} route The route definition
   * @param {Object} context The context (params, query, etc.)
   */
  render(route, context) {
    throw new Error('Not implemented');
  }

  /**
   * Renders the 404 page
   * @param {string} path The path not found
   */
  renderNotFound(path) {
    throw new Error('Not implemented');
  }
}
