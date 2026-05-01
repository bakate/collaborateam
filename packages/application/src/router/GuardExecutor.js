/**
 * Executor for route guards
 */
export class GuardExecutor {
  /**
   * Executes a list of guards
   * @param {Array<import('./RouteGuard.js').RouteGuard>} guards 
   * @param {Object} context 
   * @returns {Promise<boolean | string>} true if all guards pass, otherwise the first redirect
   */
  static async execute(guards, context) {
    if (!guards || guards.length === 0) {
      return true;
    }

    for (const guard of guards) {
      const result = await guard.canActivate(context);
      if (result !== true) {
        return result; // Returns the redirect route
      }
    }

    return true;
  }
}
