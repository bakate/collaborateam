import { ILinkInterceptor } from '@collaborateam/application';

export class DOMLinkInterceptor extends ILinkInterceptor {
  /**
   * @param {Document} documentObject 
   */
  constructor(documentObject) {
    super();
    this.document = documentObject;
    this.clickHandler = null;
  }

  intercept(callback) {
    this.clickHandler = (event) => {
      // Trouver l'élément <a> le plus proche
      const target = event.target.closest('a');
      
      if (!target) return;
      
      // Ne pas intercepter les liens avec target="_blank"
      if (target.hasAttribute('target') && target.getAttribute('target') === '_blank') return;
      
      // Ne pas intercepter les liens externes
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      
      // Ne pas intercepter si un modifier key est pressé
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      
      event.preventDefault();
      callback(href);
    };

    this.document.addEventListener('click', this.clickHandler);
  }

  destroy() {
    if (this.clickHandler) {
      this.document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
  }
}
