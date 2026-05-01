import { describe, it, expect } from 'vitest';
import { QueryStringParser } from './QueryStringParser.js';

describe('QueryStringParser', () => {
  describe('parse', () => {
    it('should return empty object for empty string', () => {
      expect(QueryStringParser.parse('')).toEqual({});
      expect(QueryStringParser.parse('?')).toEqual({});
    });

    it('should parse simple query string', () => {
      expect(QueryStringParser.parse('?sort=asc&page=2')).toEqual({ sort: 'asc', page: '2' });
    });

    it('should handle values with URL encoding', () => {
      expect(QueryStringParser.parse('?name=John%20Doe')).toEqual({ name: 'John Doe' });
    });

    it('should handle keys without values', () => {
      expect(QueryStringParser.parse('?flag&sort=asc')).toEqual({ flag: '', sort: 'asc' });
    });
  });

  describe('parsePath', () => {
    it('should separate pathname and search', () => {
      expect(QueryStringParser.parsePath('/projects?sort=asc')).toEqual({
        pathname: '/projects',
        search: '?sort=asc'
      });
    });

    it('should handle path without search', () => {
      expect(QueryStringParser.parsePath('/projects')).toEqual({
        pathname: '/projects',
        search: ''
      });
    });

    it('should handle empty string', () => {
      expect(QueryStringParser.parsePath('')).toEqual({
        pathname: '',
        search: ''
      });
    });
  });
});
