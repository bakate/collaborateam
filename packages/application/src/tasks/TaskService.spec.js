import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createTaskService } from './TaskService.js';

describe('TaskService Unit Tests', () => {
  let taskRepository;
  let projectRepository;
  let taskService;

  beforeEach(() => {
    taskRepository = {
      create: vi.fn(),
      findByProjectId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateOrder: vi.fn(),
    };
    projectRepository = {
      findById: vi.fn(),
    };
    taskService = createTaskService({ taskRepository, projectRepository });
  });

  describe('create()', () => {
    it('should create a task successfully when user owns the project', async () => {
      const ownerId = faker.string.uuid();
      const projectId = faker.string.uuid();
      
      projectRepository.findById.mockResolvedValue({ id: projectId, ownerId });
      
      const mockTask = {
        id: faker.string.uuid(),
        title: faker.lorem.words(),
        description: faker.lorem.sentence(),
        projectId,
      };
      
      taskRepository.create.mockResolvedValue(mockTask);

      const result = await taskService.create({
        title: mockTask.title,
        description: mockTask.description,
        status: 'todo',
        projectId,
        ownerId,
      });

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(mockTask);
      expect(projectRepository.findById).toHaveBeenCalledWith({ id: projectId });
      expect(taskRepository.create).toHaveBeenCalled();
    });

    it('should fail if project is not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      const result = await taskService.create({
        title: 'Task',
        projectId: 'p1',
        ownerId: 'u1',
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Project not found');
      expect(taskRepository.create).not.toHaveBeenCalled();
    });

    it('should return Unauthorized if user does not own project', async () => {
      projectRepository.findById.mockResolvedValue({ id: 'p1', ownerId: 'other_user' });

      const result = await taskService.create({
        title: 'Task',
        projectId: 'p1',
        ownerId: 'u1',
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Unauthorized');
      expect(taskRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should update task and return in < 200ms', async () => {
      const ownerId = faker.string.uuid();
      const projectId = faker.string.uuid();
      const taskId = faker.string.uuid();

      projectRepository.findById.mockResolvedValue({ id: projectId, ownerId });
      taskRepository.findById.mockResolvedValue({ id: taskId, projectId });
      
      const updatedTask = { id: taskId, title: 'Updated' };
      taskRepository.update.mockResolvedValue(updatedTask);

      const start = Date.now();
      const result = await taskService.update({
        id: taskId,
        projectId,
        ownerId,
        data: { title: 'Updated' }
      });
      const duration = Date.now() - start;

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(updatedTask);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('delete()', () => {
    it('should delete a task', async () => {
      const ownerId = faker.string.uuid();
      const projectId = faker.string.uuid();
      const taskId = faker.string.uuid();

      projectRepository.findById.mockResolvedValue({ id: projectId, ownerId });
      taskRepository.findById.mockResolvedValue({ id: taskId, projectId });
      taskRepository.delete.mockResolvedValue(true);

      const result = await taskService.delete({ id: taskId, projectId, ownerId });

      expect(result.ok).toBe(true);
      expect(taskRepository.delete).toHaveBeenCalledWith({ id: taskId });
    });
  });

  describe('reorder()', () => {
    it('should reorder tasks successfully', async () => {
      const ownerId = faker.string.uuid();
      const projectId = faker.string.uuid();
      
      projectRepository.findById.mockResolvedValue({ id: projectId, ownerId });
      taskRepository.updateOrder.mockResolvedValue(true);

      const tasks = [{ id: '1', order: 1 }, { id: '2', order: 2 }];
      const result = await taskService.reorder({ tasks, projectId, ownerId });

      expect(result.ok).toBe(true);
      expect(taskRepository.updateOrder).toHaveBeenCalledWith({ tasks });
    });
  });
});
