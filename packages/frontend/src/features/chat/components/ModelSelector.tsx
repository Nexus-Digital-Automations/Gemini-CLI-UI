import { useState } from 'react';
import type { GeminiModel } from '@gemini-ui/shared';
import { useGeminiModels } from '../hooks/useGeminiModels';
import { cn } from '../../../lib/utils';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
}

/**
 * Capability badge component
 */
function CapabilityBadge({ capability }: { capability: string }) {
  const badges: Record<string, { label: string; className: string }> = {
    vision: { label: '👁️ Vision', className: 'bg-purple-100 text-purple-700' },
    audio: { label: '🎵 Audio', className: 'bg-blue-100 text-blue-700' },
    tts: { label: '🔊 TTS', className: 'bg-green-100 text-green-700' },
    'computer-use': {
      label: '💻 Computer Use',
      className: 'bg-orange-100 text-orange-700',
    },
    thinking: { label: '🧠 Thinking', className: 'bg-pink-100 text-pink-700' },
  };

  const badge = badges[capability] || {
    label: capability,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        badge.className
      )}
    >
      {badge.label}
    </span>
  );
}

/**
 * Model selector component
 */
export function ModelSelector({
  value,
  onChange,
  className,
}: ModelSelectorProps) {
  const { data, isLoading, error } = useGeminiModels();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('text-red-600 text-sm', className)}>
        Failed to load models
      </div>
    );
  }

  const selectedModel = data.models.find(
    (model: GeminiModel) => model.id === value
  );

  // Group models by family
  const modelsByFamily = data.models.reduce(
    (acc: Record<string, GeminiModel[]>, model: GeminiModel) => {
      if (!acc[model.family]) {
        acc[model.family] = [];
      }
      acc[model.family].push(model);
      return acc;
    },
    {}
  );

  const familyOrder = ['gemini-3', 'gemini-2.5', 'gemini-2.0'];
  const familyLabels: Record<string, string> = {
    'gemini-3': 'Gemini 3 (Preview)',
    'gemini-2.5': 'Gemini 2.5',
    'gemini-2.0': 'Gemini 2.0 (Deprecated)',
  };

  return (
    <div className={cn('relative', className)}>
      {/* Selected model display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-2 text-sm font-medium',
          'bg-white border border-gray-300 rounded-md',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors'
        )}
      >
        <span className="flex items-center gap-2">
          <span>{selectedModel?.name || 'Select a model'}</span>
          {selectedModel?.preview && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
              PREVIEW
            </span>
          )}
          {selectedModel?.deprecated && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
              DEPRECATED
            </span>
          )}
        </span>
        <svg
          className={cn(
            'w-5 h-5 transition-transform',
            isOpen && 'transform rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
            {familyOrder.map((family) => {
              const models = modelsByFamily[family];
              if (!models || models.length === 0) return null;

              return (
                <div key={family} className="py-2">
                  {/* Family header */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    {familyLabels[family]}
                  </div>

                  {/* Models in this family */}
                  {models.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onChange(model.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50',
                        'transition-colors border-b border-gray-100 last:border-b-0',
                        value === model.id && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {model.name}
                            </span>
                            {model.preview && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                                PREVIEW
                              </span>
                            )}
                            {model.deprecated && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                                DEPRECATED
                              </span>
                            )}
                          </div>

                          {/* Capabilities */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.capabilities.map((capability) => (
                              <CapabilityBadge
                                key={capability}
                                capability={capability}
                              />
                            ))}
                          </div>

                          {/* Context window */}
                          <div className="mt-2 text-xs text-gray-500">
                            Context: {model.contextWindow.toLocaleString()}{' '}
                            tokens
                          </div>

                          {/* Deprecation notice */}
                          {model.deprecated && model.deprecationDate && (
                            <div className="mt-1 text-xs text-red-600">
                              ⚠️ Sunset: {model.deprecationDate}
                            </div>
                          )}
                        </div>

                        {/* Selected checkmark */}
                        {value === model.id && (
                          <svg
                            className="w-5 h-5 text-blue-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
