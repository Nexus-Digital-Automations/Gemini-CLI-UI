import type { Response, NextFunction } from 'express';
import { GitService } from './git.service.js';
import { GitCommitSchema, GitBranchSchema, type ApiResponse } from '@gemini-ui/shared';
import { AppError } from '../../middleware/error-handler.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

/**
 * Git controller
 */
export class GitController {
  private gitService = new GitService();

  /**
   * Get git status
   * GET /api/git/status?repo=/path/to/repo
   */
  status = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const repoPath = req.query.repo as string;
      if (!repoPath) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const status = await this.gitService.status(repoPath);

      res.json({
        success: true,
        data: status,
      } as ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not a git repository')) {
        return next(new AppError(400, 'Not a git repository', 'NOT_GIT_REPO'));
      }
      next(error);
    }
  };

  /**
   * Commit changes
   * POST /api/git/commit
   */
  commit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { repo, ...commitInput } = req.body;
      if (!repo) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const input = GitCommitSchema.parse(commitInput);
      const result = await this.gitService.commit(repo, input);

      res.json({
        success: true,
        data: { message: result },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create/checkout branch
   * POST /api/git/branch
   */
  branch = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { repo, ...branchInput } = req.body;
      if (!repo) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const input = GitBranchSchema.parse(branchInput);
      const result = await this.gitService.branch(repo, input);

      res.json({
        success: true,
        data: { message: result },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get commit log
   * GET /api/git/log?repo=/path&limit=10
   */
  log = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const repoPath = req.query.repo as string;
      if (!repoPath) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const log = await this.gitService.log(repoPath, limit);

      res.json({
        success: true,
        data: log,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get diff
   * GET /api/git/diff?repo=/path&staged=true
   */
  diff = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const repoPath = req.query.repo as string;
      if (!repoPath) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const staged = req.query.staged === 'true';
      const diff = await this.gitService.diff(repoPath, undefined, staged);

      res.json({
        success: true,
        data: { diff },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List branches
   * GET /api/git/branches?repo=/path
   */
  listBranches = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const repoPath = req.query.repo as string;
      if (!repoPath) {
        throw new AppError(400, 'Repository path required', 'MISSING_REPO');
      }

      const branches = await this.gitService.listBranches(repoPath);

      res.json({
        success: true,
        data: branches,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}
