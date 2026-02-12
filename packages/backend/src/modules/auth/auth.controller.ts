import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { LoginSchema, RegisterSchema } from '@gemini-ui/shared';
import type { ApiResponse } from '@gemini-ui/shared';
import { AppError } from '../../middleware/error-handler.js';

/**
 * Authentication controller
 */
export class AuthController {
  private authService = new AuthService();

  /**
   * Register new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const input = RegisterSchema.parse(req.body);

      // Register user
      const result = await this.authService.register(input);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        return next(new AppError(409, error.message, 'USERNAME_EXISTS'));
      }
      next(error);
    }
  };

  /**
   * Login existing user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const input = LoginSchema.parse(req.body);

      // Login user
      const result = await this.authService.login(input);

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return next(new AppError(401, error.message, 'INVALID_CREDENTIALS'));
      }
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new AppError(400, 'Refresh token required', 'MISSING_REFRESH_TOKEN');
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid or revoked refresh token' ||
          error.message === 'Refresh token expired' ||
          error.message === 'TOKEN_EXPIRED' ||
          error.message === 'INVALID_TOKEN'
        ) {
          return next(new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN'));
        }
      }
      next(error);
    }
  };

  /**
   * Logout user (revoke refresh token)
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken && typeof refreshToken === 'string') {
        await this.authService.revokeRefreshToken(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}
