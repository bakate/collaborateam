import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyMiddlewares } from './middlewares/wrapper.js';
import { responseCache } from './middlewares/cache.js';

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 36: Route Navigation Completes Within 300ms', async () => {
    // Mock handler with a small artificial delay (100ms) to simulate DB
    const mockHandler = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return new Response(JSON.stringify({ data: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const wrappedHandler = applyMiddlewares(responseCache(5000)(mockHandler));

    // Test with multiple URLs
    const urls = [
      'http://localhost/api/projects',
      'http://localhost/api/projects/1',
      'http://localhost/api/tasks/100',
      'http://localhost/api/users/profile'
    ];

    for (const url of urls) {
      const start = performance.now();
      const req = new Request(url, { method: 'GET' });
      
      const res = await wrappedHandler(req);
      const end = performance.now();
      const duration = end - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(300); // Navigation < 300ms
    }
  });

  it('Property 38: Cached Data Responds Within 50ms', async () => {
    const mockHandler = async () => {
      // Significant delay for the first call (150ms)
      await new Promise(resolve => setTimeout(resolve, 150));
      return new Response(JSON.stringify({ data: 'cached' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const cacheMiddleware = responseCache(60000); // 1 min TTL
    const wrappedHandler = applyMiddlewares(cacheMiddleware(mockHandler));

    const testUrl = 'http://localhost/api/projects/cache-test';
    
    // First call: Warm up the cache
    await wrappedHandler(new Request(testUrl, { method: 'GET' }));

    // Subsequent calls (10 iterations) should be blazing fast
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const req = new Request(testUrl, { method: 'GET' });
      
      const res = await wrappedHandler(req);
      const end = performance.now();
      const duration = end - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(50); // Cached response < 50ms
    }
  });
});
