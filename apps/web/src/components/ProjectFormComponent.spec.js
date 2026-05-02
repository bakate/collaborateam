import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { ProjectFormComponent } from './ProjectFormComponent.js';

const makeProject = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.company.catchPhrase(),
  ownerId: faker.string.uuid(),
  ...overrides,
});

describe('ProjectFormComponent', () => {
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

  describe('Create mode (no projectId prop)', () => {
    beforeEach(() => {
      component = new ProjectFormComponent();
      component.mount(container);
    });

    it('should render the form with empty fields', () => {
      expect(container.querySelector('#project-form')).toBeTruthy();
      expect(container.querySelector('#project-name').value).toBe('');
      expect(container.querySelector('#project-description').value).toBe('');
    });

    it('should show "New Project" as title', () => {
      expect(container.querySelector('h1').textContent).toBe('New Project');
    });

    it('should show "Create project" on submit button', () => {
      expect(container.querySelector('#project-form-submit').textContent).toBe('Create project');
    });

    it('should show validation error if name is empty', async () => {
      container.querySelector('#project-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
      expect(container.querySelector('.field__error:not([hidden])')).toBeTruthy();
    });

    it('should POST to /api/projects on valid submit', async () => {
      const project = makeProject();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ project }),
      }));

      container.querySelector('#project-name').value = project.name;
      container.querySelector('#project-description').value = project.description;
      container.querySelector('#project-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should emit project:saved on success', async () => {
      const project = makeProject();
      const savedHandler = vi.fn();
      component.on('project:saved', savedHandler);

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ project }),
      }));

      container.querySelector('#project-name').value = project.name;
      container.querySelector('#project-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(savedHandler).toHaveBeenCalledWith({ project });
    });

    it('should emit project:cancel when cancel is clicked', () => {
      const cancelHandler = vi.fn();
      component.on('project:cancel', cancelHandler);
      container.querySelector('#project-form-cancel').click();
      expect(cancelHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit mode (with projectId prop)', () => {
    let project;

    beforeEach(async () => {
      project = makeProject();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ project }),
      }));

      component = new ProjectFormComponent({ projectId: project.id });
      component.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should show "Edit Project" as title', () => {
      expect(container.querySelector('h1').textContent).toBe('Edit Project');
    });

    it('should pre-fill the form with existing project data', () => {
      expect(container.querySelector('#project-name').value).toBe(project.name);
      expect(container.querySelector('#project-description').value).toBe(project.description);
    });

    it('should PUT to /api/projects/:id on valid submit', async () => {
      vi.restoreAllMocks();
      const putMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ project: { ...project, name: 'Updated Name' } }),
      });
      vi.stubGlobal('fetch', putMock);

      container.querySelector('#project-name').value = 'Updated Name';
      container.querySelector('#project-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(putMock).toHaveBeenCalledWith(
        `/api/projects/${project.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should show a 403 error message if user is not the owner', async () => {
      vi.restoreAllMocks();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Unauthorized' }),
      }));

      container.querySelector('#project-name').value = 'Attempt';
      container.querySelector('#project-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const error = container.querySelector('.form__error');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('not allowed');
    });
  });
});
