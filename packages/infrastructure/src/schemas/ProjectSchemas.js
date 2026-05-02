import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional().default(''),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).optional(),
  description: z.string().optional(),
});

/**
 * Validates a payload against a Zod schema.
 * Returns an Either-like object: { ok: true, value: data } or { ok: false, error: Error }
 */
export const validatePayload = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  
  // Format Zod errors nicely
  const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { ok: false, error: new Error(`Validation failed: ${errorMessage}`) };
};
