import { createProjectService } from '@workspace/application/projects/ProjectService';
import { PostgresProjectRepository } from '@workspace/infrastructure/repositories/PostgresProjectRepository';
import { validatePayload, createProjectSchema, updateProjectSchema } from '@workspace/infrastructure/schemas/ProjectSchemas';
import { requireAuth } from '../middlewares/auth.js';
import { json } from './response.js';

const projectService = createProjectService({ projectRepository: PostgresProjectRepository });

const parseId = (url) => url.pathname.split('/')[3]; // /api/projects/:id

export const handleProjectRoutes = async (req, url) => {
  // GET /api/projects
  if (url.pathname === '/api/projects' && req.method === 'GET') {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const ownerId = url.searchParams.get('mine') === 'true' ? req.user.userId : undefined;
    const result = await projectService.findAll(ownerId ? { ownerId } : undefined);
    if (!result.ok) return json({ error: result.error.message }, 500);

    return json({ projects: result.value });
  }

  // POST /api/projects
  if (url.pathname === '/api/projects' && req.method === 'POST') {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json().catch(() => null);
    const validation = validatePayload(createProjectSchema, body);
    if (!validation.ok) return json({ error: validation.error.message }, 400);

    const result = await projectService.create({ ...validation.value, ownerId: req.user.userId });
    if (!result.ok) return json({ error: result.error.message }, 500);

    return json({ project: result.value }, 201);
  }

  // GET /api/projects/:id
  if (/^\/api\/projects\/[^/]+$/.test(url.pathname) && req.method === 'GET') {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const id = parseId(url);
    const result = await projectService.findById({ id });
    if (!result.ok) {
      const status = result.error.message === 'Project not found' ? 404 : 500;
      return json({ error: result.error.message }, status);
    }

    return json({ project: result.value });
  }

  // PUT /api/projects/:id
  if (/^\/api\/projects\/[^/]+$/.test(url.pathname) && req.method === 'PUT') {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const id = parseId(url);
    const body = await req.json().catch(() => null);
    const validation = validatePayload(updateProjectSchema, body);
    if (!validation.ok) return json({ error: validation.error.message }, 400);

    const result = await projectService.update({ id, ownerId: req.user.userId, data: validation.value });
    if (!result.ok) {
      const status = result.error.message === 'Unauthorized' ? 403
        : result.error.message === 'Project not found' ? 404 : 500;
      return json({ error: result.error.message }, status);
    }

    return json({ project: result.value });
  }

  // DELETE /api/projects/:id
  if (/^\/api\/projects\/[^/]+$/.test(url.pathname) && req.method === 'DELETE') {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const id = parseId(url);
    const result = await projectService.delete({ id, ownerId: req.user.userId });
    if (!result.ok) {
      const status = result.error.message === 'Unauthorized' ? 403
        : result.error.message === 'Project not found' ? 404 : 500;
      return json({ error: result.error.message }, status);
    }

    return json({ message: 'Project deleted successfully' });
  }

  return null;
};
