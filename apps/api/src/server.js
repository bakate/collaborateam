import { logger } from './config/logger.js';
import { checkConnection } from './db/db.js';
import { runMigrations } from './db/migrate.js';
import { applyMiddlewares } from './middlewares/wrapper.js';

const PORT = process.env.PORT || 3000;

// Router placeholder
const router = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Endpoint to test the global error handler
  if (url.pathname === '/error') {
    throw new Error('Simulated crash for testing global error handler');
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
};

const startServer = async () => {
  logger.info('Starting Collaborateam API server...');

  const dbOk = await checkConnection();
  if (dbOk) {
    const migrationResult = await runMigrations();
    if (!migrationResult.ok) {
      logger.error('Failed to run migrations. Exiting...');
      process.exit(1);
    }
  } else {
    logger.warn('Could not connect to database. Continuing without DB for now...');
  }

  // Define global Bun so ESLint/TS knows it exists
  const server = globalThis.Bun.serve({
    port: PORT,
    fetch: applyMiddlewares(router),
  });

  logger.info(`Server running at http://localhost:${server.port}`);
};

// Auto-start if not imported as a module (e.g., ran directly via `bun run src/server.js`)
if (import.meta.main) {
  startServer();
}

export { router, startServer };
