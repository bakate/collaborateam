import postgres from "postgres";
import { logger } from "../logger/logger.js";
import { env } from "../config/env.js";

const getConnectionString = () => {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const user = env.PGUSER;
  const password = env.PGPASSWORD;
  const host = env.PGHOST;
  const port = env.PGPORT;
  const db = env.PGDATABASE;

  if (!host || host === "localhost") {
    logger.warn("Warning: Connecting to localhost or PGHOST missing.");
  }

  return `postgres://${user}:${password}@${host}:${port}/${db}`;
};

const connectionString = getConnectionString();

// Singleton database instance
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: env.PGSSLMODE === "require" ? "require" : false,
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
