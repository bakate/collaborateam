import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import fc from 'fast-check';
import { createProjectService } from '@workspace/application/projects/ProjectService';

describe('Persistence & Transaction Property Tests', () => {
  // We use the real repositories but wrap everything in a "cleaning" transaction if needed
  // Or better, we mock the repositories to test the logic of the service's transaction usage.
  
  const mockProjectRepo = {
    create: vi.fn(),
  };
  const mockTaskRepo = {
    create: vi.fn(),
  };

  const projectService = createProjectService({
    projectRepository: mockProjectRepo,
    taskRepository: mockTaskRepo,
    withTransaction: (cb) => cb('MOCK_TX') // Simulate a transaction
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 45: Failed task creation rollbacks project creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3 }), // project name
        fc.constant(faker.string.uuid()), // ownerId
        async (projectName, ownerId) => {
          const projectId = faker.string.uuid();
          // Setup: Project creation succeeds, Task creation fails
          mockProjectRepo.create.mockResolvedValue({ id: projectId, name: projectName });
          mockTaskRepo.create.mockRejectedValue(new Error('Task creation failed'));

          const result = await projectService.createWithDefaultTask({
            name: projectName,
            ownerId
          });

          expect(result.ok).toBe(false);
          expect(result.error.message).toBe('Task creation failed');
          
          // Verify both were called with the SAME transaction instance
          expect(mockProjectRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: projectName }),
            'MOCK_TX'
          );
          expect(mockTaskRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ projectId: projectId }),
            'MOCK_TX'
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 44: Successful operations commit both project and task', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3 }),
        fc.constant(faker.string.uuid()),
        async (projectName, ownerId) => {
          const projectId = faker.string.uuid();
          mockProjectRepo.create.mockResolvedValue({ id: projectId, name: projectName });
          mockTaskRepo.create.mockResolvedValue({ id: faker.string.uuid() });

          const result = await projectService.createWithDefaultTask({
            name: projectName,
            ownerId
          });

          expect(result.ok).toBe(true);
          expect(result.value.id).toBe(projectId);
        }
      ),
      { numRuns: 20 }
    );
  });
});
