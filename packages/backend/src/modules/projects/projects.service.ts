import { db } from '../../db/index.js';
import { projects } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { CreateProjectInput, UpdateProjectInput, Project } from '@gemini-ui/shared';
import { validateAndResolvePath } from '../../security/validators.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Projects service layer
 */
export class ProjectsService {
  /**
   * Create a new project
   */
  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    // Validate project path exists and is accessible
    try {
      await fs.access(input.path);
    } catch {
      throw new Error('Project path does not exist or is not accessible');
    }

    // Normalize path
    const normalizedPath = path.resolve(input.path);

    // Create project
    const [newProject] = await db
      .insert(projects)
      .values({
        userId,
        name: input.name,
        path: normalizedPath,
        description: input.description,
        tags: input.tags,
      })
      .returning();

    return newProject;
  }

  /**
   * Get all projects for a user
   */
  async findAll(userId: string): Promise<Project[]> {
    return db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.lastAccessedAt)],
    });
  }

  /**
   * Get a single project by ID
   */
  async findById(userId: string, projectId: string): Promise<Project | null> {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    });

    if (!project) {
      return null;
    }

    // Update last accessed timestamp
    await db
      .update(projects)
      .set({ lastAccessedAt: new Date() })
      .where(eq(projects.id, projectId));

    return project;
  }

  /**
   * Update a project
   */
  async update(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    // Verify ownership
    const existing = await this.findById(userId, projectId);
    if (!existing) {
      return null;
    }

    // Update project
    const [updated] = await db
      .update(projects)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return updated || null;
  }

  /**
   * Delete a project
   */
  async delete(userId: string, projectId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Get recent projects (last 10)
   */
  async getRecent(userId: string, limit = 10): Promise<Project[]> {
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.lastAccessedAt)],
      limit,
    });

    return allProjects;
  }

  /**
   * Search projects by name or tags
   */
  async search(userId: string, query: string): Promise<Project[]> {
    const allProjects = await this.findAll(userId);

    const lowerQuery = query.toLowerCase();
    return allProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerQuery) ||
        project.description?.toLowerCase().includes(lowerQuery) ||
        project.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}
