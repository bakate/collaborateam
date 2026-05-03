import postgres from "postgres";
import { logger } from "../logger/logger.js";

const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.PGUSER ?? "postgres";
  const password = process.env.PGPASSWORD ?? "postgres_password";
  const host = process.env.PGHOST ?? "localhost";
  const port = process.env.PGPORT ?? "5432";
  const db = process.env.PGDATABASE ?? "collaborateam";

  return `postgres://${user}:${password}@${host}:${port}/${db}`;
};

const connectionString = getConnectionString();

// Singleton database instance
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Suppress postgres notices
  transform: postgres.camel, // Automatically transform snake_case columns to camelCase object keys
});

export const checkConnection = async () => {
  try {
    const result = await sql`SELECT 1 as connected`;
    logger.info("Database connection successful");
    return result[0].connected === 1;
  } catch (error) {
    logger.error({ err: error.message }, "Database connection failed");
    return false;
  }
};

/**
 * Execute a function within a database transaction.
 * @param {Function} callback - Function receiving the transaction instance
 */
export const withTransaction = async (callback) => {
  return sql.begin(async (tx) => {
    return callback(tx);
  });
};
