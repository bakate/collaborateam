import { Component } from '../core/Component.js';
import { authStore } from '../core/AuthStore.js';
import { createPageLayout } from '../core/PageLayout.js';
import { createButton, createSpinner } from '@workspace/ui/components/Button';
import { apiClient } from '../core/APIClient.js';
import { toast } from '../core/ToastManager.js';


/**
 * ProjectListComponent — "Smart" component.
 * Fetches and displays all projects. Supports optional "mine only" filter.
 * Emits:
 *   - 'project:select' with { projectId } when a project is clicked
 *   - 'project:create' when the create button is clicked
 */
export class ProjectListComponent extends Component {
  defaultState() {
    return {
      projects: [],
      loading: false,
      error: null,
      mineOnly: false,
      confirmingDeleteId: null,
    };
  }

  onMount() {
    this._fetchProjects();
  }

  render() {
    const actions = document.createElement('div');
    actions.className = 'project-list__actions';

    // "Mine only" toggle
    const filterLabel = document.createElement('label');
    filterLabel.className = 'toggle-label';
    filterLabel.htmlFor = 'filter-mine';
    filterLabel.textContent = 'My projects only';

    const filterCheckbox = document.createElement('input');
    filterCheckbox.type = 'checkbox';
    filterCheckbox.id = 'filter-mine';
    filterCheckbox.checked = this.state.mineOnly;
    filterCheckbox.addEventListener('change', (e) => {
      this.setState({ mineOnly: e.target.checked });
      this._fetchProjects();
    });

    filterLabel.prepend(filterCheckbox);
    actions.appendChild(filterLabel);

    const createBtn = createButton({
      id: 'create-project-btn',
      label: '+ New Project',
      variant: 'primary',
    });
    createBtn.addEventListener('click', () => {
      if (this.props.router) this.props.router.navigate('/projects/new');
      this.emit('project:create');
    });
    actions.appendChild(createBtn);

    const { wrapper, container } = createPageLayout({
      title: 'Projects',
      actions,
      router: this.props.router,
      pageClass: 'project-list-page'
    });

    // Loading
    if (this.state.loading) {
      container.appendChild(createSpinner({ label: 'Loading projects' }));
      wrapper.appendChild(container);
      return wrapper;
    }

    // Error
    if (this.state.error) {
      const errorEl = document.createElement('p');
      errorEl.className = 'project-list__error';
      errorEl.setAttribute('role', 'alert');
      errorEl.textContent = this.state.error;

      const retryBtn = createButton({ id: 'retry-btn', label: 'Retry', variant: 'secondary' });
      retryBtn.addEventListener('click', () => this._fetchProjects());

      container.appendChild(errorEl);
      container.appendChild(retryBtn);
      wrapper.appendChild(container);
      return wrapper;
    }

    // Empty state
    if (this.state.projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'project-list__empty';
      empty.textContent = this.state.mineOnly
        ? "You haven't created any projects yet."
        : 'No projects found.';
      container.appendChild(empty);
      wrapper.appendChild(container);
      return wrapper;
    }

    // Project cards
    const list = document.createElement('ul');
    list.className = 'project-list__items';
    list.setAttribute('role', 'list');

    for (const project of this.state.projects) {
      const item = this._renderProjectCard(project);
      list.appendChild(item);
    }

    container.appendChild(list);
    wrapper.appendChild(container);
    return wrapper;
  }

  _renderProjectCard(project) {
    const item = document.createElement('li');
    item.className = 'project-card';
    item.dataset.projectId = project.id;

    const nameEl = document.createElement('h2');
    nameEl.className = 'project-card__name';
    nameEl.textContent = project.name;

    const descEl = document.createElement('p');
    descEl.className = 'project-card__description';
    descEl.textContent = project.description || '';

    const actions = document.createElement('div');
    actions.className = 'project-card__actions';

    const viewBtn = createButton({
      id: `view-project-${project.id}`,
      label: 'View',
      variant: 'ghost',
      size: 'sm',
    });
    viewBtn.addEventListener('click', () => {
      if (this.props.router) this.props.router.navigate(`/projects/${project.id}`);
      this.emit('project:select', { projectId: project.id });
    });
    actions.appendChild(viewBtn);

    // Edit/Delete only for owner
    const currentUserId = authStore.user?.id;
    if (project.ownerId === currentUserId) {
      if (this.state.confirmingDeleteId === project.id) {
        const confirmMsg = document.createElement('span');
        confirmMsg.className = 'project-card__confirm-msg';
        confirmMsg.textContent = 'Are you sure?';
        actions.appendChild(confirmMsg);

        const confirmBtn = createButton({
          id: `confirm-delete-${project.id}`,
          label: 'Confirm',
          variant: 'danger',
          size: 'sm',
        });
        confirmBtn.addEventListener('click', () => this._handleDelete(project.id));

        const cancelBtn = createButton({
          id: `cancel-delete-${project.id}`,
          label: 'Cancel',
          variant: 'ghost',
          size: 'sm',
        });
        cancelBtn.addEventListener('click', () => this.setState({ confirmingDeleteId: null }));

        actions.appendChild(confirmBtn);
        actions.appendChild(cancelBtn);
      } else {
        const editBtn = createButton({
          id: `edit-project-${project.id}`,
          label: 'Edit',
          variant: 'ghost',
          size: 'sm',
        });
        editBtn.addEventListener('click', () => {
          if (this.props.router) this.props.router.navigate(`/projects/${project.id}/edit`);
        });

        const deleteBtn = createButton({
          id: `delete-project-${project.id}`,
          label: 'Delete',
          variant: 'danger',
          size: 'sm',
        });
        deleteBtn.addEventListener('click', () => this.setState({ confirmingDeleteId: project.id }));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
      }
    }

    item.appendChild(nameEl);
    item.appendChild(descEl);
    item.appendChild(actions);

    return item;
  }

  async _handleDelete(projectId) {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      if (response.ok) {
        toast.success('Project deleted');
        this.setState({
          projects: this.state.projects.filter(p => p.id !== projectId),
          confirmingDeleteId: null
        });
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err) {
      toast.error(err.message);
      this.setState({ confirmingDeleteId: null });
    }
  }

  async _fetchProjects() {
    this.setState({ loading: true, error: null });

    try {
      const query = this.state.mineOnly ? '?mine=true' : '';
      const response = await apiClient.get(`/projects${query}`);

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to load projects';
        this.setState({ loading: false, error: errorMsg });
        toast.error(errorMsg);
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, projects: data.projects });
    } catch (err) {
      this.setState({ loading: false, error: err.message });
      toast.error(err.message);
    }
  }
}
