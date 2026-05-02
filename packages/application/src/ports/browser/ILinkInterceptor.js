/**
 * Interface for intercepting link clicks
 */
export class ILinkInterceptor {
  /**
   * Intercepts link clicks for client-side navigation
   * @param {Function} _callback Function called with the URL when a link is clicked
   */
  intercept(_callback) {
    throw new Error("Not implemented");
  }

  /**
   * Cleans up event listeners
   */
  destroy() {
    throw new Error("Not implemented");
  }
}
