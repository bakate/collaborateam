import { JwtTokenService } from '@workspace/infrastructure/auth/JwtTokenService';

/**
 * JWT Authentication Middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches decoded payload to req.user.
 */
export const requireAuth = async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.slice(7);
  const result = await JwtTokenService.verifyAccess({ token });
  if (!result.ok) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Attach user payload — used downstream in route handlers
  req.user = result.value;
  return null; // null signals "proceed"
};
