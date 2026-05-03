import { sql } from '../db/db.js';

/**
 * PostgreSQL implementation of the User Repository.
 * Secondary Adapter (Driven) — lives in infrastructure layer.
 */
export const PostgresUserRepository = Object.freeze({
  async findByEmail({ email }) {
    const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
    return rows[0] || null;
  },

  async findByUsername({ username }) {
    const rows = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
    return rows[0] || null;
  },

  async findById({ id }) {
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  async create({ username, email, passwordHash }) {
    const rows = await sql`
      INSERT INTO users (username, email, password_hash) VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id, username, email, created_at
    `;
    return rows[0];
  }
});
