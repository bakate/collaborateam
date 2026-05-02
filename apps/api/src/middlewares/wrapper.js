import { logger } from '@workspace/infrastructure/logger/logger';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Configurable in prod via env vars
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Security headers (Helmet-like functionality)
const HELMET_HEADERS = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  'X-Download-Options': 'noopen',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
};

import { AppError, ErrorCode } from '../core/errors.js';

/**
 * Global middleware wrapper for bun.serve requests.
 * Handles CORS, Helmet headers, Logging, and Global Error Catching.
 */
export const applyMiddlewares = (handler) => {
  return async (req, server) => {
    const url = new URL(req.url);
    const start = Date.now();
    
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // 2. Execute Handler (Pass server for WS upgrade)
      const response = await handler(req, server);
      
      // 3. Inject global headers (CORS + Helmet)
      const newHeaders = new Headers(response.headers);
      Object.entries({ ...CORS_HEADERS, ...HELMET_HEADERS }).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      // Logging
      logger.info({
        method: req.method,
        url: url.pathname,
        status: response.status,
        durationMs: Date.now() - start
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
      
    } catch (error) {
      // 4. Global Error Handler
      const isAppError = error instanceof AppError;
      const status = isAppError ? error.status : 500;
      
      logger.error({ 
        err: error.message, 
        stack: error.stack,
        code: isAppError ? error.code : ErrorCode.INTERNAL_ERROR,
        method: req.method, 
        url: url.pathname 
      }, isAppError ? `API Error: ${error.message}` : 'Unhandled Server Error');

      const errorPayload = isAppError 
        ? error.toJSON() 
        : { 
            error: 'Internal Server Error',
            message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            code: ErrorCode.INTERNAL_ERROR
          };

      return new Response(
        JSON.stringify(errorPayload),
        { 
          status,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
            ...HELMET_HEADERS
          }
        }
      );
    }
  };
};
