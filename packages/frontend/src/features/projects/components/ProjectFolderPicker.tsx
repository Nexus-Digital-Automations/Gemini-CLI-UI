import { useState } from 'react';
import { useFolderPicker } from '../hooks/useFolderPicker';
import { cn } from '../../../lib/utils';

interface ProjectFolderPickerProps {
  onSelect: (path: string) => void;
  defaultPath?: string;
  className?: string;
}

/**
 * Project folder picker component
 *
 * Uses Web File System Access API when available (Chrome/Edge),
 * falls back to manual input for other browsers (Firefox/Safari)
 */
export function ProjectFolderPicker({
  onSelect,
  defaultPath = '',
  className,
}: ProjectFolderPickerProps) {
  const { pickFolder, isSupported } = useFolderPicker();
  const [path, setPath] = useState(defaultPath);
  const [showManualInput, setShowManualInput] = useState(!isSupported);
  const [error, setError] = useState<string | null>(null);

  const handleNativePicker = async () => {
    try {
      setError(null);
      const folderName = await pickFolder();

      if (folderName) {
        // Show manual input with pre-filled suggestion
        // User needs to complete the full path since we can only get the folder name
        const suggestedPath = `/Users/${folderName}`;
        setPath(suggestedPath);
        setShowManualInput(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to open folder picker'
      );
    }
  };

  const handleManualInput = (value: string) => {
    setPath(value);
    setError(null);
  };

  const handleSubmit = () => {
    if (!path.trim()) {
      setError('Please enter a project path');
      return;
    }

    // Basic validation
    if (!path.startsWith('/') && !path.match(/^[A-Za-z]:\\/)) {
      setError('Please enter an absolute path');
      return;
    }

    onSelect(path.trim());
  };

  const handleToggleManual = () => {
    setShowManualInput(!showManualInput);
    setError(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <label className="block text-sm font-medium text-gray-700">
        Project Path
      </label>

      {/* Native picker button (only shown if supported and not in manual mode) */}
      {isSupported && !showManualInput && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleNativePicker}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'px-4 py-3 text-sm font-medium',
              'bg-blue-600 text-white rounded-md',
              'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-colors'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Browse Folders
          </button>

          <button
            type="button"
            onClick={handleToggleManual}
            className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Or enter path manually
          </button>
        </div>
      )}

      {/* Manual input */}
      {(!isSupported || showManualInput) && (
        <div className="space-y-2">
          {/* Browser support notice */}
          {!isSupported && (
            <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ℹ️ Your browser doesn't support the native folder picker. Please
                enter the path manually.
              </p>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={path}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder="/absolute/path/to/project"
              className={cn(
                'w-full px-4 py-2 text-sm',
                'border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                error ? 'border-red-300' : 'border-gray-300'
              )}
            />
            {path && (
              <button
                type="button"
                onClick={() => setPath('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Clear path"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Common paths helper */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Quick start:</span>
            <button
              type="button"
              onClick={() => setPath('/Users/')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              /Users/
            </button>
            <button
              type="button"
              onClick={() => setPath('/home/')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              /home/
            </button>
            <button
              type="button"
              onClick={() => setPath(process.env.HOME || '~')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Home
            </button>
          </div>

          {isSupported && (
            <button
              type="button"
              onClick={handleToggleManual}
              className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Use folder picker instead
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!path.trim()}
        className={cn(
          'w-full px-4 py-2 text-sm font-medium rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors',
          path.trim()
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        )}
      >
        Add Project
      </button>
    </div>
  );
}
