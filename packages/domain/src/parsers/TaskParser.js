import { createTask, TaskStatus } from '../entities/Task.js';

export const TaskParser = {
  /**
   * Parses a JSON string or object into a Task entity.
   * Returns an Either-like object: { ok: true, value: Task } or { ok: false, error: Error }
   */
  parse({ json }) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      const validationResult = this.validate({ taskData: parsed });
      
      if (!validationResult.ok) {
        return validationResult;
      }
      
      return { ok: true, value: createTask(parsed) };
    } catch (error) {
      return { ok: false, error: new Error(`Failed to parse Task JSON: ${error.message}`) };
    }
  },

  /**
   * Serializes a Task entity to a JSON string.
   */
  serialize({ task }) {
    try {
      // Small validation to ensure it's a valid object
      if (!task || typeof task !== 'object') {
        return { ok: false, error: new Error('Invalid task provided for serialization') };
      }
      return { ok: true, value: JSON.stringify(task) };
    } catch (error) {
      return { ok: false, error: new Error(`Failed to serialize Task: ${error.message}`) };
    }
  },

  /**
   * Validates the raw task data before entity creation.
   */
  validate({ taskData }) {
    if (!taskData) {
      return { ok: false, error: new Error('Task data is required') };
    }
    if (!taskData.id || typeof taskData.id !== 'string') {
      return { ok: false, error: new Error('Task id is required and must be a string') };
    }
    if (!taskData.title || typeof taskData.title !== 'string') {
      return { ok: false, error: new Error('Task title is required and must be a string') };
    }
    if (!taskData.projectId || typeof taskData.projectId !== 'string') {
      return { ok: false, error: new Error('Task projectId is required and must be a string') };
    }
    if (taskData.status && !Object.values(TaskStatus).includes(taskData.status)) {
      return { ok: false, error: new Error(`Invalid status: ${taskData.status}`) };
    }
    
    return { ok: true, value: taskData };
  }
};
