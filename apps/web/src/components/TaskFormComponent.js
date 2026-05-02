import { Component } from '../core/Component.js';
import { createInput, showFieldError, clearFieldError } from '@workspace/ui/components/Input';
import { createForm, setFormError, clearFormError } from '@workspace/ui/components/Form';
import { createSpinner } from '@workspace/ui/components/Button';

const API_BASE = '/api';

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

/**
 * Creates a labeled <select> element for task status.
 */
const createStatusSelect = ({ id, value = 'todo' }) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'field__label';
  label.textContent = 'Status';
  wrapper.appendChild(label);

  const select = document.createElement('select');
  select.id = id;
  select.name = 'status';
  select.className = 'field__input';

  for (const { value: optVal, label: optLabel } of TASK_STATUSES) {
    const option = document.createElement('option');
    option.value = optVal;
    option.textContent = optLabel;
    option.selected = optVal === value;
    select.appendChild(option);
  }

  wrapper.appendChild(select);
  return wrapper;
};

/**
 * TaskFormComponent — "Smart" component.
 * Handles both create and edit modes for tasks.
 *
 * Props:
 *   - projectId {string}   Required. The project this task belongs to.
 *   - taskId?   {string}   If provided, the component fetches and pre-fills the task (edit mode).
 *
 * Emits:
 *   - 'task:saved'  { task }   after successful create or update
 *   - 'task:cancel'            when the user cancels
 */
export class TaskFormComponent extends Component {
  defaultState() {
    return {
      loading: false,
      submitting: false,
      error: null,
      task: null, // Populated in edit mode
    };
  }

  get isEditMode() {
    return Boolean(this.props.taskId);
  }

  onMount() {
    if (this.isEditMode) {
      this._fetchTask();
    }
  }

  render() {
    const wrapper = document.createElement('section');
    wrapper.className = 'task-form-page';
    wrapper.id = 'task-form-section';

    const title = document.createElement('h2');
    title.className = 'task-form-page__title';
    title.textContent = this.isEditMode ? 'Edit Task' : 'New Task';
    wrapper.appendChild(title);

    if (this.state.loading) {
      wrapper.appendChild(createSpinner({ label: 'Loading task' }));
      return wrapper;
    }

    const titleField = createInput({
      id: 'task-title',
      name: 'title',
      type: 'text',
      label: 'Task title',
      placeholder: 'What needs to be done?',
      required: true,
      value: this.state.task?.title ?? '',
    });

    const descField = createInput({
      id: 'task-description',
      name: 'description',
      type: 'text',
      label: 'Description',
      placeholder: 'Add more details (optional)',
      required: false,
      value: this.state.task?.description ?? '',
    });

    const statusSelect = createStatusSelect({
      id: 'task-status',
      value: this.state.task?.status ?? 'todo',
    });

    const form = createForm({
      id: 'task-form',
      fields: [titleField, descField, statusSelect],
      submitLabel: this.state.submitting
        ? (this.isEditMode ? 'Saving…' : 'Creating…')
        : (this.isEditMode ? 'Save changes' : 'Create task'),
      onSubmit: (e, formEl) => this._handleSubmit(formEl),
    });

    if (this.state.error) {
      setFormError(form, this.state.error);
    }

    if (this.state.submitting) {
      const submitBtn = form.querySelector('#task-form-submit');
      if (submitBtn) submitBtn.disabled = true;
    }

    wrapper.appendChild(form);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'task-form-cancel';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.emit('task:cancel'));
    wrapper.appendChild(cancelBtn);

    return wrapper;
  }

  async _handleSubmit(form) {
    for (const field of form.querySelectorAll('.field')) {
      clearFieldError(field);
    }
    clearFormError(form);

    const taskTitle = form.querySelector('#task-title')?.value?.trim();
    const description = form.querySelector('#task-description')?.value?.trim();
    const status = form.querySelector('#task-status')?.value;

    if (!taskTitle) {
      showFieldError(form.querySelector('.field:has(#task-title)'), 'Task title is required');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      this.setState({ error: 'Not authenticated' });
      return;
    }

    this.setState({ submitting: true, error: null });

    try {
      const isEdit = this.isEditMode;
      const url = isEdit
        ? `${API_BASE}/tasks/${this.props.taskId}`
        : `${API_BASE}/projects/${this.props.projectId}/tasks`;

      const method = isEdit ? 'PUT' : 'POST';

      // PUT requires projectId in body for ownership check
      const body = isEdit
        ? { title: taskTitle, description, status, projectId: this.props.projectId }
        : { title: taskTitle, description, status };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = response.status === 403
          ? 'You are not allowed to edit this task.'
          : response.status === 404
          ? 'Task not found.'
          : data.error || 'Failed to save task.';
        this.setState({ submitting: false, error: message });
        return;
      }

      this.setState({ submitting: false, error: null });
      this.emit('task:saved', { task: data.task });
    } catch {
      this.setState({ submitting: false, error: 'Network error. Please try again.' });
    }
  }

  async _fetchTask() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    this.setState({ loading: true });

    try {
      // Fetch task via project tasks endpoint (read is open)
      const response = await fetch(
        `${API_BASE}/projects/${this.props.projectId}/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        this.setState({ loading: false, error: 'Could not load task.' });
        return;
      }

      const data = await response.json();
      const task = data.tasks?.find(t => t.id === this.props.taskId);
      if (!task) {
        this.setState({ loading: false, error: 'Task not found.' });
        return;
      }

      this.setState({ loading: false, task });
    } catch {
      this.setState({ loading: false, error: 'Network error.' });
    }
  }
}
