/**
 * Task Service (Application Use Case)
 * Handles CRUD operations for Tasks, enforcing business rules like project ownership.
 */
export const createTaskService = ({ taskRepository, projectRepository }) => {
  /**
   * Helper to ensure the user owns the project before touching tasks.
   */
  const ensureProjectOwnership = async ({ projectId, ownerId }) => {
    const project = await projectRepository.findById({ id: projectId });
    if (!project) return { ok: false, error: new Error('Project not found') };
    if (project.ownerId !== ownerId) return { ok: false, error: new Error('Unauthorized') };
    return { ok: true };
  };

  return Object.freeze({
    /**
     * Creates a new task within a project.
     * @param {Object} input - { title, description, status, projectId, ownerId }
     */
    async create({ title, description, status, projectId, ownerId }) {
      if (!title || !projectId || !ownerId) {
        return { ok: false, error: new Error('Missing required fields') };
      }

      try {
        const authCheck = await ensureProjectOwnership({ projectId, ownerId });
        if (!authCheck.ok) return authCheck;

        const task = await taskRepository.create({ title, description, status, projectId });
        return { ok: true, value: task };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Finds all tasks for a specific project. Publicly visible to all authenticated users.
     * @param {Object} input - { projectId }
     */
    async findByProject({ projectId }) {
      if (!projectId) {
        return { ok: false, error: new Error('projectId is required') };
      }

      try {
        const project = await projectRepository.findById({ id: projectId });
        if (!project) {
          return { ok: false, error: new Error('Project not found') };
        }

        const tasks = await taskRepository.findByProjectId({ projectId });
        return { ok: true, value: tasks };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Updates a task.
     * @param {Object} input - { id, projectId, ownerId, data }
     */
    async update({ id, projectId, ownerId, data }) {
      if (!id || !projectId || !ownerId) {
        return { ok: false, error: new Error('Missing required fields') };
      }

      try {
        const authCheck = await ensureProjectOwnership({ projectId, ownerId });
        if (!authCheck.ok) return authCheck;

        const task = await taskRepository.findById({ id });
        if (!task || task.projectId !== projectId) {
          return { ok: false, error: new Error('Task not found in this project') };
        }

        const updatedTask = await taskRepository.update({ id, data });
        return { ok: true, value: updatedTask };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Deletes a task.
     * @param {Object} input - { id, projectId, ownerId }
     */
    async delete({ id, projectId, ownerId }) {
      if (!id || !projectId || !ownerId) {
        return { ok: false, error: new Error('Missing required fields') };
      }

      try {
        const authCheck = await ensureProjectOwnership({ projectId, ownerId });
        if (!authCheck.ok) return authCheck;

        const task = await taskRepository.findById({ id });
        if (!task || task.projectId !== projectId) {
          return { ok: false, error: new Error('Task not found in this project') };
        }

        await taskRepository.delete({ id });
        return { ok: true, value: true };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Reorders tasks.
     * @param {Object} input - { tasks, projectId, ownerId }
     * tasks format: [{ id: '1', order: 1 }, { id: '2', order: 2 }]
     */
    async reorder({ tasks, projectId, ownerId }) {
      if (!Array.isArray(tasks) || !projectId || !ownerId) {
        return { ok: false, error: new Error('Invalid input format') };
      }

      try {
        const authCheck = await ensureProjectOwnership({ projectId, ownerId });
        if (!authCheck.ok) return authCheck;

        // In a real DB, this would be a transaction batch update
        await taskRepository.updateOrder({ tasks });
        return { ok: true, value: true };
      } catch (error) {
        return { ok: false, error };
      }
    }
  });
};
