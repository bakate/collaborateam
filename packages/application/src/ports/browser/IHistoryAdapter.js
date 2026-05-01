/**
 * Interface pour l'adapter d'historique de navigation
 * Définit le contrat pour interagir avec l'historique du navigateur ou en mémoire
 */
export class IHistoryAdapter {
  /**
   * Ajoute une nouvelle entrée dans l'historique
   * @param {Object} state 
   * @param {string} title 
   * @param {string} url 
   */
  pushState(state, title, url) {
    throw new Error('Not implemented');
  }

  /**
   * Recule dans l'historique
   */
  back() {
    throw new Error('Not implemented');
  }

  /**
   * Avance dans l'historique
   */
  forward() {
    throw new Error('Not implemented');
  }

  /**
   * Récupère le pathname courant
   * @returns {string}
   */
  getPathname() {
    throw new Error('Not implemented');
  }

  /**
   * Récupère la query string courante
   * @returns {string}
   */
  getSearch() {
    throw new Error('Not implemented');
  }

  /**
   * Enregistre un callback pour l'événement popstate (back/forward)
   * @param {Function} callback 
   */
  onPopState(callback) {
    throw new Error('Not implemented');
  }
}
