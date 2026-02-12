import { z } from 'zod';

/**
 * Project creation schema
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  path: z.string().min(1),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Project update schema
 */
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Inferred types
 */
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * Project interface
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}
