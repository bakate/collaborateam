/**
 * BunWebSocketService (Infrastructure Adapter)
 * Implements real-time broadcasting via Bun's native WebSocket API.
 *
 * Architecture:
 * - Each client subscribes to "rooms" (topic strings in Bun WS) for their projects.
 * - Messages are published via server.publish(topic, data) — no Socket.io needed.
 * - Connected users are tracked in an in-memory Map keyed by userId.
 */

export const createBunWebSocketService = () => {
  // server: Bun's server instance, set via init()
  let bunServer = null;

  // Map<userId, { socket: ServerWebSocket, projectIds: Set<string> }>
  const connectedClients = new Map();

  /**
   * Registers the Bun server instance so we can call server.publish().
   * Must be called once after Bun.serve() starts.
   */
  const init = ({ server }) => {
    bunServer = server;
  };

  /**
   * Registers a WebSocket client when it connects.
   * @param {Object} input - { userId, socket }
   */
  const registerClient = ({ userId, socket }) => {
    connectedClients.set(userId, { socket, projectIds: new Set() });
  };

  /**
   * Unregisters a WebSocket client when it disconnects.
   * @param {Object} input - { userId }
   */
  const unregisterClient = ({ userId }) => {
    connectedClients.delete(userId);
  };

  /**
   * Subscribes a user's socket to a project room (Bun topic).
   * @param {Object} input - { userId, projectId }
   */
  const joinProject = ({ userId, projectId }) => {
    const client = connectedClients.get(userId);
    if (!client) return { ok: false, error: new Error('Client not connected') };

    client.socket.subscribe(projectId);
    client.projectIds.add(projectId);
    return { ok: true };
  };

  /**
   * Unsubscribes a user's socket from a project room.
   * @param {Object} input - { userId, projectId }
   */
  const leaveProject = ({ userId, projectId }) => {
    const client = connectedClients.get(userId);
    if (!client) return { ok: false, error: new Error('Client not connected') };

    client.socket.unsubscribe(projectId);
    client.projectIds.delete(projectId);
    return { ok: true };
  };

  /**
   * Broadcasts a message to all clients in a project room.
   * @param {Object} input - { projectId, event, data }
   */
  const broadcastToProject = ({ projectId, event, data }) => {
    if (!bunServer) return { ok: false, error: new Error('WebSocket server not initialized') };

    const message = JSON.stringify({ event, data, timestamp: Date.now() });
    bunServer.publish(projectId, message);
    return { ok: true };
  };

  /**
   * Sends a message directly to a specific user.
   * @param {Object} input - { userId, event, data }
   */
  const broadcastToUser = ({ userId, event, data }) => {
    const client = connectedClients.get(userId);
    if (!client) return { ok: false, error: new Error('User not connected') };

    const message = JSON.stringify({ event, data, timestamp: Date.now() });
    client.socket.send(message);
    return { ok: true };
  };

  /**
   * Returns the list of connected users, optionally filtered by projectId.
   * @param {Object} [input] - { projectId? }
   */
  const getConnectedUsers = ({ projectId } = {}) => {
    if (!projectId) {
      return { ok: true, value: [...connectedClients.keys()] };
    }

    const usersInProject = [...connectedClients.entries()]
      .filter(([, client]) => client.projectIds.has(projectId))
      .map(([userId]) => userId);

    return { ok: true, value: usersInProject };
  };

  return Object.freeze({
    init,
    registerClient,
    unregisterClient,
    joinProject,
    leaveProject,
    broadcastToProject,
    broadcastToUser,
    getConnectedUsers,
  });
};
