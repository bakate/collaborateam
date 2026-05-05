import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { TaskFormComponent } from './TaskFormComponent.js';
import { env } from '../core/env.js';

const makeTask = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  status: 'todo',
  ...overrides,
});

describe('TaskFormComponent', () => {
  let container;
  let component;
  const projectId = faker.string.uuid();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.setItem('accessToken', 'test_token');
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Create mode', () => {
    beforeEach(() => {
      component = new TaskFormComponent({ projectId });
      component.mount(container);
    });

    it('should render form with title, description and status fields', () => {
      expect(container.querySelector('#task-form')).toBeTruthy();
      expect(container.querySelector('#task-title')).toBeTruthy();
      expect(container.querySelector('#task-description')).toBeTruthy();
      expect(container.querySelector('#task-status')).toBeTruthy();
    });

    it('should render "New Task" as title', () => {
      expect(container.querySelector('h1').textContent).toBe('New Task');
    });

    it('should pre-select "To Do" status by default', () => {
      expect(container.querySelector('#task-status').value).toBe('todo');
    });

    it('should show all status options', () => {
      const options = container.querySelectorAll('#task-status option');
      expect(options.length).toBe(3);
      const values = Array.from(options).map(opt => opt.value);
      expect(values).toContain('todo');
      expect(values).toContain('in_progress');
      expect(values).toContain('done');
    });

    it('should show validation error if title is empty', async () => {
      container.querySelector('#task-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
      expect(container.querySelector('.field__error:not([hidden])')).toBeTruthy();
    });

    it('should POST to /api/projects/:id/tasks on valid submit', async () => {
      const task = makeTask();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ task }),
      }));

      container.querySelector('#task-title').value = task.title;
      container.querySelector('#task-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith(
        `${env.VITE_API_URL}/projects/${projectId}/tasks`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should emit task:saved with the created task on success', async () => {
      const task = makeTask();
      const savedHandler = vi.fn();
      component.on('task:saved', savedHandler);

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ task }),
      }));

      container.querySelector('#task-title').value = task.title;
      container.querySelector('#task-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(savedHandler).toHaveBeenCalledWith({ task });
    });

    it('should emit task:cancel when cancel is clicked', () => {
      const cancelHandler = vi.fn();
      component.on('task:cancel', cancelHandler);
      container.querySelector('#task-form-cancel').click();
      expect(cancelHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit mode', () => {
    let task;

    beforeEach(async () => {
      task = makeTask({ status: 'in_progress' });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tasks: [task] }),
      }));

      component = new TaskFormComponent({ projectId, taskId: task.id });
      component.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should show "Edit Task" as title', () => {
      expect(container.querySelector('h1').textContent).toBe('Edit Task');
    });

    it('should pre-fill title and description from fetched task', () => {
      expect(container.querySelector('#task-title').value).toBe(task.title);
      expect(container.querySelector('#task-description').value).toBe(task.description);
    });

    it('should pre-select the task current status', () => {
      expect(container.querySelector('#task-status').value).toBe('in_progress');
    });

    it('should PUT to /api/tasks/:id on valid submit', async () => {
      vi.restoreAllMocks();
      const putMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ task: { ...task, title: 'Updated' } }),
      });
      vi.stubGlobal('fetch', putMock);

      container.querySelector('#task-title').value = 'Updated';
      container.querySelector('#task-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(putMock).toHaveBeenCalledWith(
        `${env.VITE_API_URL}/tasks/${task.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should show a 403 error if user is not allowed to edit', async () => {
      vi.restoreAllMocks();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      }));

      container.querySelector('#task-title').value = 'Attempt';
      container.querySelector('#task-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const error = container.querySelector('.form__error');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('not allowed');
    });
  });
});
