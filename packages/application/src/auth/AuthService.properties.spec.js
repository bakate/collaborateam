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
          const userRepository = { 
            findByEmail: vi.fn(),
            findByUsername: vi.fn()
          };
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
        fc.string({ minLength: 3 }), // username
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        fc.boolean(), // Does email exist?
        fc.boolean(), // Does username exist?
        async (username, email, password, emailExists, usernameExists) => {
          // Setup Mocks
          const userRepository = { 
            findByEmail: vi.fn().mockResolvedValue(emailExists ? { id: '1' } : null),
            findByUsername: vi.fn().mockResolvedValue(usernameExists ? { id: '2' } : null),
            create: vi.fn().mockResolvedValue({ id: 'new_id', email, username })
          };
          const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed') };
          const tokenService = { 
            signAccess: vi.fn().mockResolvedValue('jwt_access'), 
            signRefresh: vi.fn().mockResolvedValue('jwt_refresh') 
          };
          
          const authService = createAuthService({ 
            userRepository, passwordHasher, tokenService, rateLimiter: {} 
          });

          const result = await authService.register({ username, email, password });

          if (emailExists) {
            expect(result.ok).toBe(false);
            expect(result.error.message).toBe('Email already exists');
          } else if (usernameExists) {
            expect(result.ok).toBe(false);
            expect(result.error.message).toBe('Username already taken');
          } else {
            expect(result.ok).toBe(true);
            expect(result.value.accessToken).toBe('jwt_access');
            expect(userRepository.create).toHaveBeenCalledWith({ 
              username, 
              email, 
              passwordHash: 'hashed' 
            });
          }
        }
      )
    );
  });
});
