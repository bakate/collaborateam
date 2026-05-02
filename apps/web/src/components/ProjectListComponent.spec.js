import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProjectListComponent } from './ProjectListComponent.js';

const makeProject = () => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.company.catchPhrase(),
  ownerId: faker.string.uuid(),
});

describe('ProjectListComponent', () => {
  let container;
  let component;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sessionStorage.setItem('accessToken', 'test_token');
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('should show a spinner while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // Never resolves
    component = new ProjectListComponent();
    component.mount(container);

    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('should render a list of projects on success', async () => {
    const projects = [makeProject(), makeProject(), makeProject()];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 10));

    const items = container.querySelectorAll('.project-card');
    expect(items.length).toBe(3);
    expect(items[0].querySelector('.project-card__name').textContent).toBe(projects[0].name);
  });

  it('should show empty state when no projects exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelector('.project-list__empty')).toBeTruthy();
    expect(container.querySelector('.project-card')).toBeFalsy();
  });

  it('should show error state and retry button on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    }));

    component = new ProjectListComponent();
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 10));

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

    await new Promise(resolve => setTimeout(resolve, 10));

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

    await new Promise(resolve => setTimeout(resolve, 10));

    container.querySelector(`#view-project-${projects[0].id}`).click();
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

    await new Promise(resolve => setTimeout(resolve, 10));

    // Toggle the "mine only" filter
    const checkbox = container.querySelector('#filter-mine');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 10));

    const lastCall = fetchMock.mock.calls.at(-1)[0];
    expect(lastCall).toContain('?mine=true');
  });
});
