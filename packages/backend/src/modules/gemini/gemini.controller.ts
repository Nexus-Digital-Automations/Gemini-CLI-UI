import type { Request, Response } from 'express';
import {
  GEMINI_MODELS,
  DEFAULT_MODEL,
  getModelById,
} from '@gemini-ui/shared';

/**
 * Gemini controller handles Gemini model-related operations
 */

/**
 * Get all available Gemini models
 */
export async function getModels(_req: Request, res: Response): Promise<void> {
  try {
    res.json({
      success: true,
      data: {
        models: GEMINI_MODELS,
        defaultModel: DEFAULT_MODEL,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Gemini models',
    });
  }
}

/**
 * Get a specific model by ID
 */
export async function getModel(req: Request, res: Response): Promise<void> {
  try {
    const modelId = Array.isArray(req.params.modelId)
      ? req.params.modelId[0]
      : req.params.modelId;
    const model = getModelById(modelId);

    if (!model) {
      res.status(404).json({
        success: false,
        error: `Model '${modelId}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model',
    });
  }
}
