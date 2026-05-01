import { describe, it, expect } from 'vitest';
import { RouteMatcher } from './RouteMatcher.js';

describe('RouteMatcher', () => {
  describe('extractParamNames', () => {
    it('should return an empty array for static routes', () => {
      expect(RouteMatcher.extractParamNames('/home')).toEqual([]);
    });

    it('should extract one parameter', () => {
      expect(RouteMatcher.extractParamNames('/projects/:id')).toEqual(['id']);
    });

    it('should extract multiple parameters', () => {
      expect(RouteMatcher.extractParamNames('/projects/:projectId/tasks/:taskId')).toEqual(['projectId', 'taskId']);
    });
  });

  describe('pathToRegex', () => {
    it('should create regex for static route', () => {
      const regex = RouteMatcher.pathToRegex('/home');
      expect(regex.test('/home')).toBe(true);
      expect(regex.test('/home/extra')).toBe(false);
    });

    it('should create regex for dynamic route', () => {
      const regex = RouteMatcher.pathToRegex('/projects/:id');
      expect(regex.test('/projects/123')).toBe(true);
      const match = '/projects/123'.match(regex);
      expect(match[1]).toBe('123');
    });

    it('should match catch-all route', () => {
      const regex = RouteMatcher.pathToRegex('*');
      expect(regex.test('/anything')).toBe(true);
    });
  });
});
