/**
 * Interface for route guards (access protection)
 */
export class RouteGuard {
  /**
   * Checks if access to the route is allowed
   * @param {Object} context Route context
   * @returns {Promise<boolean | string>} true if allowed, otherwise the redirect path
   */
  async canActivate(context) {
    throw new Error('Not implemented');
  }
}
