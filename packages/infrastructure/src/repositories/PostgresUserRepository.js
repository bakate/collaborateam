import { sql } from '../db/db.js';

/**
 * PostgreSQL implementation of the User Repository.
 * Secondary Adapter (Driven) — lives in infrastructure layer.
 */
export const PostgresUserRepository = Object.freeze({
  async findByEmail({ email }) {
    const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    return rows[0] || null;
  },

  async findById({ id }) {
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  async create({ email, passwordHash }) {
    const rows = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email}, ${passwordHash})
      RETURNING id, email, created_at
    `;
    return rows[0];
  }
});
