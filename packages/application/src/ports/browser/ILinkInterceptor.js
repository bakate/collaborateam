/**
 * Interface pour intercepter les clics sur les liens
 */
export class ILinkInterceptor {
  /**
   * Intercepte les clics sur les liens pour faire de la navigation côté client
   * @param {Function} callback Fonction appelée avec l'URL quand un lien est cliqué
   */
  intercept(callback) {
    throw new Error('Not implemented');
  }

  /**
   * Nettoie les event listeners
   */
  destroy() {
    throw new Error('Not implemented');
  }
}
