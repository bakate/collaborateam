/**
 * Interface for navigation history adapter
 * Defines the contract to interact with browser or in-memory history
 */
export class IHistoryAdapter {
  /**
   * Adds a new entry to the history
   * @param {Object} _state
   * @param {string} _title
   * @param {string} _url
   */
  pushState(_state, _title, _url) {
    throw new Error("Not implemented");
  }

  /**
   * Goes back in the history
   */
  back() {
    throw new Error("Not implemented");
  }

  /**
   * Goes forward in the history
   */
  forward() {
    throw new Error("Not implemented");
  }

  /**
   * Gets the current pathname
   * @returns {string}
   */
  getPathname() {
    throw new Error("Not implemented");
  }

  /**
   * Gets the current query string
   * @returns {string}
   */
  getSearch() {
    throw new Error("Not implemented");
  }

  /**
   * Registers a callback for the popstate event (back/forward)
   * @param {Function} _callback
   */
  onPopState(_callback) {
    throw new Error("Not implemented");
  }
}
