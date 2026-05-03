import { sql } from "../db/db.js";

/**
 * PostgreSQL implementation of the Task Repository.
 * Secondary Adapter (Driven) — lives in infrastructure layer.
 */
export const PostgresTaskRepository = Object.freeze({
  async create({ title, description, status, projectId }, tx) {
    const conn = tx || sql;
    const rows = await conn`
      INSERT INTO tasks (title, description, status, project_id)
      VALUES (${title}, ${description || ""}, ${status || "todo"}, ${projectId})
      RETURNING *
    `;
    return rows[0];
  },

  async findByProjectId({ projectId, limit = 10, offset = 0 }) {
    return sql`
      SELECT * FROM tasks 
      WHERE project_id = ${projectId} 
      ORDER BY created_at ASC 
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  async findById({ id }) {
    const rows = await sql`SELECT * FROM tasks WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  async update({ id, data }, tx) {
    const conn = tx || sql;
    const rows = await conn`
      UPDATE tasks
      SET
        title = COALESCE(${data.title ?? null}, title),
        description = COALESCE(${data.description ?? null}, description),
        status = COALESCE(${data.status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async delete({ id }, tx) {
    const conn = tx || sql;
    await conn`DELETE FROM tasks WHERE id = ${id}`;
  },

  async updateOrder({ tasks }) {
    // Each task's position is tracked via updated_at for now.
    // A dedicated `position` column can be added in a future migration.
    for (const { id } of tasks) {
      await sql`UPDATE tasks SET updated_at = NOW() WHERE id = ${id}`;
    }
  },
});
