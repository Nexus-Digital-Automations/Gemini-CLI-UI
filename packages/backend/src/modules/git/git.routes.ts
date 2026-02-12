import { Router } from 'express';
import { GitController } from './git.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const gitController = new GitController();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/git/status
 * Get repository status
 */
router.get('/status', gitController.status);

/**
 * GET /api/git/log
 * Get commit log
 */
router.get('/log', gitController.log);

/**
 * GET /api/git/diff
 * Get diff
 */
router.get('/diff', gitController.diff);

/**
 * GET /api/git/branches
 * List branches
 */
router.get('/branches', gitController.listBranches);

/**
 * POST /api/git/commit
 * Commit changes
 */
router.post('/commit', gitController.commit);

/**
 * POST /api/git/branch
 * Create or checkout branch
 */
router.post('/branch', gitController.branch);

export default router;
