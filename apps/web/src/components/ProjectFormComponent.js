import { Component } from '../core/Component.js';
import { authStore } from '../core/AuthStore.js';
import { createPageLayout } from '../core/PageLayout.js';
import { createInput, showFieldError, clearFieldError } from '@workspace/ui/components/Input';
import { createForm, setFormError, clearFormError } from '@workspace/ui/components/Form';
import { createSpinner } from '@workspace/ui/components/Button';
import { apiClient } from '../core/APIClient.js';
import { toast } from '../core/ToastManager.js';


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
    const { wrapper, container } = createPageLayout({
      title: this.isEditMode ? 'Edit Project' : 'New Project',
      showBack: true,
      onBack: () => this.props.router?.navigate('/'),
      router: this.props.router,
      pageClass: 'form-page'
    });

    if (this.state.loading) {
      container.appendChild(createSpinner({ label: 'Loading project' }));
      wrapper.appendChild(container);
      return wrapper;
    }

    const formWrapper = document.createElement('div');
    formWrapper.className = 'form-container';

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

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'project-form-cancel';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this.props.router?.navigate('/');
      this.emit('project:cancel');
    });

    const form = createForm({
      id: 'project-form',
      fields: [nameField, descField],
      submitLabel: this.state.submitting
        ? (this.isEditMode ? 'Saving…' : 'Creating…')
        : (this.isEditMode ? 'Save changes' : 'Create project'),
      actions: [cancelBtn],
      onSubmit: (e, formEl) => this._handleSubmit(formEl),
    });

    if (this.state.error) {
      setFormError(form, this.state.error);
    }

    if (this.state.submitting) {
      const submitBtn = form.querySelector('#project-form-submit');
      if (submitBtn) submitBtn.disabled = true;
    }

    formWrapper.appendChild(form);

    container.appendChild(formWrapper);
    wrapper.appendChild(container);
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

    this.setState({ submitting: true, error: null });

    try {
      const payload = { name, description };
      const response = this.isEditMode
        ? await apiClient.put(`/projects/${this.props.projectId}`, payload)
        : await apiClient.post('/projects', payload);

      const data = await response.json();

      if (!response.ok) {
        const message = response.status === 403
          ? 'You are not allowed to edit this project.'
          : data.error || 'Failed to save project.';
        this.setState({ submitting: false, error: message });
        toast.error(message);
        return;
      }

      this.setState({ submitting: false, error: null });
      toast.success(this.isEditMode ? 'Project updated' : 'Project created');
      this.emit('project:saved', { project: data.project });
      if (this.props.router) this.props.router.navigate('/');
    } catch (err) {
      this.setState({ submitting: false, error: err.message });
      toast.error(err.message);
    }
  }

  async _fetchProject() {
    this.setState({ loading: true });

    try {
      const response = await apiClient.get(`/projects/${this.props.projectId}`);

      if (!response.ok) {
        this.setState({ loading: false, error: 'Could not load project.' });
        toast.error('Failed to load project details');
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, project: data.project });
    } catch (err) {
      this.setState({ loading: false, error: err.message });
      toast.error('Failed to load project details');
    }
  }
}
