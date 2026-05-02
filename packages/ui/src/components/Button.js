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
} = {}) => {
  const btn = document.createElement('button');
  btn.type = type;
  btn.textContent = label;
  btn.className = `btn btn--${variant}`;
  btn.disabled = disabled;
  if (id) btn.id = id;
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
