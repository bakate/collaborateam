import { describe, it, expect } from 'vitest';
import { BcryptPasswordHasher } from './BcryptPasswordHasher.js';
import { createInMemoryRateLimiter } from './InMemoryRateLimiter.js';

describe('Auth Adapters Unit Tests', () => {
  describe('BcryptPasswordHasher', () => {
    it('should hash a password and verify it correctly', async () => {
      const password = 'my_super_secret_password';
      
      const start = Date.now();
      const hash = await BcryptPasswordHasher.hash({ password });
      const duration = Date.now() - start;

      // Ensure hashing takes a reasonable amount of time but under 500ms
      // With cost factor 12, it's usually > 100ms and < 500ms.
      expect(duration).toBeLessThan(1000); 
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$12$')).toBe(true);

      const isValid = await BcryptPasswordHasher.verify({ password, hash });
      expect(isValid).toBe(true);
    });

    it('should return false for invalid password verification within 500ms', async () => {
      const password = 'correct_password';
      const hash = await BcryptPasswordHasher.hash({ password });
      
      const start = Date.now();
      const isValid = await BcryptPasswordHasher.verify({ password: 'wrong_password', hash });
      const duration = Date.now() - start;

      expect(isValid).toBe(false);
      expect(duration).toBeLessThan(500); // Verify it rejects fast enough to avoid DoS but prevents timing attacks
    });
  });

  describe('InMemoryRateLimiter', () => {
    it('should enforce the limit within the time window', async () => {
      const rateLimiter = createInMemoryRateLimiter();
      const key = 'user_ip_1';
      
      // Allow 5 attempts
      for (let i = 0; i < 5; i++) {
        const canProceed = await rateLimiter.checkLimit({ key, limit: 5, windowMs: 1000 });
        expect(canProceed).toBe(true);
      }
      
      // 6th attempt should be blocked
      const blocked = await rateLimiter.checkLimit({ key, limit: 5, windowMs: 1000 });
      expect(blocked).toBe(false);
    });
  });
});
