import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import fc from 'fast-check';
import { applyMiddlewares } from './middlewares/wrapper.js';
import { AppError, ErrorCode, Errors } from './core/errors.js';

describe('Error Handling Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 40: Any AppError thrown in handler should return structured JSON with correct status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // message
        fc.integer({ min: 400, max: 499 }), // status
        fc.constantFrom(...Object.values(ErrorCode)), // code
        async (message, status, code) => {
          const mockHandler = async () => {
            throw new AppError(message, status, code);
          };

          const wrappedHandler = applyMiddlewares(mockHandler);
          const req = new Request(faker.internet.url(), { method: 'GET' });
          
          const res = await wrappedHandler(req);
          const json = await res.json();

          expect(res.status).toBe(status);
          expect(json.error).toBe(message);
          expect(json.code).toBe(code);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 43: Any unhandled exception should return 500 with INTERNAL_ERROR code', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (errorMsg) => {
        const mockHandler = async () => {
          throw new Error(errorMsg);
        };

        const wrappedHandler = applyMiddlewares(mockHandler);
        const req = new Request(faker.internet.url(), { method: 'GET' });
        
        const res = await wrappedHandler(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(json.error).toBe('Internal Server Error');
      }),
      { numRuns: 20 }
    );
  });

  it('Property 41: Validation errors should include details in the response', async () => {
    const details = { field: faker.database.column(), message: faker.lorem.sentence() };
    const mockHandler = async () => {
      throw Errors.validation(details);
    };

    const wrappedHandler = applyMiddlewares(mockHandler);
    const req = new Request(faker.internet.url(), { method: 'POST' });
    
    const res = await wrappedHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(json.details).toEqual(details);
  });
});
