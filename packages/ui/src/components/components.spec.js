import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { createButton, createSpinner } from './Button.js';
import { createInput, showFieldError, clearFieldError } from './Input.js';
import { createForm, setFormError } from './Form.js';
import { createModal } from './Modal.js';

describe('UI Components', () => {
  describe('createButton()', () => {
    it('should create a button with the correct label and variant', () => {
      const label = faker.lorem.word();
      const btn = createButton({ label, variant: 'danger', id: 'btn-1' });

      expect(btn.tagName).toBe('BUTTON');
      expect(btn.textContent).toBe(label);
      expect(btn.className).toContain('btn--danger');
      expect(btn.id).toBe('btn-1');
    });

    it('should default to type="button" to avoid accidental form submit', () => {
      const btn = createButton({ label: 'Click' });
      expect(btn.type).toBe('button');
    });

    it('should be disabled when disabled=true', () => {
      const btn = createButton({ label: 'Disabled', disabled: true });
      expect(btn.disabled).toBe(true);
    });
  });

  describe('createSpinner()', () => {
    it('should create an accessible spinner', () => {
      const spinner = createSpinner({ label: 'Loading data' });
      expect(spinner.getAttribute('role')).toBe('status');
      expect(spinner.getAttribute('aria-label')).toBe('Loading data');
    });
  });

  describe('createInput()', () => {
    it('should create a labeled input with correct attributes', () => {
      const id = faker.string.alphanumeric(6);
      const label = faker.lorem.word();
      const placeholder = faker.lorem.sentence();

      const wrapper = createInput({ id, label, placeholder, type: 'email', required: true });

      const input = wrapper.querySelector('input');
      const labelEl = wrapper.querySelector('label');

      expect(input.id).toBe(id);
      expect(input.type).toBe('email');
      expect(input.placeholder).toBe(placeholder);
      expect(input.required).toBe(true);
      expect(labelEl.textContent).toBe(label);
      expect(labelEl.htmlFor).toBe(id);
    });

    it('should show and clear errors accessibly', () => {
      const wrapper = createInput({ id: 'email', label: 'Email' });
      const input = wrapper.querySelector('input');

      showFieldError(wrapper, 'Email is required');
      const errorEl = wrapper.querySelector('.field__error');

      expect(errorEl.hidden).toBe(false);
      expect(errorEl.textContent).toBe('Email is required');
      expect(input.getAttribute('aria-invalid')).toBe('true');

      clearFieldError(wrapper);
      expect(errorEl.hidden).toBe(true);
      expect(errorEl.textContent).toBe('');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('createForm()', () => {
    it('should create a form with fields and a submit button', () => {
      const emailField = createInput({ id: 'email', label: 'Email', type: 'email' });
      const form = createForm({
        id: 'login-form',
        fields: [emailField],
        submitLabel: 'Login',
      });

      expect(form.id).toBe('login-form');
      expect(form.querySelector('#login-form-submit')).toBeTruthy();
      expect(form.querySelector('.field')).toBeTruthy();
    });

    it('should show a form-level error banner', () => {
      const form = createForm({ id: 'test-form', fields: [] });
      setFormError(form, 'Invalid credentials');

      const banner = form.querySelector('.form__error');
      expect(banner).toBeTruthy();
      expect(banner.textContent).toBe('Invalid credentials');
      expect(banner.hidden).toBe(false);
    });
  });

  describe('createModal()', () => {
    it('should be hidden by default', () => {
      const { element } = createModal({ id: 'test-modal', title: 'Test' });
      expect(element.hidden).toBe(true);
    });

    it('should open and close correctly', () => {
      const { element, open, close } = createModal({ id: 'test-modal2', title: 'Test' });
      open();
      expect(element.hidden).toBe(false);
      close();
      expect(element.hidden).toBe(true);
    });

    it('should have correct ARIA attributes', () => {
      const { element } = createModal({ id: 'my-modal', title: 'Hello' });
      expect(element.getAttribute('role')).toBe('dialog');
      expect(element.getAttribute('aria-modal')).toBe('true');
      expect(element.getAttribute('aria-labelledby')).toBe('my-modal-title');
    });
  });
});
