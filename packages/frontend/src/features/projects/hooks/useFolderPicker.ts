import { useState, useEffect } from 'react';

/**
 * Web File System Access API types
 */
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export interface FolderPickerResult {
  /** Whether the browser supports the File System Access API */
  isSupported: boolean;
  /** Open the native folder picker */
  pickFolder: () => Promise<string | null>;
  /** Get full path from handle (not supported in browsers for security) */
  getFullPath: (handle: FileSystemDirectoryHandle) => Promise<string>;
}

/**
 * Hook to use the Web File System Access API for folder selection
 *
 * Note: The API has security limitations:
 * - Cannot get full filesystem path
 * - Can only get folder name
 * - User must manually input or complete the path
 *
 * Supported browsers:
 * - Chrome/Edge 86+
 * - Opera 72+
 * - NOT supported: Firefox, Safari (as of 2026)
 */
export function useFolderPicker(): FolderPickerResult {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if the File System Access API is supported
    setIsSupported(typeof window.showDirectoryPicker === 'function');
  }, []);

  const pickFolder = async (): Promise<string | null> => {
    if (!window.showDirectoryPicker) {
      console.warn('File System Access API not supported');
      return null;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });

      // Note: We can only get the folder name, not the full path
      // This is a security limitation of the Web API
      // The user will need to manually complete the path
      return handle.name;
    } catch (error) {
      // User cancelled the picker
      if ((error as Error).name === 'AbortError') {
        return null;
      }

      console.error('Error picking folder:', error);
      throw error;
    }
  };

  const getFullPath = async (
    handle: FileSystemDirectoryHandle
  ): Promise<string> => {
    // Unfortunately, the Web API doesn't provide a way to get the full path
    // for security reasons. We can only get the folder name.
    // The user will need to type the complete path.
    return handle.name;
  };

  return {
    isSupported,
    pickFolder,
    getFullPath,
  };
}
