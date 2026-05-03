import { createButton } from './Button.js';

/**
 * Creates a Form element with a submit button.
 * @param {Object} options - { id, fields, submitLabel, onSubmit }
 * fields: array of HTMLElements (e.g. from createInput())
 * @returns {HTMLFormElement}
 */
export const createForm = ({
  id,
  fields = [],
  submitLabel = 'Submit',
  onSubmit,
  actions = [],
} = {}) => {
  const form = document.createElement('form');
  form.id = id;
  form.className = 'form';
  form.noValidate = true; // We handle validation ourselves

  for (const field of fields) {
    form.appendChild(field);
  }

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'form-actions';

  const submitBtn = createButton({
    id: `${id}-submit`,
    label: submitLabel,
    type: 'submit',
    variant: 'primary',
  });
  actionsContainer.appendChild(submitBtn);

  for (const action of actions) {
    actionsContainer.appendChild(action);
  }

  form.appendChild(actionsContainer);

  if (typeof onSubmit === 'function') {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      onSubmit(e, form);
    });
  }

  return form;
};

/**
 * Gets a serialized object of all form field values.
 * @param {HTMLFormElement} form
 * @returns {Object}
 */
export const getFormValues = (form) => {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
};

/**
 * Sets a form-level error message (e.g. "Invalid credentials").
 * @param {HTMLFormElement} form
 * @param {string} message
 */
export const setFormError = (form, message) => {
  let errorBanner = form.querySelector('.form__error');
  if (!errorBanner) {
    errorBanner = document.createElement('div');
    errorBanner.className = 'form__error';
    errorBanner.setAttribute('role', 'alert');
    form.prepend(errorBanner);
  }
  errorBanner.textContent = message;
  errorBanner.hidden = false;
};

/**
 * Clears the form-level error message.
 * @param {HTMLFormElement} form
 */
export const clearFormError = (form) => {
  const errorBanner = form.querySelector('.form__error');
  if (errorBanner) {
    errorBanner.textContent = '';
    errorBanner.hidden = true;
  }
};
