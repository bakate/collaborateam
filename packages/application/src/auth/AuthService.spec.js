import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createAuthService } from './AuthService.js';

describe('AuthService Unit Tests', () => {
  let userRepository;
  let passwordHasher;
  let tokenService;
  let rateLimiter;
  let authService;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };
    tokenService = {
      signAccess: vi.fn(),
      signRefresh: vi.fn(),
      verifyAccess: vi.fn(),
      verifyRefresh: vi.fn(),
    };
    rateLimiter = {
      checkLimit: vi.fn().mockResolvedValue(true),
    };

    authService = createAuthService({
      userRepository,
      passwordHasher,
      tokenService,
      rateLimiter
    });
  });

  describe('login()', () => {
    it('should return JWT tokens on valid login', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();
      const mockUser = { id: faker.string.uuid(), email, passwordHash: 'hashed_pw' };
      
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);
      tokenService.signAccess.mockResolvedValue('access_token_abc');
      tokenService.signRefresh.mockResolvedValue('refresh_token_xyz');

      const result = await authService.login({ email, password, ipAddress: '127.0.0.1' });

      expect(result.ok).toBe(true);
      expect(result.value.accessToken).toBe('access_token_abc');
      expect(result.value.refreshToken).toBe('refresh_token_xyz');
      expect(result.value.user).toEqual(mockUser);
    });

    it('should reject invalid credentials (user not found)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.login({ 
        email: faker.internet.email(), 
        password: 'wrong', 
        ipAddress: '127.0.0.1' 
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Invalid credentials');
    });

    it('should reject invalid credentials (wrong password)', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: '1', passwordHash: 'hash' });
      passwordHasher.verify.mockResolvedValue(false);

      const result = await authService.login({ 
        email: faker.internet.email(), 
        password: 'wrong', 
        ipAddress: '127.0.0.1' 
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Invalid credentials');
    });

    it('should reject when rate limit is exceeded', async () => {
      rateLimiter.checkLimit.mockResolvedValue(false);

      const result = await authService.login({ 
        email: faker.internet.email(), 
        password: 'pw', 
        ipAddress: '192.168.1.1' 
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('Too many login attempts');
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('register()', () => {
    it('should create a new user and return tokens', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('new_hash');
      
      const mockUser = { id: faker.string.uuid(), email: 'test@test.com', username: 'testuser' };
      userRepository.create.mockResolvedValue(mockUser);
      
      tokenService.signAccess.mockResolvedValue('acc_token');
      tokenService.signRefresh.mockResolvedValue('ref_token');

      const result = await authService.register({ 
        username: 'testuser',
        email: 'test@test.com', 
        password: 'password123' 
      });

      expect(result.ok).toBe(true);
      expect(result.value.user).toEqual(mockUser);
      expect(result.value.accessToken).toBe('acc_token');
      expect(passwordHasher.hash).toHaveBeenCalledWith({ password: 'password123' });
    });

    it('should reject registration if user already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: '1' });
      userRepository.findByUsername.mockResolvedValue(null);

      const result = await authService.register({ 
        username: 'testuser',
        email: 'existing@test.com', 
        password: 'pw' 
      });

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('Email already exists');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });
});
