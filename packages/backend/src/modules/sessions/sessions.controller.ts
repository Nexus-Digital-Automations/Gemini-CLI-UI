import type { Response, NextFunction } from 'express';
import { SessionsService } from './sessions.service.js';
import { CreateSessionSchema, ChatMessageSchema, type ApiResponse } from '@gemini-ui/shared';
import { AppError } from '../../middleware/error-handler.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

/**
 * Sessions controller
 */
export class SessionsController {
  private sessionsService = new SessionsService();

  /**
   * Create new session
   * POST /api/sessions
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const input = CreateSessionSchema.parse(req.body);
      const session = await this.sessionsService.create(req.user.id, input);

      res.status(201).json({
        success: true,
        data: session,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sessions
   * GET /api/sessions
   */
  findAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const sessions = await this.sessionsService.findAll(req.user.id);

      res.json({
        success: true,
        data: sessions,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single session with messages
   * GET /api/sessions/:id
   */
  findOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const session = await this.sessionsService.findWithMessages(
        req.user.id,
        req.params.id
      );

      if (!session) {
        throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: session,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add message to session
   * POST /api/sessions/:id/messages
   */
  addMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const messageData = ChatMessageSchema.parse(req.body);
      const message = await this.sessionsService.addMessage(
        req.user.id,
        req.params.id,
        messageData
      );

      res.status(201).json({
        success: true,
        data: message,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return next(new AppError(404, error.message, 'SESSION_NOT_FOUND'));
      }
      next(error);
    }
  };

  /**
   * Delete session
   * DELETE /api/sessions/:id
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const success = await this.sessionsService.delete(req.user.id, req.params.id);

      if (!success) {
        throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Session deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sessions by project
   * GET /api/sessions/project?path=/path/to/project
   */
  findByProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const projectPath = req.query.path as string;
      if (!projectPath) {
        throw new AppError(400, 'Project path required', 'MISSING_PATH');
      }

      const sessions = await this.sessionsService.findByProject(
        req.user.id,
        projectPath
      );

      res.json({
        success: true,
        data: sessions,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}
