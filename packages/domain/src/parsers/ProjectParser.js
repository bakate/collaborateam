import { createProject } from '../entities/Project.js';

export const ProjectParser = {
  /**
   * Parses a JSON string or object into a Project entity.
   * Returns an Either-like object: { ok: true, value: Project } or { ok: false, error: Error }
   */
  parse({ json }) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      const validationResult = this.validate({ projectData: parsed });
      
      if (!validationResult.ok) {
        return validationResult;
      }
      
      return { ok: true, value: createProject(parsed) };
    } catch (error) {
      return { ok: false, error: new Error(`Failed to parse Project JSON: ${error.message}`) };
    }
  },

  /**
   * Serializes a Project entity to a JSON string.
   */
  serialize({ project }) {
    try {
      if (!project || typeof project !== 'object') {
        return { ok: false, error: new Error('Invalid project provided for serialization') };
      }
      return { ok: true, value: JSON.stringify(project) };
    } catch (error) {
      return { ok: false, error: new Error(`Failed to serialize Project: ${error.message}`) };
    }
  },

  /**
   * Validates the raw project data before entity creation.
   */
  validate({ projectData }) {
    if (!projectData) {
      return { ok: false, error: new Error('Project data is required') };
    }
    if (!projectData.id || typeof projectData.id !== 'string') {
      return { ok: false, error: new Error('Project id is required and must be a string') };
    }
    if (!projectData.name || typeof projectData.name !== 'string') {
      return { ok: false, error: new Error('Project name is required and must be a string') };
    }
    if (!projectData.ownerId || typeof projectData.ownerId !== 'string') {
      return { ok: false, error: new Error('Project ownerId is required and must be a string') };
    }
    
    return { ok: true, value: projectData };
  }
};
