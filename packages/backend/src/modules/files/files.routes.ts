import { Router } from 'express';
import { FilesController } from './files.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const filesController = new FilesController();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/files/read
 * Read file contents
 */
router.post('/read', filesController.read);

/**
 * POST /api/files/write
 * Write file contents
 */
router.post('/write', filesController.write);

/**
 * GET /api/files/list
 * List directory contents
 */
router.get('/list', filesController.list);

/**
 * GET /api/files/metadata
 * Get file metadata
 */
router.get('/metadata', filesController.metadata);

/**
 * GET /api/files/search
 * Search for files
 */
router.get('/search', filesController.search);

/**
 * DELETE /api/files
 * Delete file or directory
 */
router.delete('/', filesController.delete);

export default router;
