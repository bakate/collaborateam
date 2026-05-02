/**
 * ToastManager — Simple notification system.
 */
class ToastManager {
  constructor() {
    this.container = null;
  }

  _ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3000) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    
    // Icon mapping
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast__message">${message}</span>
    `;

    this.container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.classList.add('toast--exit');
      toast.addEventListener('animationend', () => {
        toast.remove();
        if (this.container.childNodes.length === 0) {
          this.container.remove();
          this.container = null;
        }
      });
    }, duration);
  }

  success(message) { this.show(message, 'success'); }
  error(message) { this.show(message, 'error', 5000); }
  info(message) { this.show(message, 'info'); }
}

export const toast = new ToastManager();
