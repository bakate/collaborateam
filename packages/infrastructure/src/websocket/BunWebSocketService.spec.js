import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createBunWebSocketService } from './BunWebSocketService.js';

describe('BunWebSocketService Unit Tests', () => {
  let wsService;
  let mockServer;
  let mockSocket;

  beforeEach(() => {
    wsService = createBunWebSocketService();

    mockServer = { publish: vi.fn() };
    mockSocket = { subscribe: vi.fn(), unsubscribe: vi.fn(), send: vi.fn() };

    wsService.init({ server: mockServer });
  });

  describe('Client lifecycle', () => {
    it('should register and unregister clients', () => {
      const userId = faker.string.uuid();

      wsService.registerClient({ userId, socket: mockSocket });
      expect(wsService.getConnectedUsers().value).toContain(userId);

      wsService.unregisterClient({ userId });
      expect(wsService.getConnectedUsers().value).not.toContain(userId);
    });
  });

  describe('joinProject() / leaveProject()', () => {
    it('should subscribe a client to a project room', () => {
      const userId = faker.string.uuid();
      const projectId = faker.string.uuid();

      wsService.registerClient({ userId, socket: mockSocket });

      const result = wsService.joinProject({ userId, projectId });

      expect(result.ok).toBe(true);
      expect(mockSocket.subscribe).toHaveBeenCalledWith(projectId);
    });

    it('should unsubscribe a client from a project room', () => {
      const userId = faker.string.uuid();
      const projectId = faker.string.uuid();

      wsService.registerClient({ userId, socket: mockSocket });
      wsService.joinProject({ userId, projectId });

      const result = wsService.leaveProject({ userId, projectId });

      expect(result.ok).toBe(true);
      expect(mockSocket.unsubscribe).toHaveBeenCalledWith(projectId);
    });

    it('should fail join/leave for unregistered user', () => {
      const result = wsService.joinProject({ userId: 'ghost', projectId: 'p1' });
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Client not connected');
    });
  });

  describe('broadcastToProject()', () => {
    it('should broadcast to project room within 100ms', () => {
      const projectId = faker.string.uuid();
      const event = 'task:updated';
      const data = { taskId: faker.string.uuid(), status: 'done' };

      const start = Date.now();
      const result = wsService.broadcastToProject({ projectId, event, data });
      const duration = Date.now() - start;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100);

      expect(mockServer.publish).toHaveBeenCalledWith(
        projectId,
        expect.stringContaining(event)
      );
    });

    it('should include event, data, and timestamp in broadcast message', () => {
      const projectId = faker.string.uuid();
      wsService.broadcastToProject({ projectId, event: 'task:created', data: { id: '1' } });

      const publishedMessage = JSON.parse(mockServer.publish.mock.calls[0][1]);
      expect(publishedMessage.event).toBe('task:created');
      expect(publishedMessage.data).toEqual({ id: '1' });
      expect(publishedMessage.timestamp).toBeTypeOf('number');
    });
  });

  describe('broadcastToUser()', () => {
    it('should send a direct message to a connected user', () => {
      const userId = faker.string.uuid();
      wsService.registerClient({ userId, socket: mockSocket });

      const result = wsService.broadcastToUser({ 
        userId, 
        event: 'notification', 
        data: { message: 'Hello!' } 
      });

      expect(result.ok).toBe(true);
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('notification')
      );
    });

    it('should fail for disconnected user', () => {
      const result = wsService.broadcastToUser({ userId: 'ghost', event: 'ping', data: {} });
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('User not connected');
    });
  });

  describe('getConnectedUsers()', () => {
    it('should filter connected users by projectId', () => {
      const userId1 = faker.string.uuid();
      const userId2 = faker.string.uuid();
      const projectId = faker.string.uuid();

      const socket1 = { subscribe: vi.fn(), unsubscribe: vi.fn(), send: vi.fn() };
      const socket2 = { subscribe: vi.fn(), unsubscribe: vi.fn(), send: vi.fn() };

      wsService.registerClient({ userId: userId1, socket: socket1 });
      wsService.registerClient({ userId: userId2, socket: socket2 });

      // Only userId1 joins the project
      wsService.joinProject({ userId: userId1, projectId });

      const result = wsService.getConnectedUsers({ projectId });

      expect(result.ok).toBe(true);
      expect(result.value).toContain(userId1);
      expect(result.value).not.toContain(userId2);
    });
  });
});
