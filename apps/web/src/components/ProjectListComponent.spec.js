import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProjectListComponent } from './ProjectListComponent.js';
import { authStore } from '../core/AuthStore.js';
import { projectStore } from '../core/ProjectStore.js';

const makeProject = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.company.catchPhrase(),
  ownerId: faker.string.uuid(),
  ...overrides,
});

describe('ProjectListComponent', () => {
  let container;
  let component;
  const userId = faker.string.uuid();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.setItem('accessToken', 'test_token');
    
    // Clear stores for test isolation
    projectStore.clear();
    
    // Mock authStore user
    vi.spyOn(authStore, 'user', 'get').mockReturnValue({ id: userId, email: 'test@example.com', username: 'testuser' });
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should show a spinner while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // Never resolves
    component = new ProjectListComponent();
    component.mount(container);

    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('should render a list of projects on success', async () => {
    const projects = [makeProject(), makeProject()];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    const items = container.querySelectorAll('.project-card');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.project-card__name').textContent).toContain(projects[0].name);
  });

  it('should show empty state when no projects exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.querySelector('.project-list__empty')).toBeTruthy();
  });

  it('should show error state and retry button on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Unauthorized' }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.querySelector('.project-list__error')).toBeTruthy();
    expect(container.querySelector('#retry-btn')).toBeTruthy();
  });

  it('should emit project:create when create button is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    }));

    component = new ProjectListComponent();
    const createHandler = vi.fn();
    component.on('project:create', createHandler);
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    container.querySelector('#create-project-btn').click();
    expect(createHandler).toHaveBeenCalledTimes(1);
  });

  it('should emit project:select with projectId when a project is clicked', async () => {
    const projects = [makeProject()];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects }),
    }));

    component = new ProjectListComponent();
    const selectHandler = vi.fn();
    component.on('project:select', selectHandler);
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    container.querySelector(`.project-card[data-project-id="${projects[0].id}"]`).click();
    expect(selectHandler).toHaveBeenCalledWith({ projectId: projects[0].id });
  });

  it('should pass ?mine=true query when filter is enabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Toggle the "mine only" filter
    const checkbox = container.querySelector('#filter-mine');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 20));

    const lastCall = fetchMock.mock.calls.at(-1)[0];
    expect(lastCall).toContain('?mine=true');
  });
});
