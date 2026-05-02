import { logger } from '@workspace/infrastructure/logger/logger';

const cache = new Map();

/**
 * Simple in-memory response cache middleware.
 * Usage: router.use(responseCache(ttl)(handler))
 * 
 * @param {number} ttl - Time to live in milliseconds (default 5 minutes)
 */
export const responseCache = (ttl = 300000) => (next) => async (req, server) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    // Invalidate cache for the related resource on mutation
    const url = new URL(req.url);
    const basePath = url.pathname.split('/')[2]; // e.g., 'projects' or 'tasks'
    
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      invalidateCache(basePath);
    }
    
    return next(req, server);
  }

  const cacheKey = req.url;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() < cached.expires) {
    logger.info({ url: req.url }, '[Cache] Hit');
    return cached.response.clone();
  }

  logger.info({ url: req.url }, '[Cache] Miss');
  const response = await next(req, server);

  // Cache successful JSON responses
  if (response.ok && response.headers.get('Content-Type')?.includes('application/json')) {
    cache.set(cacheKey, {
      response: response.clone(),
      expires: Date.now() + ttl
    });
  }

  return response;
};

export const invalidateCache = (pattern) => {
  if (!pattern) return;
  logger.info({ pattern }, '[Cache] Invalidating');
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};
