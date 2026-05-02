import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createProjectService } from './ProjectService.js';

describe('ProjectService Unit Tests', () => {
  let projectRepository;
  let projectService;

  beforeEach(() => {
    projectRepository = {
      create: vi.fn(),
      findByOwnerId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    projectService = createProjectService({ projectRepository });
  });

  describe('create()', () => {
    it('should create a project successfully', async () => {
      const mockProject = {
        id: faker.string.uuid(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        ownerId: faker.string.uuid(),
      };
      
      projectRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.create({
        name: mockProject.name,
        description: mockProject.description,
        ownerId: mockProject.ownerId,
      });

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(mockProject);
      expect(projectRepository.create).toHaveBeenCalledWith({
        name: mockProject.name,
        description: mockProject.description,
        ownerId: mockProject.ownerId,
      });
    });

    it('should fail fast if required fields are missing', async () => {
      const result = await projectService.create({ name: '' });
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('Missing required fields');
      expect(projectRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById()', () => {
    it('should return the project if user is owner', async () => {
      const ownerId = faker.string.uuid();
      const mockProject = { id: faker.string.uuid(), ownerId };
      projectRepository.findById.mockResolvedValue(mockProject);

      const result = await projectService.findById({ id: mockProject.id, ownerId });
      
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(mockProject);
    });

    it('should return Unauthorized if user is not owner', async () => {
      const ownerId = faker.string.uuid();
      const mockProject = { id: faker.string.uuid(), ownerId: faker.string.uuid() };
      projectRepository.findById.mockResolvedValue(mockProject);

      const result = await projectService.findById({ id: mockProject.id, ownerId });
      
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Unauthorized');
    });
  });

  describe('update()', () => {
    it('should update the project if user is owner', async () => {
      const ownerId = faker.string.uuid();
      const mockProject = { id: faker.string.uuid(), ownerId };
      const updatedProject = { ...mockProject, name: 'New Name' };
      
      projectRepository.findById.mockResolvedValue(mockProject);
      projectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectService.update({ 
        id: mockProject.id, 
        ownerId, 
        data: { name: 'New Name' } 
      });
      
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(updatedProject);
    });
  });
});
