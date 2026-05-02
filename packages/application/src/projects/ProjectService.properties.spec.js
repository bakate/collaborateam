import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createProjectService } from './ProjectService.js';

describe('ProjectService Properties', () => {
  it('Property 12: Project List Matches User\'s Projects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.record({ id: fc.uuid(), name: fc.string() })),
        async (ownerId, mockProjects) => {
          const projectRepository = {
            findByOwnerId: vi.fn().mockResolvedValue(mockProjects)
          };
          const projectService = createProjectService({ projectRepository });

          const result = await projectService.findAll({ ownerId });

          expect(result.ok).toBe(true);
          expect(result.value).toEqual(mockProjects);
          expect(projectRepository.findByOwnerId).toHaveBeenCalledWith({ ownerId });
        }
      )
    );
  });

  it('Property 13 & 14: Project Creation and Updates Persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          ownerId: fc.uuid()
        }),
        fc.string({ minLength: 1 }), // new name for update
        async (projectData, newName) => {
          const mockDb = new Map();
          
          const projectRepository = {
            create: vi.fn().mockImplementation(async (data) => {
              const entity = { id: projectData.id, ...data };
              mockDb.set(entity.id, entity);
              return entity;
            }),
            findById: vi.fn().mockImplementation(async ({ id }) => mockDb.get(id)),
            update: vi.fn().mockImplementation(async ({ id, data }) => {
              const entity = { ...mockDb.get(id), ...data };
              mockDb.set(id, entity);
              return entity;
            })
          };
          
          const projectService = createProjectService({ projectRepository });

          // 1. Create
          const createResult = await projectService.create({
            name: projectData.name,
            description: projectData.description,
            ownerId: projectData.ownerId
          });
          
          expect(createResult.ok).toBe(true);
          expect(mockDb.has(projectData.id)).toBe(true);

          // 2. Update (Property 14)
          const updateResult = await projectService.update({
            id: projectData.id,
            ownerId: projectData.ownerId,
            data: { name: newName }
          });
          
          expect(updateResult.ok).toBe(true);
          expect(mockDb.get(projectData.id).name).toBe(newName);
        }
      )
    );
  });

  it('Property 15: Project Deletion Succeeds (Cascade handled by DB)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.boolean(), // Is the user the owner?
        async (projectId, requestOwnerId, isOwner) => {
          const projectOwnerId = isOwner ? requestOwnerId : 'different_owner_id';
          
          const projectRepository = {
            findById: vi.fn().mockResolvedValue({ id: projectId, ownerId: projectOwnerId }),
            delete: vi.fn().mockResolvedValue(true)
          };
          
          const projectService = createProjectService({ projectRepository });

          const result = await projectService.delete({ id: projectId, ownerId: requestOwnerId });

          if (isOwner) {
            expect(result.ok).toBe(true);
            expect(projectRepository.delete).toHaveBeenCalledWith({ id: projectId });
          } else {
            expect(result.ok).toBe(false);
            expect(result.error.message).toBe('Unauthorized');
            expect(projectRepository.delete).not.toHaveBeenCalled();
          }
        }
      )
    );
  });
});
