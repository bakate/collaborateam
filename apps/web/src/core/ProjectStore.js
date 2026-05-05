import { apiClient } from './APIClient.js';

/**
 * ProjectStore — Manages the list of projects and prefetching logic.
 */
class ProjectStore {
  constructor() {
    this._projects = [];
    this._loading = false;
    this._error = null;
    this._listeners = new Set();
    this._prefetchPromise = null;
  }

  get projects() { return this._projects; }
  get loading() { return this._loading; }
  get error() { return this._error; }

  /**
   * Starts prefetching projects if not already doing so.
   * Useful for Render cold starts.
   */
  prefetch() {
    if (this._prefetchPromise || this._projects.length > 0) {
      return this._prefetchPromise;
    }

    this._prefetchPromise = this.fetchProjects();
    return this._prefetchPromise;
  }

  async fetchProjects(mineOnly = false) {
    this._loading = true;
    this._error = null;
    this._notify();

    try {
      const query = mineOnly ? "?mine=true" : "";
      const response = await apiClient.get(`/projects${query}`);

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      this._projects = data.projects || [];
      this._loading = false;
      this._error = null;
      this._notify();
      return this._projects;
    } catch (err) {
      this._loading = false;
      this._error = err.message;
      this._notify();
      throw err;
    } finally {
      this._prefetchPromise = null;
    }
  }

  addProject(project) {
    this._projects = [project, ...this._projects];
    this._notify();
  }

  updateProject(updatedProject) {
    this._projects = this._projects.map(p => 
      p.id === updatedProject.id ? { ...p, ...updatedProject } : p
    );
    this._notify();
  }

  removeProject(projectId) {
    this._projects = this._projects.filter(p => p.id !== projectId);
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    const state = {
      projects: this._projects,
      loading: this._loading,
      error: this._error
    };
    for (const listener of this._listeners) {
      listener(state);
    }
  }

  invalidate() {
    this._projects = [];
    this._prefetchPromise = null;
    this._notify();
  }

  clear() {
    this._projects = [];
    this._loading = false;
    this._error = null;
    this._prefetchPromise = null;
    this._notify();
  }
}

export const projectStore = new ProjectStore();
