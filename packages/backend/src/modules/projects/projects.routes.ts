import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const projectsController = new ProjectsController();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/projects/recent
 * Get recent projects
 */
router.get('/recent', projectsController.getRecent);

/**
 * GET /api/projects/search
 * Search projects
 */
router.get('/search', projectsController.search);

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', projectsController.create);

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', projectsController.findAll);

/**
 * GET /api/projects/:id
 * Get single project
 */
router.get('/:id', projectsController.findOne);

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', projectsController.update);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', projectsController.delete);

/**
 * POST /api/projects/validate
 * Validate a project path
 */
router.post('/validate', projectsController.validatePath);

export default router;
