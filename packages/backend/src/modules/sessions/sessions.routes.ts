import { Router } from 'express';
import { SessionsController } from './sessions.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const sessionsController = new SessionsController();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/sessions/project
 * Get sessions by project path
 */
router.get('/project', sessionsController.findByProject);

/**
 * POST /api/sessions
 * Create new session
 */
router.post('/', sessionsController.create);

/**
 * GET /api/sessions
 * Get all sessions
 */
router.get('/', sessionsController.findAll);

/**
 * GET /api/sessions/:id
 * Get single session with messages
 */
router.get('/:id', sessionsController.findOne);

/**
 * POST /api/sessions/:id/messages
 * Add message to session
 */
router.post('/:id/messages', sessionsController.addMessage);

/**
 * DELETE /api/sessions/:id
 * Delete session
 */
router.delete('/:id', sessionsController.delete);

export default router;
