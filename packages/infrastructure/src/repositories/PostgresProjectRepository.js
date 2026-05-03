import { sql } from '../db/db.js';

/**
 * PostgreSQL implementation of the Project Repository.
 * Secondary Adapter (Driven) — lives in infrastructure layer.
 */
export const PostgresProjectRepository = Object.freeze({
  async findAll() {
    return sql`
      SELECT 
        p.*, 
        u.username as "ownerName",
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as "taskCount"
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `;
  },

  async findByOwnerId({ ownerId }) {
    return sql`
      SELECT 
        p.*, 
        split_part(u.email, '@', 1) as "ownerName",
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as "taskCount"
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ${ownerId} 
      ORDER BY p.created_at DESC
    `;
  },

  async findById({ id }) {
    const rows = await sql`
      SELECT 
        p.*, 
        split_part(u.email, '@', 1) as "ownerName",
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as "taskCount"
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ${id} 
      LIMIT 1
    `;
    return rows[0] || null;
  },

  async create({ name, description, ownerId }, tx) {
    const conn = tx || sql;
    const rows = await conn`
      INSERT INTO projects (name, description, owner_id) VALUES (${name}, ${description}, ${ownerId})
      RETURNING *
    `;
    return rows[0];
  },

  async update({ id, data }, tx) {
    const conn = tx || sql;
    const rows = await conn`
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

  async delete({ id }, tx) {
    const conn = tx || sql;
    await conn`DELETE FROM projects WHERE id = ${id}`;
  }
});
