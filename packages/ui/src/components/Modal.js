/**
 * Creates a Modal dialog with a header, body slot, and close button.
 * @param {Object} options - { id, title, content, onClose }
 * content: HTMLElement to place inside the modal body
 * @returns {{ element: HTMLElement, open: Function, close: Function }}
 */
export const createModal = ({ id, title, content, onClose } = {}) => {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', `${id}-title`);
  overlay.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';

  const titleEl = document.createElement('h2');
  titleEl.id = `${id}-title`;
  titleEl.className = 'modal__title';
  titleEl.textContent = title || '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal__close';
  closeBtn.setAttribute('aria-label', 'Close modal');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => close());

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal__body';
  if (content) body.appendChild(content);

  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Trap focus / close on Escape
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const open = () => {
    overlay.hidden = false;
    overlay.focus();
  };

  const close = () => {
    overlay.hidden = true;
    if (typeof onClose === 'function') onClose();
  };

  return { element: overlay, open, close };
};
