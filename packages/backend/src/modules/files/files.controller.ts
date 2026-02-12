import type { Response, NextFunction } from 'express';
import { FilesService } from './files.service.js';
import { ReadFileSchema, WriteFileSchema, type ApiResponse } from '@gemini-ui/shared';
import { AppError } from '../../middleware/error-handler.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { db } from '../../db/index.js';
import { projects } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Files controller
 */
export class FilesController {
  /**
   * Get user's allowed project paths
   */
  private async getAllowedRoots(userId: string): Promise<string[]> {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
    });

    return userProjects.map((p) => p.path);
  }

  /**
   * Read file
   * POST /api/files/read
   */
  read = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const input = ReadFileSchema.parse(req.body);
      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      const content = await filesService.readFile(input);

      res.json({
        success: true,
        data: { content },
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };

  /**
   * Write file
   * POST /api/files/write
   */
  write = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const input = WriteFileSchema.parse(req.body);
      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      await filesService.writeFile(input);

      res.json({
        success: true,
        message: 'File written successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };

  /**
   * List directory
   * GET /api/files/list?path=/path/to/dir
   */
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const dirPath = req.query.path as string;
      if (!dirPath) {
        throw new AppError(400, 'Path required', 'MISSING_PATH');
      }

      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      const listing = await filesService.listDirectory({ path: dirPath });

      res.json({
        success: true,
        data: listing,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };

  /**
   * Get file metadata
   * GET /api/files/metadata?path=/path/to/file
   */
  metadata = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        throw new AppError(400, 'Path required', 'MISSING_PATH');
      }

      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      const metadata = await filesService.getMetadata({ path: filePath });

      res.json({
        success: true,
        data: metadata,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };

  /**
   * Delete file/directory
   * DELETE /api/files?path=/path/to/file&recursive=true
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const filePath = req.query.path as string;
      if (!filePath) {
        throw new AppError(400, 'Path required', 'MISSING_PATH');
      }

      const recursive = req.query.recursive === 'true';
      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      await filesService.delete(filePath, recursive);

      res.json({
        success: true,
        message: 'File deleted successfully',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };

  /**
   * Search files
   * GET /api/files/search?root=/path&pattern=regex
   */
  search = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const rootPath = req.query.root as string;
      const pattern = req.query.pattern as string;

      if (!rootPath || !pattern) {
        throw new AppError(400, 'Root path and pattern required', 'MISSING_PARAMS');
      }

      const allowedRoots = await this.getAllowedRoots(req.user.id);
      const filesService = new FilesService(allowedRoots);

      const results = await filesService.search(rootPath, pattern);

      res.json({
        success: true,
        data: results,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AppError(403, 'Access denied', 'ACCESS_DENIED'));
      }
      next(error);
    }
  };
}
