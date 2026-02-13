/**
 * Gemini model types and interfaces
 */

export type GeminiModelFamily = 'gemini-3' | 'gemini-2.5' | 'gemini-2.0';
export type GeminiModelVariant = 'pro' | 'flash' | 'flash-lite';
export type GeminiCapability =
  | 'vision'
  | 'audio'
  | 'tts'
  | 'computer-use'
  | 'thinking';

export interface GeminiModel {
  /** Unique model identifier */
  id: string;
  /** Display name */
  name: string;
  /** Model family */
  family: GeminiModelFamily;
  /** Model variant */
  variant: GeminiModelVariant;
  /** Capabilities supported by this model */
  capabilities: GeminiCapability[];
  /** Context window size in tokens */
  contextWindow: number;
  /** Whether this model is deprecated */
  deprecated?: boolean;
  /** Deprecation date if applicable */
  deprecationDate?: string;
  /** Whether this is a preview/experimental model */
  preview?: boolean;
}

export interface GeminiModelListResponse {
  models: GeminiModel[];
  defaultModel: string;
}
