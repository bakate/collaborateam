import { createTaskService } from "@workspace/application/tasks/TaskService";
import { PostgresTaskRepository } from "@workspace/infrastructure/repositories/PostgresTaskRepository";
import { PostgresProjectRepository } from "@workspace/infrastructure/repositories/PostgresProjectRepository";
import { validatePayload } from "@workspace/infrastructure/schemas/ProjectSchemas";
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
} from "@workspace/infrastructure/schemas/TaskSchemas";
import { requireAuth } from "../middlewares/auth.js";
import { wsService } from "../server.js";
import { json } from "./response.js";
import { isValidUuid } from "../core/validation.js";
import { cache } from "../core/cache.js";

const taskService = createTaskService({
  taskRepository: PostgresTaskRepository,
  projectRepository: PostgresProjectRepository,
});

// Route pattern matchers
const projectTasksPath = /^\/api\/projects\/([^/]+)\/tasks$/;
const reorderPath = /^\/api\/projects\/([^/]+)\/tasks\/reorder$/;
const taskPath = /^\/api\/tasks\/([^/]+)$/;

export const handleTaskRoutes = async (req, url) => {
  // GET /api/projects/:projectId/tasks
  const listMatch = url.pathname.match(projectTasksPath);
  if (listMatch && req.method === "GET") {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const projectId = listMatch[1];
    if (!isValidUuid(projectId)) return json({ error: 'Invalid project ID format' }, 400);

    const limit = Number(url.searchParams.get("limit")) || 10;
    const offset = Number(url.searchParams.get("offset")) || 0;

    const cacheKey = `tasks:${projectId}:${limit}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached) return json({ tasks: cached, source: 'cache' });

    const result = await taskService.findByProject({
      projectId,
      limit,
      offset,
    });
    if (!result.ok) {
      const status = result.error.message === "Project not found" ? 404 : 500;
      return json({ error: result.error.message }, status);
    }

    cache.set(cacheKey, result.value, 300000); // 5 minutes cache
    return json({ tasks: result.value });
  }

  // POST /api/projects/:projectId/tasks
  if (listMatch && req.method === "POST") {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const projectId = listMatch[1];
    if (!isValidUuid(projectId)) return json({ error: 'Invalid project ID format' }, 400);

    const body = await req.json().catch(() => null);
    const validation = validatePayload(createTaskSchema, {
      ...body,
      projectId,
    });
    if (!validation.ok) return json({ error: validation.error.message }, 400);

    const result = await taskService.create({
      ...validation.value,
      ownerId: req.user.userId,
    });
    if (!result.ok) {
      const status =
        result.error.message === "Unauthorized"
          ? 403
          : result.error.message === "Project not found"
            ? 404
            : 500;
      return json({ error: result.error.message }, status);
    }

    wsService.broadcastToProject({
      projectId,
      event: "task:created",
      data: result.value,
    });

    // Invalidate project task cache
    cache.clear(); // Simple invalidation for now, could be improved by prefix

    return json({ task: result.value }, 201);
  }

  // PUT /api/projects/:projectId/tasks/reorder
  const reorderMatch = url.pathname.match(reorderPath);
  if (reorderMatch && req.method === "PUT") {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const projectId = reorderMatch[1];
    if (!isValidUuid(projectId)) return json({ error: 'Invalid project ID format' }, 400);

    const body = await req.json().catch(() => null);
    const validation = validatePayload(reorderTasksSchema, {
      ...body,
      projectId,
    });
    if (!validation.ok) return json({ error: validation.error.message }, 400);

    const result = await taskService.reorder({
      ...validation.value,
      ownerId: req.user.userId,
    });
    if (!result.ok) {
      const status = result.error.message === "Unauthorized" ? 403 : 500;
      return json({ error: result.error.message }, status);
    }

    wsService.broadcastToProject({
      projectId,
      event: "task:reordered",
      data: validation.value.tasks,
    });

    // Invalidate project task cache
    cache.clear();

    return json({ message: "Tasks reordered successfully" });
  }

  // PUT /api/tasks/:id
  const taskMatch = url.pathname.match(taskPath);
  if (taskMatch && req.method === "PUT") {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const id = taskMatch[1];
    if (!isValidUuid(id)) return json({ error: 'Invalid task ID format' }, 400);

    const body = await req.json().catch(() => null);
    const validation = validatePayload(updateTaskSchema, body);
    if (!validation.ok) return json({ error: validation.error.message }, 400);

    const projectId = body?.projectId;
    if (!projectId)
      return json({ error: "projectId is required in body" }, 400);

    const result = await taskService.update({
      id,
      projectId,
      ownerId: req.user.userId,
      data: validation.value,
    });
    if (!result.ok) {
      const status =
        result.error.message === "Unauthorized"
          ? 403
          : result.error.message.includes("not found")
            ? 404
            : 500;
      return json({ error: result.error.message }, status);
    }

    wsService.broadcastToProject({
      projectId,
      event: "task:updated",
      data: result.value,
    });

    // Invalidate project task cache
    cache.clear();

    return json({ task: result.value });
  }

  // DELETE /api/tasks/:id
  if (taskMatch && req.method === "DELETE") {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const id = taskMatch[1];
    if (!isValidUuid(id)) return json({ error: 'Invalid task ID format' }, 400);

    const body = await req.json().catch(() => null);
    const projectId = body?.projectId;
    if (!projectId)
      return json({ error: "projectId is required in body" }, 400);

    const result = await taskService.delete({
      id,
      projectId,
      ownerId: req.user.userId,
    });
    if (!result.ok) {
      const status =
        result.error.message === "Unauthorized"
          ? 403
          : result.error.message.includes("not found")
            ? 404
            : 500;
      return json({ error: result.error.message }, status);
    }

    wsService.broadcastToProject({
      projectId,
      event: "task:deleted",
      data: { id },
    });

    // Invalidate project task cache
    cache.clear();

    return json({ message: "Task deleted successfully" });
  }

  return null;
};
