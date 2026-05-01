import { ILinkInterceptor } from '@workspace/application/ports/browser/ILinkInterceptor';

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
      // Find the closest <a> element
      const target = event.target.closest('a');
      
      if (!target) return;
      
      // Do not intercept links with target="_blank"
      if (target.hasAttribute('target') && target.getAttribute('target') === '_blank') return;
      
      // Do not intercept external links
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      
      // Do not intercept if a modifier key is pressed
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
