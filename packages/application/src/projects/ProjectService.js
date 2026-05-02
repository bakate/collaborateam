/**
 * Project Service (Application Use Case)
 * Handles CRUD operations for Projects, enforcing business rules like ownership.
 */
export const createProjectService = ({ projectRepository }) => {
  return Object.freeze({
    /**
     * Creates a new project.
     * @param {Object} input - { name, description, ownerId }
     */
    async create({ name, description, ownerId }) {
      if (!name || !ownerId) {
        return { ok: false, error: new Error('Missing required fields') };
      }

      try {
        const project = await projectRepository.create({ name, description, ownerId });
        return { ok: true, value: project };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Finds all projects. Publicly visible to all authenticated users.
     * Optionally filters by ownerId to show only a user's own projects.
     * @param {Object} [input] - { ownerId? }
     */
    async findAll({ ownerId } = {}) {
      try {
        const projects = ownerId
          ? await projectRepository.findByOwnerId({ ownerId })
          : await projectRepository.findAll();
        return { ok: true, value: projects };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Finds a project by its ID. Publicly visible to all authenticated users.
     * @param {Object} input - { id }
     */
    async findById({ id }) {
      if (!id) {
        return { ok: false, error: new Error('id is required') };
      }

      try {
        const project = await projectRepository.findById({ id });
        if (!project) {
          return { ok: false, error: new Error('Project not found') };
        }
        return { ok: true, value: project };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Updates a project, ensuring the owner matches.
     * @param {Object} input - { id, ownerId, data }
     */
    async update({ id, ownerId, data }) {
      if (!id || !ownerId) {
        return { ok: false, error: new Error('id and ownerId are required') };
      }

      try {
        const project = await projectRepository.findById({ id });
        if (!project) {
          return { ok: false, error: new Error('Project not found') };
        }

        if (project.ownerId !== ownerId) {
          return { ok: false, error: new Error('Unauthorized') };
        }

        const updatedProject = await projectRepository.update({ id, data });
        return { ok: true, value: updatedProject };
      } catch (error) {
        return { ok: false, error };
      }
    },

    /**
     * Deletes a project, ensuring the owner matches.
     * @param {Object} input - { id, ownerId }
     */
    async delete({ id, ownerId }) {
      if (!id || !ownerId) {
        return { ok: false, error: new Error('id and ownerId are required') };
      }

      try {
        const project = await projectRepository.findById({ id });
        if (!project) {
          return { ok: false, error: new Error('Project not found') };
        }

        if (project.ownerId !== ownerId) {
          return { ok: false, error: new Error('Unauthorized') };
        }

        await projectRepository.delete({ id });
        return { ok: true, value: true };
      } catch (error) {
        return { ok: false, error };
      }
    }
  });
};
