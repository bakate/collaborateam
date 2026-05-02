import { z } from 'zod';

// Status matches TaskStatus from domain entity
const validStatuses = ['todo', 'in_progress', 'done'];

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional().default(''),
  status: z.enum(validStatuses).optional().default('todo'),
  projectId: z.string().uuid('Valid Project ID is required'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(validStatuses).optional(),
});

export const reorderTasksSchema = z.object({
  projectId: z.string().uuid(),
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ).min(1, 'At least one task must be provided for reordering'),
});
