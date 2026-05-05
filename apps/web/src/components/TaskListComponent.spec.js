import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { TaskListComponent } from './TaskListComponent.js';
import { authStore } from '../core/AuthStore.js';

const makeTask = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  status: 'todo',
  projectId: faker.string.uuid(),
  ...overrides,
});

describe('TaskListComponent', () => {
  let container;
  let component;
  const projectId = faker.string.uuid();
  const userId = faker.string.uuid();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.setItem('accessToken', 'test_token');
    
    // Mock authStore user
    vi.spyOn(authStore, 'user', 'get').mockReturnValue({ id: userId, email: 'test@example.com', username: 'testuser' });
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockProjectAndTasks = (tasks = []) => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes(`/api/projects/${projectId}/tasks`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ tasks }),
        });
      }
      if (url.includes(`/api/projects/${projectId}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ project: { id: projectId, ownerId: userId, name: 'Test Project' } }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));
  };

  it('should render a spinner while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    component = new TaskListComponent({ projectId });
    component.mount(container);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('should render task items after successful fetch', async () => {
    const tasks = [makeTask(), makeTask()];
    mockProjectAndTasks(tasks);

    component = new TaskListComponent({ projectId });
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 20));

    const items = container.querySelectorAll('.task-card');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.task-card__title').textContent).toBe(tasks[0].title);
  });

  it('should render status badge with correct label', async () => {
    const tasks = [makeTask({ status: 'in_progress' })];
    mockProjectAndTasks(tasks);

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(container.querySelector('.badge').textContent).toContain('in progress');
  });

  it('should render empty state when no tasks exist', async () => {
    mockProjectAndTasks([]);

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(container.querySelector('.task-list__empty')).toBeTruthy();
  });

  it('should render error state with retry button on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);
    
    // With 404, APIClient should fail immediately without retry
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(container.querySelector('.task-list__error')).toBeTruthy();
    expect(container.querySelector('#retry-tasks-btn')).toBeTruthy();
  });

  it('should emit task:create when add button is clicked', async () => {
    mockProjectAndTasks([]);

    component = new TaskListComponent({ projectId });
    const createHandler = vi.fn();
    component.on('task:create', createHandler);
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 20));

    const addBtn = container.querySelector('#add-task-btn');
    expect(addBtn).toBeTruthy();
    addBtn.click();
    expect(createHandler).toHaveBeenCalledTimes(1);
  });

  it('should emit task:edit with taskId when edit button is clicked', async () => {
    const tasks = [makeTask()];
    mockProjectAndTasks(tasks);

    component = new TaskListComponent({ projectId });
    const editHandler = vi.fn();
    component.on('task:edit', editHandler);
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 20));

    const editBtn = container.querySelector(`#edit-task-${tasks[0].id}`);
    expect(editBtn).toBeTruthy();
    editBtn.click();
    expect(editHandler).toHaveBeenCalledWith({ taskId: tasks[0].id });
  });

  it('should remove task from list on delete success', async () => {
    const tasks = [makeTask(), makeTask()];
    vi.stubGlobal('fetch', vi.fn((url, options) => {
      if (url.includes(`/api/projects/${projectId}/tasks`)) {
        return Promise.resolve({ ok: true, json: async () => ({ tasks }) });
      }
      if (url.includes(`/api/projects/${projectId}`)) {
        return Promise.resolve({ ok: true, json: async () => ({ project: { id: projectId, ownerId: userId } }) });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 20));

    container.querySelector(`#delete-task-${tasks[0].id}`).click();
    await new Promise(resolve => setTimeout(resolve, 20));

    // Confirmation mode
    container.querySelector(`[data-action="confirm-delete"]`).click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(container.querySelectorAll('.task-card').length).toBe(1);
  });

  describe('applyWsUpdate()', () => {
    beforeEach(async () => {
      const tasks = [makeTask({ id: 'task-1', title: 'First' })];
      mockProjectAndTasks(tasks);

      component = new TaskListComponent({ projectId });
      component.mount(container);
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    it('should add a task on task:created event', () => {
      const newTask = makeTask({ id: 'task-2', title: 'New Task' });
      component.applyWsUpdate({ type: 'task:created', data: newTask });

      expect(container.querySelectorAll('.task-card').length).toBe(2);
    });

    it('should update a task on task:updated event', () => {
      component.applyWsUpdate({
        type: 'task:updated',
        data: { id: 'task-1', title: 'Updated Title', status: 'done', description: '' },
      });

      expect(container.querySelector('.task-card__title').textContent).toBe('Updated Title');
    });

    it('should remove a task on task:deleted event', () => {
      component.applyWsUpdate({ type: 'task:deleted', data: { id: 'task-1' } });
      expect(container.querySelector('.task-list__empty')).toBeTruthy();
    });
  });
});
