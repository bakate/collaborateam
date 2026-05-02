import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { RegisterComponent } from './RegisterComponent.js';

describe('RegisterComponent', () => {
  let container;
  let component;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new RegisterComponent();
    component.mount(container);
    sessionStorage.clear();
  });

  afterEach(() => {
    component.unmount();
    container.remove();
    vi.restoreAllMocks();
  });

  it('should render a registration form with name, email, and password fields', () => {
    expect(container.querySelector('#register-form')).toBeTruthy();
    expect(container.querySelector('#register-name')).toBeTruthy();
    expect(container.querySelector('#register-email')).toBeTruthy();
    expect(container.querySelector('#register-password')).toBeTruthy();
    expect(container.querySelector('#register-form-submit')).toBeTruthy();
  });

  it('should render a link back to login', () => {
    expect(container.querySelector('#go-to-login')).toBeTruthy();
  });

  describe('Client-side validation', () => {
    const submit = () => {
      container.querySelector('#register-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      return Promise.resolve();
    };

    it('should show error if name is missing', async () => {
      container.querySelector('#register-email').value = faker.internet.email();
      container.querySelector('#register-password').value = 'Password1';
      await submit();
      const errors = container.querySelectorAll('.field__error:not([hidden])');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should show error if email format is invalid', async () => {
      container.querySelector('#register-name').value = faker.person.fullName();
      container.querySelector('#register-email').value = 'not-an-email';
      container.querySelector('#register-password').value = 'Password1';
      await submit();
      const errors = container.querySelectorAll('.field__error:not([hidden])');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a password shorter than 8 characters', async () => {
      container.querySelector('#register-name').value = faker.person.fullName();
      container.querySelector('#register-email').value = faker.internet.email();
      container.querySelector('#register-password').value = 'Short1';
      await submit();
      const errors = container.querySelectorAll('.field__error:not([hidden])');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a password without an uppercase letter', async () => {
      container.querySelector('#register-name').value = faker.person.fullName();
      container.querySelector('#register-email').value = faker.internet.email();
      container.querySelector('#register-password').value = 'nouppercase1';
      await submit();
      const errors = container.querySelectorAll('.field__error:not([hidden])');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a password without a number', async () => {
      container.querySelector('#register-name').value = faker.person.fullName();
      container.querySelector('#register-email').value = faker.internet.email();
      container.querySelector('#register-password').value = 'NoNumberHere';
      await submit();
      const errors = container.querySelectorAll('.field__error:not([hidden])');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('API interactions', () => {
    const fillAndSubmit = async () => {
      container.querySelector('#register-name').value = faker.person.fullName();
      container.querySelector('#register-email').value = faker.internet.email();
      container.querySelector('#register-password').value = 'Secure123';
      container.querySelector('#register-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await new Promise(resolve => setTimeout(resolve, 10));
    };

    it('should call fetch on valid submission', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: faker.string.uuid(), email: faker.internet.email() },
          accessToken: 'access_jwt',
          refreshToken: 'refresh_jwt',
        })
      }));

      await fillAndSubmit();

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should store tokens on successful registration', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: faker.string.uuid(), email: faker.internet.email() },
          accessToken: 'my_access',
          refreshToken: 'my_refresh',
        })
      }));

      await fillAndSubmit();

      expect(localStorage.getItem('accessToken')).toBe('my_access');
      expect(localStorage.getItem('refreshToken')).toBe('my_refresh');
    });

    it('should show a conflict error (409) when email already exists', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Email already taken' })
      }));

      await fillAndSubmit();

      expect(container.querySelector('.form__error')).toBeTruthy();
      expect(container.querySelector('.form__error').textContent).toContain('already exists');
    });

    it('should emit register:success on successful registration', async () => {
      const successHandler = vi.fn();
      component.on('register:success', successHandler);

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: '1', email: faker.internet.email() },
          accessToken: 'jwt',
          refreshToken: 'refresh',
        })
      }));

      await fillAndSubmit();

      expect(successHandler).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'jwt'
      }));
    });
  });
});
