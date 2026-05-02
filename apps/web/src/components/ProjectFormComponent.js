import { Component } from '../core/Component.js';
import { authStore } from '../core/AuthStore.js';
import { createInput, showFieldError, clearFieldError } from '@workspace/ui/components/Input';
import { createForm, setFormError, clearFormError } from '@workspace/ui/components/Form';
import { createSpinner } from '@workspace/ui/components/Button';

const API_BASE = '/api';

/**
 * ProjectFormComponent — "Smart" component.
 * Handles both create and edit modes depending on props.
 *
 * Props:
 *   - projectId? {string}  If provided, the component fetches and pre-fills the project (edit mode)
 *
 * Emits:
 *   - 'project:saved' with { project } after successful create or update
 *   - 'project:cancel' when the user cancels
 */
export class ProjectFormComponent extends Component {
  defaultState() {
    return {
      loading: false,
      submitting: false,
      error: null,
      project: null, // Populated in edit mode
    };
  }

  get isEditMode() {
    return Boolean(this.props.projectId);
  }

  onMount() {
    if (this.isEditMode) {
      this._fetchProject();
    }
  }

  render() {
    const wrapper = document.createElement('section');
    wrapper.className = 'project-form-page';
    wrapper.id = 'project-form-section';

    const title = document.createElement('h1');
    title.className = 'project-form-page__title';
    title.textContent = this.isEditMode ? 'Edit Project' : 'New Project';
    wrapper.appendChild(title);

    // Loading skeleton in edit mode
    if (this.state.loading) {
      wrapper.appendChild(createSpinner({ label: 'Loading project' }));
      return wrapper;
    }

    const nameField = createInput({
      id: 'project-name',
      name: 'name',
      type: 'text',
      label: 'Project name',
      placeholder: 'My awesome project',
      required: true,
      value: this.state.project?.name ?? '',
    });

    const descField = createInput({
      id: 'project-description',
      name: 'description',
      type: 'text',
      label: 'Description',
      placeholder: 'What is this project about?',
      required: false,
      value: this.state.project?.description ?? '',
    });

    const form = createForm({
      id: 'project-form',
      fields: [nameField, descField],
      submitLabel: this.state.submitting
        ? (this.isEditMode ? 'Saving…' : 'Creating…')
        : (this.isEditMode ? 'Save changes' : 'Create project'),
      onSubmit: (e, formEl) => this._handleSubmit(formEl),
    });

    if (this.state.error) {
      setFormError(form, this.state.error);
    }

    if (this.state.submitting) {
      const submitBtn = form.querySelector('#project-form-submit');
      if (submitBtn) submitBtn.disabled = true;
    }

    wrapper.appendChild(form);

    // Cancel link
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'project-form-cancel';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.emit('project:cancel'));
    wrapper.appendChild(cancelBtn);

    return wrapper;
  }

  async _handleSubmit(form) {
    for (const field of form.querySelectorAll('.field')) {
      clearFieldError(field);
    }
    clearFormError(form);

    const name = form.querySelector('#project-name')?.value?.trim();
    const description = form.querySelector('#project-description')?.value?.trim();

    if (!name) {
      showFieldError(form.querySelector('.field:has(#project-name)'), 'Project name is required');
      return;
    }

    const token = authStore.token;
    if (!token) {
      this.setState({ error: 'Not authenticated' });
      return;
    }

    this.setState({ submitting: true, error: null });

    try {
      const url = this.isEditMode
        ? `${API_BASE}/projects/${this.props.projectId}`
        : `${API_BASE}/projects`;

      const method = this.isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = response.status === 403
          ? 'You are not allowed to edit this project.'
          : data.error || 'Failed to save project.';
        this.setState({ submitting: false, error: message });
        return;
      }

      this.setState({ submitting: false, error: null });
      this.emit('project:saved', { project: data.project });
      if (this.props.router) this.props.router.navigate('/');
    } catch {
      this.setState({ submitting: false, error: 'Network error. Please try again.' });
    }
  }

  async _fetchProject() {
    const token = authStore.token;
    if (!token) return;

    this.setState({ loading: true });

    try {
      const response = await fetch(`${API_BASE}/projects/${this.props.projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        this.setState({ loading: false, error: 'Could not load project.' });
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, project: data.project });
    } catch {
      this.setState({ loading: false, error: 'Network error.' });
    }
  }
}
