import { useQuery } from '@tanstack/react-query';
import type { GeminiModel, GeminiModelListResponse } from '@gemini-ui/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010';

/**
 * Fetch all available Gemini models
 */
async function fetchModels(): Promise<GeminiModelListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/gemini/models`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Gemini models');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch all available Gemini models
 */
export function useGeminiModels() {
  return useQuery({
    queryKey: ['gemini', 'models'],
    queryFn: fetchModels,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (models don't change often)
  });
}

/**
 * Hook to get a specific model by ID
 */
export function useGeminiModel(modelId: string | undefined) {
  const { data } = useGeminiModels();

  if (!modelId || !data) {
    return undefined;
  }

  return data.models.find((model: GeminiModel) => model.id === modelId);
}
