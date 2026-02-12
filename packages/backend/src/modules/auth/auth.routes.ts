import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authLimiter } from '../../middleware/rate-limiter.js';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, authController.register);

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', authLimiter, authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Logout user (revoke refresh token)
 */
router.post('/logout', authController.logout);

export default router;
