import { db } from '../../db/index.js';
import { projects } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { CreateProjectInput, UpdateProjectInput, Project } from '@gemini-ui/shared';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Convert database project (null fields) to Project type (undefined fields)
 */
function toProject(dbProject: any): Project {
  return {
    ...dbProject,
    description: dbProject.description ?? undefined,
    tags: dbProject.tags ?? undefined,
  };
}

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

    return toProject(newProject);
  }

  /**
   * Get all projects for a user
   */
  async findAll(userId: string): Promise<Project[]> {
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.lastAccessedAt)],
    });
    return allProjects.map(toProject);
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

    return toProject(project);
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

    // Validate new path if provided
    if (input.path) {
      const normalizedPath = path.resolve(input.path);
      // Verify path exists
      try {
        await fs.access(normalizedPath);
      } catch {
        throw new Error('Project path does not exist');
      }
      input.path = normalizedPath;
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

    return updated ? toProject(updated) : null;
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
      orderBy: [desc(projects.lastAccessedAt), desc(projects.createdAt)],
      limit,
    });

    return allProjects.map(toProject);
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

  /**
   * Validate a project path
   */
  async validateProjectPath(inputPath: string): Promise<{
    valid: boolean;
    error?: string;
    normalized?: string;
    exists?: boolean;
  }> {
    try {
      // Check if path is absolute
      if (!path.isAbsolute(inputPath)) {
        return {
          valid: false,
          error: 'Path must be absolute (start with / or drive letter)',
        };
      }

      // Normalize the path
      const normalized = path.resolve(inputPath);

      // Security check: Ensure path is within allowed roots
      // Allow user home directory and subdirectories
      const homeDir = os.homedir();
      const isInHome = normalized.startsWith(homeDir);

      // Allow /Users on macOS, /home on Linux
      const isInUsers =
        normalized.startsWith('/Users/') || normalized.startsWith('/home/');

      if (!isInHome && !isInUsers) {
        return {
          valid: false,
          error: 'Path must be within your home directory for security',
          normalized,
        };
      }

      // Check if path exists
      let exists = false;
      try {
        const stats = await fs.stat(normalized);
        exists = true;

        // Verify it's a directory
        if (!stats.isDirectory()) {
          return {
            valid: false,
            error: 'Path must be a directory, not a file',
            normalized,
            exists: true,
          };
        }
      } catch (error) {
        // Path doesn't exist - that's okay for validation
        exists = false;
      }

      // Check read permissions if path exists
      if (exists) {
        try {
          await fs.access(normalized, fs.constants.R_OK);
        } catch {
          return {
            valid: false,
            error: 'Directory exists but is not readable (permission denied)',
            normalized,
            exists: true,
          };
        }
      }

      return {
        valid: true,
        normalized,
        exists,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Failed to validate path',
      };
    }
  }
}
