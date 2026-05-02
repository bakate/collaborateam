import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { TaskListComponent } from './TaskListComponent.js';

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

  it('should render a spinner while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    component = new TaskListComponent({ projectId });
    component.mount(container);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });

  it('should render task items after successful fetch', async () => {
    const tasks = [makeTask(), makeTask()];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks }),
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);

    await new Promise(resolve => setTimeout(resolve, 10));

    const items = container.querySelectorAll('.task-item');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.task-item__title').textContent).toBe(tasks[0].title);
  });

  it('should render status badge with correct label', async () => {
    const tasks = [makeTask({ status: 'in_progress' })];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks }),
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelector('.task-item__status').textContent).toBe('In Progress');
  });

  it('should render empty state when no tasks exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [] }),
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelector('.task-list__empty')).toBeTruthy();
  });

  it('should render error state with retry button on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    }));

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelector('.task-list__error')).toBeTruthy();
    expect(container.querySelector('#retry-tasks-btn')).toBeTruthy();
  });

  it('should emit task:create when add button is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [] }),
    }));

    component = new TaskListComponent({ projectId });
    const createHandler = vi.fn();
    component.on('task:create', createHandler);
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    container.querySelector('#add-task-btn').click();
    expect(createHandler).toHaveBeenCalledTimes(1);
  });

  it('should emit task:edit with taskId when edit button is clicked', async () => {
    const tasks = [makeTask()];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks }),
    }));

    component = new TaskListComponent({ projectId });
    const editHandler = vi.fn();
    component.on('task:edit', editHandler);
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    container.querySelector(`#edit-task-${tasks[0].id}`).click();
    expect(editHandler).toHaveBeenCalledWith({ taskId: tasks[0].id });
  });

  it('should remove task from list on delete success', async () => {
    const tasks = [makeTask(), makeTask()];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ tasks }) }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });       // delete call

    vi.stubGlobal('fetch', fetchMock);

    component = new TaskListComponent({ projectId });
    component.mount(container);
    await new Promise(resolve => setTimeout(resolve, 10));

    container.querySelector(`#delete-task-${tasks[0].id}`).click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.querySelectorAll('.task-item').length).toBe(1);
  });

  describe('applyWsUpdate()', () => {
    beforeEach(async () => {
      const tasks = [makeTask({ id: 'task-1', title: 'First' })];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tasks }),
      }));

      component = new TaskListComponent({ projectId });
      component.mount(container);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should add a task on task:created event', () => {
      const newTask = makeTask({ id: 'task-2', title: 'New Task' });
      component.applyWsUpdate({ event: 'task:created', data: newTask });

      expect(container.querySelectorAll('.task-item').length).toBe(2);
    });

    it('should update a task on task:updated event', () => {
      component.applyWsUpdate({
        event: 'task:updated',
        data: { id: 'task-1', title: 'Updated Title', status: 'done', description: '' },
      });

      expect(container.querySelector('.task-item__title').textContent).toBe('Updated Title');
    });

    it('should remove a task on task:deleted event', () => {
      component.applyWsUpdate({ event: 'task:deleted', data: { id: 'task-1' } });
      expect(container.querySelector('.task-list__empty')).toBeTruthy();
    });
  });
});
