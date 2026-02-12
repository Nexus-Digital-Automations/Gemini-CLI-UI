import fs from 'fs/promises';
import path from 'path';
import { validateAndResolvePath } from '../../security/validators.js';
import type { ReadFileInput, WriteFileInput, FileMetadata, DirectoryListing } from '@gemini-ui/shared';

/**
 * Files service layer
 */
export class FilesService {
  private allowedRoots: string[] = [];

  constructor(allowedRoots?: string[]) {
    this.allowedRoots = allowedRoots || [];
  }

  /**
   * Set allowed root directories for this user
   */
  setAllowedRoots(roots: string[]) {
    this.allowedRoots = roots;
  }

  /**
   * Read file contents
   */
  async readFile(input: ReadFileInput): Promise<string> {
    const validPath = await validateAndResolvePath(input.path, this.allowedRoots);

    const content = await fs.readFile(validPath, input.encoding as BufferEncoding);
    return content;
  }

  /**
   * Write file contents
   */
  async writeFile(input: WriteFileInput): Promise<void> {
    const validPath = await validateAndResolvePath(input.path, this.allowedRoots);

    // Ensure directory exists
    await fs.mkdir(path.dirname(validPath), { recursive: true });

    await fs.writeFile(validPath, input.content, input.encoding as BufferEncoding);
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<DirectoryListing> {
    const validPath = await validateAndResolvePath(dirPath, this.allowedRoots);

    const entries = await fs.readdir(validPath, { withFileTypes: true });

    const files: FileMetadata[] = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(validPath, entry.name);
        const stats = await fs.stat(fullPath);

        return {
          path: fullPath,
          name: entry.name,
          size: stats.size,
          mimeType: entry.isDirectory() ? 'inode/directory' : 'application/octet-stream',
          isDirectory: entry.isDirectory(),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
    );

    return {
      path: validPath,
      files: files.sort((a, b) => {
        // Directories first, then alphabetical
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      }),
    };
  }

  /**
   * Get file metadata
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    const validPath = await validateAndResolvePath(filePath, this.allowedRoots);

    const stats = await fs.stat(validPath);

    return {
      path: validPath,
      name: path.basename(validPath),
      size: stats.size,
      mimeType: stats.isDirectory() ? 'inode/directory' : 'application/octet-stream',
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  }

  /**
   * Delete file or directory
   */
  async delete(filePath: string, recursive = false): Promise<void> {
    const validPath = await validateAndResolvePath(filePath, this.allowedRoots);

    const stats = await fs.stat(validPath);

    if (stats.isDirectory()) {
      if (recursive) {
        await fs.rm(validPath, { recursive: true });
      } else {
        await fs.rmdir(validPath);
      }
    } else {
      await fs.unlink(validPath);
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const validPath = await validateAndResolvePath(dirPath, this.allowedRoots);
    await fs.mkdir(validPath, { recursive: true });
  }

  /**
   * Search for files by pattern
   */
  async search(rootPath: string, pattern: string): Promise<FileMetadata[]> {
    const validPath = await validateAndResolvePath(rootPath, this.allowedRoots);
    const results: FileMetadata[] = [];
    const regex = new RegExp(pattern, 'i');

    async function searchRecursive(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (regex.test(entry.name)) {
          const stats = await fs.stat(fullPath);
          results.push({
            path: fullPath,
            name: entry.name,
            size: stats.size,
            mimeType: entry.isDirectory() ? 'inode/directory' : 'application/octet-stream',
            isDirectory: entry.isDirectory(),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          });
        }

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchRecursive(fullPath);
        }
      }
    }

    await searchRecursive(validPath);
    return results;
  }
}
