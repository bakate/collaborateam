import { sql } from './db.js';
import { logger } from '../logger/logger.js';
import { runMigrations } from './migrate.js';

export const resetDatabase = async () => {
  logger.info('💣 Starting database reset...');

  try {
    // 1. Drop all tables
    logger.info('🧨 Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS tasks CASCADE`;
    await sql`DROP TABLE IF EXISTS projects CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    
    logger.info('✅ Tables dropped successfully');

    // 2. Re-run migrations to create schema
    logger.info('🏗️ Re-running migrations...');
    const migrationResult = await runMigrations();
    
    if (!migrationResult.ok) {
      throw new Error(migrationResult.error?.message || 'Migration failed during reset');
    }

    logger.info('✨ Database reset and schema recreated successfully!');
    return { ok: true };
  } catch (error) {
    logger.error({ err: error.message }, '❌ Database reset failed');
    return { ok: false, error };
  } finally {
    // End the connection gracefully after reset
    await sql.end();
  }
};

// If ran directly via CLI
if (import.meta.main || process.argv[1] === new URL(import.meta.url).pathname) {
  resetDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
