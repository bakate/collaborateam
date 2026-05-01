/**
 * Interface pour le rendu des routes
 */
export class IRouteRenderer {
  /**
   * Rend une route spécifique
   * @param {Object} route La définition de la route
   * @param {Object} context Le contexte (params, query, etc.)
   */
  render(route, context) {
    throw new Error('Not implemented');
  }

  /**
   * Rend la page 404
   * @param {string} path Le chemin non trouvé
   */
  renderNotFound(path) {
    throw new Error('Not implemented');
  }
}
