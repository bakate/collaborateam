/**
 * Interface pour les guards de route (protection d'accès)
 */
export class RouteGuard {
  /**
   * Vérifie si l'accès à la route est autorisé
   * @param {Object} context Contexte de la route
   * @returns {Promise<boolean | string>} true si autorisé, sinon le chemin de redirection
   */
  async canActivate(context) {
    throw new Error('Not implemented');
  }
}
