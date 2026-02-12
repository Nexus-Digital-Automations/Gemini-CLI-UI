import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../security/jwt.js';
import type { TokenPayload } from '@gemini-ui/shared';
import { AppError } from './error-handler.js';

/**
 * Extend Express Request with user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer <token>

    if (!token) {
      throw new AppError(401, 'Access denied. No token provided.', 'NO_TOKEN');
    }

    // Verify token
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw new AppError(403, 'Invalid token type', 'INVALID_TOKEN_TYPE');
    }

    // Attach user to request
    (req as AuthRequest).user = {
      id: payload.userId,
      username: payload.username,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return next(new AppError(401, 'Token expired', 'TOKEN_EXPIRED'));
      }
      if (error.message === 'INVALID_TOKEN') {
        return next(new AppError(403, 'Invalid token', 'INVALID_TOKEN'));
      }
    }
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present and valid, but doesn't fail if missing
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);

    if (payload.type === 'access') {
      (req as AuthRequest).user = {
        id: payload.userId,
        username: payload.username,
      };
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
