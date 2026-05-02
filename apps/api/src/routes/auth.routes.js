import { createAuthService } from '@workspace/application/auth/AuthService';
import { BcryptPasswordHasher } from '@workspace/infrastructure/auth/BcryptPasswordHasher';
import { JwtTokenService } from '@workspace/infrastructure/auth/JwtTokenService';
import { createInMemoryRateLimiter } from '@workspace/infrastructure/auth/InMemoryRateLimiter';
import { PostgresUserRepository } from '@workspace/infrastructure/repositories/PostgresUserRepository';
import { z } from 'zod';
import { json } from './response.js';

const authService = createAuthService({
  userRepository: PostgresUserRepository,
  passwordHasher: BcryptPasswordHasher,
  tokenService: JwtTokenService,
  rateLimiter: createInMemoryRateLimiter()
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const handleAuthRoutes = async (req, url) => {
  // POST /api/auth/register
  if (url.pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
    }

    const result = await authService.register(parsed.data);
    if (!result.ok) {
      return json({ error: result.error.message }, 409);
    }

    return json({ user: result.value.user, accessToken: result.value.accessToken, refreshToken: result.value.refreshToken }, 201);
  }

  // POST /api/auth/login
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const result = await authService.login({ ...parsed.data, ipAddress });
    if (!result.ok) {
      const status = result.error.message.includes('Too many') ? 429 : 401;
      return json({ error: result.error.message }, status);
    }

    return json({ user: result.value.user, accessToken: result.value.accessToken, refreshToken: result.value.refreshToken });
  }

  // POST /api/auth/refresh
  if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
    const body = await req.json().catch(() => null);
    const token = body?.refreshToken;
    if (!token) return json({ error: 'refreshToken is required' }, 400);

    const result = await authService.refreshToken({ token });
    if (!result.ok) return json({ error: result.error.message }, 401);

    return json({ accessToken: result.value.accessToken });
  }

  // POST /api/auth/logout — stateless: client discards token
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    return json({ message: 'Logged out successfully' });
  }

  return null;
};
