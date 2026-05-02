import { Component } from "../core/Component.js";
import { authStore } from "../core/AuthStore.js";
import {
  createInput,
  showFieldError,
  clearFieldError,
} from "@workspace/ui/components/Input";
import {
  createForm,
  setFormError,
  clearFormError,
} from "@workspace/ui/components/Form";
import { createSpinner } from "@workspace/ui/components/Button";

const API_BASE = "/api";

const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
};

/**
 * Validates password strength client-side.
 * Returns null if valid, or an error message string.
 * @param {string} password
 * @returns {string | null}
 */
const validatePasswordStrength = (password) => {
  if (password.length < PASSWORD_RULES.minLength) {
    return `Password must be at least ${PASSWORD_RULES.minLength} characters.`;
  }
  if (!PASSWORD_RULES.hasUppercase.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!PASSWORD_RULES.hasNumber.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
};

/**
 * RegisterComponent — "Smart" component.
 * Composes UI primitives, validates input, calls the auth API.
 * Emits 'register:success' with { user, accessToken } on success.
 */
export class RegisterComponent extends Component {
  defaultState() {
    return { loading: false, error: null };
  }

  render() {
    const wrapper = document.createElement("section");
    wrapper.className = "auth-card";
    wrapper.id = "register-section";
    wrapper.setAttribute("aria-label", "Registration form");

    const title = document.createElement("h1");
    title.className = "auth-card__title";
    title.textContent = "Create your account";
    wrapper.appendChild(title);

    const nameField = createInput({
      id: "register-name",
      name: "name",
      type: "text",
      label: "Full name",
      placeholder: "Jane Doe",
      required: true,
    });

    const emailField = createInput({
      id: "register-email",
      name: "email",
      type: "email",
      label: "Email address",
      placeholder: "you@example.com",
      required: true,
    });

    const passwordField = createInput({
      id: "register-password",
      name: "password",
      type: "password",
      label: "Password",
      placeholder: "8+ chars, uppercase, number",
      required: true,
    });

    const form = createForm({
      id: "register-form",
      fields: [nameField, emailField, passwordField],
      submitLabel: this.state.loading ? "Creating account…" : "Sign up",
      onSubmit: (e, formEl) => this._handleSubmit(formEl),
    });

    if (this.state.error) {
      setFormError(form, this.state.error);
    } else {
      clearFormError(form);
    }

    if (this.state.loading) {
      const submitBtn = form.querySelector("#register-form-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.replaceChildren(createSpinner({ label: "Creating account" }));
      }
    }

    wrapper.appendChild(form);

    const loginLink = document.createElement("p");
    loginLink.className = "auth-card__footer";
    loginLink.innerHTML = `Already have an account? <a href="#/login" id="go-to-login">Sign in</a>`;
    wrapper.appendChild(loginLink);

    return wrapper;
  }

  async _handleSubmit(form) {
    // Clear all previous errors
    for (const field of form.querySelectorAll(".field")) {
      clearFieldError(field);
    }
    clearFormError(form);

    const name = form.querySelector("#register-name")?.value?.trim();
    const email = form.querySelector("#register-email")?.value?.trim();
    const password = form.querySelector("#register-password")?.value;

    // Client-side validation — fail fast, field-specific errors
    if (!name) {
      showFieldError(
        form.querySelector(".field:has(#register-name)"),
        "Full name is required",
      );
      return;
    }

    if (!email) {
      showFieldError(
        form.querySelector(".field:has(#register-email)"),
        "Email is required",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFieldError(
        form.querySelector(".field:has(#register-email)"),
        "Please enter a valid email address",
      );
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      showFieldError(
        form.querySelector(".field:has(#register-password)"),
        passwordError,
      );
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          response.status === 409
            ? "An account with this email already exists."
            : data.error || "Registration failed. Please try again.";
        this.setState({ loading: false, error: message });
        return;
      }

      // Update global AuthStore
      authStore.login(data.user, data.accessToken, data.refreshToken);

      this.setState({ loading: false, error: null });
      this.emit("register:success", {
        user: data.user,
        accessToken: data.accessToken,
      });

      // Redirect to projects
      if (this.props.router) {
        this.props.router.navigate("/");
      }
    } catch (e) {
      console.log({ e });
      this.setState({
        loading: false,
        error: "Network error. Please try again.",
      });
    }
  }
}
