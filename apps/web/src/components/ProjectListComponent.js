import { Component } from '../core/Component.js';
import { authStore } from '../core/AuthStore.js';
import { createButton, createSpinner } from '@workspace/ui/components/Button';

const API_BASE = '/api';

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
    };
  }

  onMount() {
    this._fetchProjects();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'project-list-page';

    // Header
    const headerEl = document.createElement('header');
    headerEl.className = 'app-header';
    headerEl.innerHTML = `
      <div class="container">
        <a href="#/" class="app-header__logo">Collaborateam</a>
        <div class="app-header__user">
          <span class="user-email">${authStore.user?.email || ''}</span>
          <button id="logout-btn" class="btn btn--ghost btn--sm">Logout</button>
        </div>
      </div>
    `;
    
    headerEl.querySelector('#logout-btn').addEventListener('click', () => {
      authStore.logout();
      if (this.props.router) this.props.router.navigate('/login');
    });

    wrapper.appendChild(headerEl);

    const container = document.createElement('main');
    container.className = 'container project-list';

    // Section Header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'project-list__header';

    const title = document.createElement('h1');
    title.className = 'project-list__title';
    title.textContent = 'Projects';
    sectionHeader.appendChild(title);

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

    sectionHeader.appendChild(actions);
    container.appendChild(sectionHeader);

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

    const viewBtn = createButton({
      id: `view-project-${project.id}`,
      label: 'View project',
      variant: 'ghost',
    });
    viewBtn.addEventListener('click', () => {
      if (this.props.router) this.props.router.navigate(`/projects/${project.id}`);
      this.emit('project:select', { projectId: project.id });
    });

    item.appendChild(nameEl);
    item.appendChild(descEl);
    item.appendChild(viewBtn);

    return item;
  }

  async _fetchProjects() {
    const token = authStore.token;
    if (!token) {
      this.setState({ error: 'Not authenticated', loading: false });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const query = this.state.mineOnly ? '?mine=true' : '';
      const response = await fetch(`${API_BASE}/projects${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        this.setState({ loading: false, error: data.error || 'Failed to load projects' });
        return;
      }

      const data = await response.json();
      this.setState({ loading: false, projects: data.projects });
    } catch {
      this.setState({ loading: false, error: 'Network error. Please try again.' });
    }
  }
}
