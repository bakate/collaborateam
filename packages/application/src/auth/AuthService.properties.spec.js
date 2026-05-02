import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createAuthService } from './AuthService.js';

describe('AuthService Properties', () => {
  it('Property 7 & 8: Valid/Invalid Credentials Behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        fc.boolean(), // Is the user found in DB?
        fc.boolean(), // Is the password matching?
        async (email, password, isUserFound, isPasswordMatching) => {
          // Setup Mocks
          const userRepository = { findByEmail: vi.fn() };
          const passwordHasher = { verify: vi.fn() };
          const tokenService = { signAccess: vi.fn(), signRefresh: vi.fn() };
          const rateLimiter = { checkLimit: vi.fn().mockResolvedValue(true) };
          
          const authService = createAuthService({ userRepository, passwordHasher, tokenService, rateLimiter });
          
          if (isUserFound) {
            userRepository.findByEmail.mockResolvedValue({ id: '123', email, passwordHash: 'hash' });
            passwordHasher.verify.mockResolvedValue(isPasswordMatching);
          } else {
            userRepository.findByEmail.mockResolvedValue(null);
          }
          
          tokenService.signAccess.mockResolvedValue('jwt_access');
          tokenService.signRefresh.mockResolvedValue('jwt_refresh');

          const result = await authService.login({ email, password, ipAddress: '127.0.0.1' });

          if (isUserFound && isPasswordMatching) {
            // Property 7: Valid Credentials Return JWT Token
            expect(result.ok).toBe(true);
            expect(result.value.accessToken).toBeDefined();
            expect(result.value.refreshToken).toBeDefined();
          } else {
            // Property 8: Invalid Credentials Return Error
            expect(result.ok).toBe(false);
            expect(result.error.message).toBe('Invalid credentials');
          }
        }
      )
    );
  });

  it('Property 10: Successful Registration Creates User and Returns Token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        fc.boolean(), // Does user already exist?
        async (email, password, userExists) => {
          // Setup Mocks
          const userRepository = { 
            findByEmail: vi.fn().mockResolvedValue(userExists ? { id: '1' } : null),
            create: vi.fn().mockResolvedValue({ id: 'new_id', email })
          };
          const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed') };
          const tokenService = { signAccess: vi.fn().mockResolvedValue('jwt_access'), signRefresh: vi.fn().mockResolvedValue('jwt_refresh') };
          
          const authService = createAuthService({ 
            userRepository, passwordHasher, tokenService, rateLimiter: {} 
          });

          const result = await authService.register({ email, password });

          if (userExists) {
            expect(result.ok).toBe(false);
            expect(result.error.message).toBe('User already exists');
          } else {
            expect(result.ok).toBe(true);
            expect(result.value.accessToken).toBe('jwt_access');
            expect(userRepository.create).toHaveBeenCalledWith({ email, passwordHash: 'hashed' });
          }
        }
      )
    );
  });
});
