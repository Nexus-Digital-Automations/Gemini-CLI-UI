import type { GeminiModel } from '../types/gemini.types.js';

/**
 * Complete list of available Gemini models
 * Updated as of February 2026
 */
export const GEMINI_MODELS: GeminiModel[] = [
  // Gemini 3 Series (Preview)
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    family: 'gemini-3',
    variant: 'pro',
    capabilities: ['vision', 'audio', 'thinking', 'computer-use'],
    contextWindow: 2000000,
    preview: true,
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    family: 'gemini-3',
    variant: 'flash',
    capabilities: ['vision', 'audio', 'thinking'],
    contextWindow: 1000000,
    preview: true,
  },

  // Gemini 2.5 Series (Stable)
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'gemini-2.5',
    variant: 'pro',
    capabilities: ['vision', 'audio', 'thinking'],
    contextWindow: 2000000,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'gemini-2.5',
    variant: 'flash',
    capabilities: ['vision', 'audio'],
    contextWindow: 1000000,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    family: 'gemini-2.5',
    variant: 'flash-lite',
    capabilities: ['vision'],
    contextWindow: 100000,
  },
  {
    id: 'gemini-2.5-pro-tts',
    name: 'Gemini 2.5 Pro with TTS',
    family: 'gemini-2.5',
    variant: 'pro',
    capabilities: ['vision', 'audio', 'tts', 'thinking'],
    contextWindow: 2000000,
  },
  {
    id: 'gemini-2.5-flash-tts',
    name: 'Gemini 2.5 Flash with TTS',
    family: 'gemini-2.5',
    variant: 'flash',
    capabilities: ['vision', 'audio', 'tts'],
    contextWindow: 1000000,
  },

  // Gemini 2.0 Series (Deprecated)
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Deprecated)',
    family: 'gemini-2.0',
    variant: 'flash',
    capabilities: ['vision', 'audio'],
    contextWindow: 1000000,
    deprecated: true,
    deprecationDate: '2026-03-31',
  },
];

/**
 * Default model to use when none is specified
 */
export const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Get model by ID
 */
export function getModelById(modelId: string): GeminiModel | undefined {
  return GEMINI_MODELS.find((model) => model.id === modelId);
}

/**
 * Get models by family
 */
export function getModelsByFamily(
  family: 'gemini-3' | 'gemini-2.5' | 'gemini-2.0'
): GeminiModel[] {
  return GEMINI_MODELS.filter((model) => model.family === family);
}

/**
 * Check if model ID is valid
 */
export function isValidModel(modelId: string): boolean {
  return GEMINI_MODELS.some((model) => model.id === modelId);
}

/**
 * Get active (non-deprecated) models
 */
export function getActiveModels(): GeminiModel[] {
  return GEMINI_MODELS.filter((model) => !model.deprecated);
}
