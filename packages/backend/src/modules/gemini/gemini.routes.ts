import { Router } from 'express';
import * as controller from './gemini.controller.js';

const router = Router();

/**
 * GET /api/gemini/models
 * List all available Gemini models
 */
router.get('/models', controller.getModels);

/**
 * GET /api/gemini/models/:modelId
 * Get a specific model by ID
 */
router.get('/models/:modelId', controller.getModel);

export default router;
