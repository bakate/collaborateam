import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyMiddlewares } from './middlewares/wrapper.js';
import { runMigrations } from './db/migrate.js';
import { sql } from './db.js';
import { logger } from './config/logger.js';

// Mock dependencies
vi.mock('./db.js', () => ({
  sql: vi.fn(),
  checkConnection: vi.fn().mockResolvedValue(true)
}));

vi.mock('./config/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('Backend Server Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Global Error Handler & Middlewares', () => {
    it('should inject CORS and Security headers on successful response', async () => {
      const mockHandler = async () => new Response('OK', { status: 200 });
      const wrappedHandler = applyMiddlewares(mockHandler);
      
      const req = new Request('http://localhost/health');
      const res = await wrappedHandler(req);
      
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const mockHandler = vi.fn();
      const wrappedHandler = applyMiddlewares(mockHandler);
      
      const req = new Request('http://localhost/api/data', { method: 'OPTIONS' });
      const res = await wrappedHandler(req);
      
      expect(res.status).toBe(200);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should catch unhandled exceptions and return 500', async () => {
      const mockHandler = async () => {
        throw new Error('Unexpected crash');
      };
      const wrappedHandler = applyMiddlewares(mockHandler);
      
      const req = new Request('http://localhost/error');
      const res = await wrappedHandler(req);
      
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Internal Server Error');
      // Should also contain security headers
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      
      // Logger should have caught it
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Database Migrations', () => {
    it('should run migrations successfully', async () => {
      sql.mockResolvedValueOnce([]); // Users
      sql.mockResolvedValueOnce([]); // Projects
      sql.mockResolvedValueOnce([]); // Tasks
      
      const result = await runMigrations();
      
      expect(result.ok).toBe(true);
      expect(sql).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith('Migrations completed successfully');
    });

    it('should handle migration failures', async () => {
      const error = new Error('Syntax error in SQL');
      sql.mockRejectedValueOnce(error);
      
      const result = await runMigrations();
      
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
