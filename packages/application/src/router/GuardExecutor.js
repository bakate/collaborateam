/**
 * Exécuteur des guards de route
 */
export class GuardExecutor {
  /**
   * Exécute une liste de guards
   * @param {Array<import('./RouteGuard.js').RouteGuard>} guards 
   * @param {Object} context 
   * @returns {Promise<boolean | string>} true si tous les guards passent, sinon la première redirection
   */
  static async execute(guards, context) {
    if (!guards || guards.length === 0) {
      return true;
    }

    for (const guard of guards) {
      const result = await guard.canActivate(context);
      if (result !== true) {
        return result; // Renvoie la route de redirection
      }
    }

    return true;
  }
}
