import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { applyMiddlewares } from './middlewares/wrapper.js';
import { responseCache } from './middlewares/cache.js';

describe('Performance Property-Based Tests', () => {
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

    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (url) => {
        const start = performance.now();
        const req = new Request(url, { method: 'GET' });
        
        const res = await wrappedHandler(req);
        const end = performance.now();
        const duration = end - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(300); // Property 36: < 300ms
      }),
      { numRuns: 20 }
    );
  });

  it('Property 38: Cached Data Responds Within 50ms', async () => {
    const mockHandler = async () => {
      // Significant delay for the first call
      await new Promise(resolve => setTimeout(resolve, 150));
      return new Response(JSON.stringify({ data: 'cached' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const cacheMiddleware = responseCache(60000); // 1 min TTL
    const wrappedHandler = applyMiddlewares(cacheMiddleware(mockHandler));

    const testUrl = 'http://localhost/api/projects/123';
    
    // First call: Warm up the cache
    await wrappedHandler(new Request(testUrl, { method: 'GET' }));

    // Subsequent calls should be blazing fast
    await fc.assert(
      fc.asyncProperty(fc.constant(testUrl), async (url) => {
        const start = performance.now();
        const req = new Request(url, { method: 'GET' });
        
        const res = await wrappedHandler(req);
        const end = performance.now();
        const duration = end - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(50); // Property 38: < 50ms
      }),
      { numRuns: 50 }
    );
  });
});
