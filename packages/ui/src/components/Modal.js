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

/**
 * Factory: createConfirmModal
 *
 * Composes createModal with a standardised confirmation layout:
 * a descriptive message, a primary danger/confirm button, and a cancel button.
 *
 * @param {Object} options
 * @param {string}   options.id        - Unique id for the modal overlay element.
 * @param {string}   options.title     - Modal heading text.
 * @param {string}   options.message   - Main body text (e.g. "Are you sure?").
 * @param {string}   [options.detail]  - Secondary smaller text shown below message.
 * @param {string}   [options.confirmLabel='Confirm'] - Label for the confirm button.
 * @param {string}   [options.cancelLabel='Cancel']   - Label for the cancel button.
 * @param {Function} options.onConfirm - Called when the user clicks confirm.
 * @param {Function} [options.onCancel]- Called when the user cancels (optional).
 * @returns {{ element: HTMLElement, open: Function, close: Function }}
 */
export const createConfirmModal = ({
  id,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
} = {}) => {
  const content = document.createElement('div');
  content.className = 'confirm-modal-content';

  const messageEl = document.createElement('p');
  messageEl.innerHTML = message;
  content.appendChild(messageEl);

  if (detail) {
    const detailEl = document.createElement('p');
    detailEl.className = 'text-muted text-sm';
    detailEl.textContent = detail;
    content.appendChild(detailEl);
  }

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.id = `${id}-confirm-btn`;
  confirmBtn.className = 'btn btn--danger';
  confirmBtn.textContent = confirmLabel;

  const cancelBtn = document.createElement('button');
  cancelBtn.id = `${id}-cancel-btn`;
  cancelBtn.className = 'btn btn--ghost';
  cancelBtn.textContent = cancelLabel;

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  content.appendChild(actions);

  const modal = createModal({
    id,
    title,
    content,
    onClose: () => {
      modal.element.remove();
    },
  });

  confirmBtn.addEventListener('click', () => {
    if (typeof onConfirm === 'function') onConfirm();
    modal.close();
  });

  cancelBtn.addEventListener('click', () => {
    if (typeof onCancel === 'function') onCancel();
    modal.close();
  });

  return { element: modal.element, open: modal.open, close: modal.close };
};
