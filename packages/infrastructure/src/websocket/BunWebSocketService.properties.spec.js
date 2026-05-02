import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createBunWebSocketService } from './BunWebSocketService.js';

describe('BunWebSocketService Properties', () => {
  it('Property 23: Task Operations Broadcast to All Project Clients', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // projectId
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), // connected user IDs
        fc.constantFrom('task:created', 'task:updated', 'task:deleted', 'task:reordered'),
        fc.record({ taskId: fc.uuid(), status: fc.string() }),
        async (projectId, userIds, event, taskData) => {
          const wsService = createBunWebSocketService();
          const mockServer = { publish: vi.fn() };
          wsService.init({ server: mockServer });

          // Register all users and join them to the project
          for (const userId of userIds) {
            const mockSocket = { subscribe: vi.fn(), unsubscribe: vi.fn(), send: vi.fn() };
            wsService.registerClient({ userId, socket: mockSocket });
            wsService.joinProject({ userId, projectId });
          }

          const result = wsService.broadcastToProject({ projectId, event, data: taskData });

          // Property: broadcast always succeeds when server is initialized
          expect(result.ok).toBe(true);
          // Property: server.publish is called exactly once with the correct topic
          expect(mockServer.publish).toHaveBeenCalledTimes(1);
          expect(mockServer.publish).toHaveBeenCalledWith(
            projectId,
            expect.stringContaining(event)
          );
        }
      )
    );
  });

  it('Property 26: Connected Users Display Matches Actual', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }), // total users
        fc.uuid(), // one specific project
        fc.boolean(), // should each user join the project?
        async (userIds, projectId, allJoin) => {
          const wsService = createBunWebSocketService();
          wsService.init({ server: { publish: vi.fn() } });

          const joinedUsers = [];

          for (const userId of userIds) {
            const mockSocket = { subscribe: vi.fn(), unsubscribe: vi.fn(), send: vi.fn() };
            wsService.registerClient({ userId, socket: mockSocket });

            if (allJoin || Math.random() > 0.5) {
              wsService.joinProject({ userId, projectId });
              joinedUsers.push(userId);
            }
          }

          const result = wsService.getConnectedUsers({ projectId });

          expect(result.ok).toBe(true);
          // Property: every returned userId actually joined the project
          for (const uid of result.value) {
            expect(joinedUsers).toContain(uid);
          }
          // Property: total connected is a subset of all registered users
          expect(result.value.length).toBeLessThanOrEqual(userIds.length);
        }
      )
    );
  });
});
