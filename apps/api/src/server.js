import { env } from "@workspace/infrastructure/config/env";
import { logger } from "@workspace/infrastructure/logger/logger";
import { checkConnection } from "@workspace/infrastructure/db/db";
import { runMigrations } from "@workspace/infrastructure/db/migrate";
import { createBunWebSocketService } from "@workspace/infrastructure/websocket/BunWebSocketService";
import { applyMiddlewares } from "./middlewares/wrapper";
import { responseCache } from "./middlewares/cache";
import { handleAuthRoutes } from "./routes/auth.routes";
import { handleProjectRoutes } from "./routes/projects.routes";
import { handleTaskRoutes } from "./routes/tasks.routes";

const PORT = env.PORT;

// Singleton WebSocket service — shared across the app
export const wsService = createBunWebSocketService();

// Router placeholder
const router = async (req, server) => {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    const isDbConnected = await checkConnection();
    const status = isDbConnected ? "ok" : "degraded";

    return new Response(
      JSON.stringify({
        status,
        services: {
          api: "ok",
          database: isDbConnected ? "ok" : "error",
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: isDbConnected ? 200 : 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // WebSocket upgrade
  if (url.pathname === "/ws") {
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId query param required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const upgraded = server.upgrade(req, { data: { userId } });
    if (!upgraded) {
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    return undefined;
  }

  // API Routes — first match wins
  const authResponse = await handleAuthRoutes(req, url);
  if (authResponse) return authResponse;

  const projectResponse = await handleProjectRoutes(req, url);
  if (projectResponse) return projectResponse;

  const taskResponse = await handleTaskRoutes(req, url);
  if (taskResponse) return taskResponse;

  if (url.pathname === "/error") {
    throw new Error("Simulated crash for testing global error handler");
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
};

// Bun WebSocket handlers
const websocket = {
  open(socket) {
    const { userId } = socket.data;
    wsService.registerClient({ userId, socket });
    logger.info({ userId }, "WebSocket client connected");
  },

  close(socket) {
    const { userId } = socket.data;
    wsService.unregisterClient({ userId });
    logger.info({ userId }, "WebSocket client disconnected");
  },

  message(socket, rawMessage) {
    try {
      const { userId } = socket.data;
      const { action, projectId } = JSON.parse(rawMessage);

      if (action === "join" && projectId) {
        wsService.joinProject({ userId, projectId });
        logger.info({ userId, projectId }, "User joined project room");
      } else if (action === "leave" && projectId) {
        wsService.leaveProject({ userId, projectId });
        logger.info({ userId, projectId }, "User left project room");
      }
    } catch {
      logger.warn("Received malformed WebSocket message");
    }
  },
};

const startServer = async () => {
  logger.info("Starting Collaborateam API server...");

  const dbOk = await checkConnection();
  if (dbOk) {
    const migrationResult = await runMigrations();
    if (!migrationResult.ok) {
      logger.error("Failed to run migrations. Exiting...");
      process.exit(1);
    }
  } else {
    logger.warn(
      "Could not connect to database. Continuing without DB for now...",
    );
  }

  // Wrap router with cache middleware
  const cachedRouter = responseCache(300000)(router);

  const server = globalThis.Bun.serve({
    port: PORT,
    fetch: applyMiddlewares(cachedRouter),
    websocket,
  });

  // Wire the server instance into wsService for publish()
  wsService.init({ server });

  logger.info(`Server running at http://localhost:${server.port}`);
  logger.info(`WebSocket ready at ws://localhost:${server.port}/ws`);
};

// Auto-start if not imported as a module
if (import.meta.main) {
  startServer();
}

export { router, startServer };
