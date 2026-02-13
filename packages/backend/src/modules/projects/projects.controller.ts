import type { Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type ApiResponse,
} from '@gemini-ui/shared';
import { AppError } from '../../middleware/error-handler.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

/**
 * Projects controller
 */
export class ProjectsController {
  private projectsService = new ProjectsService();

  /**
   * Create new project
   * POST /api/projects
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const input = CreateProjectSchema.parse(req.body);
      const project = await this.projectsService.create(req.user.id, input);

      res.status(201).json({
        success: true,
        data: project,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        return next(new AppError(400, error.message, 'INVALID_PATH'));
      }
      next(error);
    }
  };

  /**
   * Get all projects
   * GET /api/projects
   */
  findAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const projects = await this.projectsService.findAll(req.user.id);

      res.json({
        success: true,
        data: projects,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single project
   * GET /api/projects/:id
   */
  findOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await this.projectsService.findById(
        req.user.id,
        projectId
      );

      if (!project) {
        throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: project,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update project
   * PUT /api/projects/:id
   */
  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const input = UpdateProjectSchema.parse(req.body);
      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await this.projectsService.update(
        req.user.id,
        projectId,
        input
      );

      if (!project) {
        throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: project,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const success = await this.projectsService.delete(
        req.user.id,
        projectId
      );

      if (!success) {
        throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Project deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent projects
   * GET /api/projects/recent
   */
  getRecent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const projects = await this.projectsService.getRecent(req.user.id, limit);

      res.json({
        success: true,
        data: projects,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search projects
   * GET /api/projects/search?q=query
   */
  search = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const query = req.query.q as string;
      if (!query) {
        throw new AppError(400, 'Search query required', 'MISSING_QUERY');
      }

      const projects = await this.projectsService.search(req.user.id, query);

      res.json({
        success: true,
        data: projects,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate project path
   * POST /api/projects/validate
   */
  validatePath = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { path } = req.body;

      if (!path || typeof path !== 'string') {
        throw new AppError(400, 'Path is required and must be a string', 'INVALID_PATH');
      }

      const validation = await this.projectsService.validateProjectPath(path);

      res.json({
        success: true,
        data: validation,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}
