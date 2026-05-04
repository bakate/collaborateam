/**
 * Creates a Button element — pure DOM, no business logic.
 * @param {Object} options - { label, variant, type, disabled, id }
 * @returns {HTMLButtonElement}
 */
export const createButton = ({
  label,
  variant = 'primary',
  type = 'button',
  disabled = false,
  id,
  icon, // SVG string
  ariaLabel, // New: explicit aria-label
} = {}) => {
  const btn = document.createElement('button');
  btn.type = type;
  btn.className = `btn btn--${variant}`;
  btn.disabled = disabled;
  if (id) btn.id = id;

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'btn__icon';
    iconSpan.innerHTML = icon;
    btn.appendChild(iconSpan);
  }

  if (label) {
    const textSpan = document.createElement('span');
    textSpan.className = 'btn__text';
    textSpan.textContent = label;
    btn.appendChild(textSpan);
  }

  // Accessibility: always ensure there is an accessible name
  const finalAriaLabel = ariaLabel || label || id;
  if (finalAriaLabel) {
    btn.setAttribute('aria-label', finalAriaLabel);
  }

  if (!label && icon) {
    btn.classList.add('btn--icon-only');
  }

  return btn;
};

/**
 * Creates a Spinner element to indicate loading state.
 * @param {Object} options - { label }
 * @returns {HTMLDivElement}
 */
export const createSpinner = ({ label = 'Loading...' } = {}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'spinner';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label', label);
  wrapper.innerHTML = `<span class="spinner__ring"></span>`;
  return wrapper;
};
