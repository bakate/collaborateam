/**
 * Creates a labeled Input element — pure DOM, no business logic.
 * @param {Object} options - { id, name, type, label, placeholder, required, value }
 * @returns {HTMLDivElement} Wrapper containing label + input
 */
export const createInput = ({
  id,
  name,
  type = 'text',
  label,
  placeholder = '',
  required = false,
  value = '',
} = {}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    labelEl.className = 'field__label';
    wrapper.appendChild(labelEl);
  }

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = name || id;
  input.placeholder = placeholder;
  input.required = required;
  input.value = value;
  input.className = 'field__input';

  wrapper.appendChild(input);

  // Error message slot (hidden by default)
  const errorEl = document.createElement('span');
  errorEl.className = 'field__error';
  errorEl.id = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;
  wrapper.appendChild(errorEl);

  return wrapper;
};

/**
 * Shows an error message on a field created by createInput.
 * @param {HTMLElement} fieldWrapper
 * @param {string} message
 */
export const showFieldError = (fieldWrapper, message) => {
  const errorEl = fieldWrapper.querySelector('.field__error');
  const inputEl = fieldWrapper.querySelector('.field__input');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  if (inputEl) {
    inputEl.setAttribute('aria-invalid', 'true');
    inputEl.setAttribute('aria-describedby', errorEl?.id || '');
  }
};

/**
 * Clears the error message on a field.
 * @param {HTMLElement} fieldWrapper
 */
export const clearFieldError = (fieldWrapper) => {
  const errorEl = fieldWrapper.querySelector('.field__error');
  const inputEl = fieldWrapper.querySelector('.field__input');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
  if (inputEl) {
    inputEl.removeAttribute('aria-invalid');
    inputEl.removeAttribute('aria-describedby');
  }
};
