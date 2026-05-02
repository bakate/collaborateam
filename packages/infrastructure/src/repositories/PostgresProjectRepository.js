import { sql } from '../db/db.js';

/**
 * PostgreSQL implementation of the Project Repository.
 * Secondary Adapter (Driven) — lives in infrastructure layer.
 */
export const PostgresProjectRepository = Object.freeze({
  async findAll() {
    return sql`SELECT * FROM projects ORDER BY created_at DESC`;
  },

  async findByOwnerId({ ownerId }) {
    return sql`SELECT * FROM projects WHERE owner_id = ${ownerId} ORDER BY created_at DESC`;
  },

  async findById({ id }) {
    const rows = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  async create({ name, description, ownerId }) {
    const rows = await sql`
      INSERT INTO projects (name, description, owner_id) VALUES (${name}, ${description}, ${ownerId})
      RETURNING *
    `;
    return rows[0];
  },

  async update({ id, data }) {
    const rows = await sql`
      UPDATE projects
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async delete({ id }) {
    await sql`DELETE FROM projects WHERE id = ${id}`;
  }
});
