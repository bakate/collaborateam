import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createTaskService } from './TaskService.js';

describe('TaskService Properties', () => {
  it('Property 17: Task List Matches Project\'s Tasks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.record({ id: fc.uuid(), title: fc.string() })),
        fc.boolean(), // Does the user own the project?
        async (projectId, requestOwnerId, mockTasks, isOwner) => {
          const projectOwnerId = isOwner ? requestOwnerId : 'different_owner_id';
          
          const projectRepository = {
            findById: vi.fn().mockResolvedValue({ id: projectId, ownerId: projectOwnerId })
          };
          const taskRepository = {
            findByProjectId: vi.fn().mockResolvedValue(mockTasks)
          };
          
          const taskService = createTaskService({ taskRepository, projectRepository });

          const result = await taskService.findByProject({ projectId });
          
          expect(result.ok).toBe(true);
          expect(result.value).toEqual(mockTasks);
          expect(taskRepository.findByProjectId).toHaveBeenCalledWith({ projectId });
        }
      )
    );
  });

  it('Property 18 & 19: Task Creation and Updates Persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          projectId: fc.uuid(),
          ownerId: fc.uuid()
        }),
        fc.string({ minLength: 1 }), // new title for update
        async (taskData, newTitle) => {
          const mockDb = new Map();
          
          const projectRepository = {
            findById: vi.fn().mockResolvedValue({ id: taskData.projectId, ownerId: taskData.ownerId })
          };

          const taskRepository = {
            create: vi.fn().mockImplementation(async (data) => {
              const entity = { id: taskData.id, ...data };
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
          
          const taskService = createTaskService({ taskRepository, projectRepository });

          // 1. Create (Property 18)
          const createResult = await taskService.create({
            title: taskData.title,
            projectId: taskData.projectId,
            ownerId: taskData.ownerId
          });
          
          expect(createResult.ok).toBe(true);
          expect(mockDb.has(taskData.id)).toBe(true);

          // 2. Update (Property 19)
          const updateResult = await taskService.update({
            id: taskData.id,
            projectId: taskData.projectId,
            ownerId: taskData.ownerId,
            data: { title: newTitle }
          });
          
          expect(updateResult.ok).toBe(true);
          expect(mockDb.get(taskData.id).title).toBe(newTitle);
        }
      )
    );
  });
});
