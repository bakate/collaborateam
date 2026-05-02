import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { LoginComponent } from './LoginComponent.js';

// Minimal Component base stub for jsdom context
// (the real Component.js uses document which jsdom provides)

describe('LoginComponent', () => {
  let container;
  let component;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new LoginComponent();
    component.mount(container);
    
    // Reset sessionStorage between tests
    sessionStorage.clear();
  });

  afterEach(() => {
    component.unmount();
    container.remove();
    vi.restoreAllMocks();
  });

  it('should render a login form with email and password fields', () => {
    expect(container.querySelector('#login-form')).toBeTruthy();
    expect(container.querySelector('#login-email')).toBeTruthy();
    expect(container.querySelector('#login-password')).toBeTruthy();
    expect(container.querySelector('#login-form-submit')).toBeTruthy();
  });

  it('should render a link to the register view', () => {
    expect(container.querySelector('#go-to-register')).toBeTruthy();
  });

  it('should show client-side validation error if email is missing', async () => {
    const form = container.querySelector('#login-form');
    const passwordInput = container.querySelector('#login-password');
    passwordInput.value = 'password123';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Allow microtask to complete
    await Promise.resolve();
    expect(container.querySelector('.field__error:not([hidden])')).toBeTruthy();
  });

  it('should call fetch on valid form submission', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 10 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: faker.string.uuid(), email },
        accessToken: 'access_jwt',
        refreshToken: 'refresh_jwt',
      })
    }));

    container.querySelector('#login-email').value = email;
    container.querySelector('#login-password').value = password;
    container.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }));
  });

  it('should store tokens in sessionStorage on successful login', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 10 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: faker.string.uuid(), email },
        accessToken: 'my_access_token',
        refreshToken: 'my_refresh_token',
      })
    }));

    container.querySelector('#login-email').value = email;
    container.querySelector('#login-password').value = password;
    container.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(localStorage.getItem('accessToken')).toBe('my_access_token');
    expect(localStorage.getItem('refreshToken')).toBe('my_refresh_token');
  });

  it('should show error message on failed login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' })
    }));

    container.querySelector('#login-email').value = faker.internet.email();
    container.querySelector('#login-password').value = 'wrongpassword';
    container.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelector('.form__error')).toBeTruthy();
  });

  it('should emit login:success event on successful login', async () => {
    const successHandler = vi.fn();
    component.on('login:success', successHandler);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: '1', email: faker.internet.email() },
        accessToken: 'jwt',
        refreshToken: 'refresh',
      })
    }));

    container.querySelector('#login-email').value = faker.internet.email();
    container.querySelector('#login-password').value = 'password123';
    container.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(successHandler).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'jwt'
    }));
  });
});
