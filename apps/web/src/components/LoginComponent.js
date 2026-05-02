import { Component } from '../core/Component.js';
import { createInput, showFieldError, clearFieldError } from '@workspace/ui/components/Input';
import { createForm, setFormError, clearFormError } from '@workspace/ui/components/Form';
import { createSpinner } from '@workspace/ui/components/Button';

const API_BASE = '/api';

/**
 * LoginComponent — "Smart" component.
 * Composes UI primitives, calls the auth API, and manages its own state.
 * Emits 'login:success' with { user, accessToken, refreshToken } on success.
 */
export class LoginComponent extends Component {
  defaultState() {
    return { loading: false, error: null };
  }

  render() {
    const wrapper = document.createElement('section');
    wrapper.className = 'auth-card';
    wrapper.id = 'login-section';
    wrapper.setAttribute('aria-label', 'Login form');

    const title = document.createElement('h1');
    title.className = 'auth-card__title';
    title.textContent = 'Welcome back';
    wrapper.appendChild(title);

    const emailField = createInput({
      id: 'login-email',
      name: 'email',
      type: 'email',
      label: 'Email address',
      placeholder: 'you@example.com',
      required: true,
    });

    const passwordField = createInput({
      id: 'login-password',
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: '••••••••',
      required: true,
    });

    const form = createForm({
      id: 'login-form',
      fields: [emailField, passwordField],
      submitLabel: this.state.loading ? 'Signing in…' : 'Sign in',
      onSubmit: (e, formEl) => this._handleSubmit(formEl),
    });

    if (this.state.error) {
      setFormError(form, this.state.error);
    } else {
      clearFormError(form);
    }

    if (this.state.loading) {
      const submitBtn = form.querySelector('#login-form-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.replaceChildren(createSpinner({ label: 'Signing in' }));
      }
    }

    wrapper.appendChild(form);

    const registerLink = document.createElement('p');
    registerLink.className = 'auth-card__footer';
    registerLink.innerHTML = `Don't have an account? <a href="#register" id="go-to-register">Sign up</a>`;
    wrapper.appendChild(registerLink);

    return wrapper;
  }

  async _handleSubmit(form) {
    // Clear all previous errors
    for (const field of form.querySelectorAll('.field')) {
      clearFieldError(field);
    }
    clearFormError(form);

    const email = form.querySelector('#login-email')?.value?.trim();
    const password = form.querySelector('#login-password')?.value;

    // Client-side guard
    if (!email) {
      showFieldError(form.querySelector('.field:has(#login-email)'), 'Email is required');
      return;
    }
    if (!password) {
      showFieldError(form.querySelector('.field:has(#login-password)'), 'Password is required');
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const status = response.status;
        const message = status === 429
          ? 'Too many attempts. Please wait before trying again.'
          : data.error || 'Invalid email or password.';
        this.setState({ loading: false, error: message });
        return;
      }

      // Store tokens in sessionStorage (not localStorage — security conscious)
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);

      this.setState({ loading: false, error: null });
      this.emit('login:success', { user: data.user, accessToken: data.accessToken });
    } catch {
      this.setState({ loading: false, error: 'Network error. Please try again.' });
    }
  }
}
