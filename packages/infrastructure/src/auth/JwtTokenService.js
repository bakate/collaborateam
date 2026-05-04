import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export const JwtTokenService = Object.freeze({
  async signAccess({ userId }) {
    return jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  },

  async signRefresh({ userId }) {
    return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  },

  async verifyAccess({ token }) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'access') {
        return { ok: false, error: new Error('Invalid token type') };
      }
      return { ok: true, value: decoded };
    } catch {
      return { ok: false, error: new Error('Invalid or expired token') };
    }
  },

  async verifyRefresh({ token }) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'refresh') {
        return { ok: false, error: new Error('Invalid token type') };
      }
      return { ok: true, value: decoded };
    } catch {
      return { ok: false, error: new Error('Invalid or expired refresh token') };
    }
  }
});
