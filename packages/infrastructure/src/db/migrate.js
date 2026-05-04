import { sql } from './db.js';
import { logger } from '../logger/logger.js';

export const runMigrations = async () => {
  logger.info('Starting database migrations...');
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ensure username exists if table was already created
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
          ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
          -- We'll need to populate it if it's empty, but since it's a seed/dev project, we might just assume it's okay for now.
        END IF;
      END $$;
    `;

    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 🚀 Performance Optimization: Add Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`;

    logger.info('Migrations completed successfully');
    return { ok: true };
  } catch (error) {
    logger.error({ err: error.message }, 'Migration failed');
    return { ok: false, error };
  }
};

// Auto-execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runMigrations();
  process.exit(result.ok ? 0 : 1);
}
