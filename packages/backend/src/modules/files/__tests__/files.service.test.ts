import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilesService } from '../files.service.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FilesService', () => {
  let filesService: FilesService;
  let testDir: string;
  let allowedRoots: string[];

  beforeEach(async () => {
    // Create test directory
    testDir = path.join(os.tmpdir(), `test-files-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    allowedRoots = [testDir];
    filesService = new FilesService(allowedRoots);

    // Create test files
    await fs.writeFile(path.join(testDir, 'test.txt'), 'Hello, World!');
    await fs.writeFile(path.join(testDir, 'test.json'), '{"key": "value"}');
    await fs.mkdir(path.join(testDir, 'subdir'));
    await fs.writeFile(path.join(testDir, 'subdir', 'nested.txt'), 'Nested content');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const input = {
        path: path.join(testDir, 'test.txt'),
      };

      const result = await filesService.readFile(input);

      expect(result).toBe('Hello, World!');
    });

    it('should read file with specific encoding', async () => {
      const input = {
        path: path.join(testDir, 'test.txt'),
        encoding: 'utf8' as const,
      };

      const result = await filesService.readFile(input);

      expect(result).toBe('Hello, World!');
    });

    it('should read nested files', async () => {
      const input = {
        path: path.join(testDir, 'subdir', 'nested.txt'),
      };

      const result = await filesService.readFile(input);

      expect(result).toBe('Nested content');
    });

    it('should reject path traversal attempts', async () => {
      const input = {
        path: path.join(testDir, '..', '..', 'etc', 'passwd'),
      };

      await expect(filesService.readFile(input)).rejects.toThrow();
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        path: '/etc/passwd',
      };

      await expect(filesService.readFile(input)).rejects.toThrow('Access denied');
    });

    it('should throw for non-existent files', async () => {
      const input = {
        path: path.join(testDir, 'nonexistent.txt'),
      };

      await expect(filesService.readFile(input)).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      const input = {
        path: path.join(testDir, 'new.txt'),
        content: 'New content',
      };

      await filesService.writeFile(input);

      const content = await fs.readFile(path.join(testDir, 'new.txt'), 'utf8');
      expect(content).toBe('New content');
    });

    it('should overwrite existing files', async () => {
      const input = {
        path: path.join(testDir, 'test.txt'),
        content: 'Updated content',
      };

      await filesService.writeFile(input);

      const content = await fs.readFile(path.join(testDir, 'test.txt'), 'utf8');
      expect(content).toBe('Updated content');
    });

    it('should write files in subdirectories', async () => {
      const input = {
        path: path.join(testDir, 'subdir', 'new.txt'),
        content: 'Nested new content',
      };

      await filesService.writeFile(input);

      const content = await fs.readFile(path.join(testDir, 'subdir', 'new.txt'), 'utf8');
      expect(content).toBe('Nested new content');
    });

    it('should write with specific encoding', async () => {
      const input = {
        path: path.join(testDir, 'encoded.txt'),
        content: 'Encoded content',
        encoding: 'utf8' as const,
      };

      await filesService.writeFile(input);

      const content = await fs.readFile(path.join(testDir, 'encoded.txt'), 'utf8');
      expect(content).toBe('Encoded content');
    });

    it('should reject path traversal attempts', async () => {
      const input = {
        path: path.join(testDir, '..', 'malicious.txt'),
        content: 'Malicious content',
      };

      await expect(filesService.writeFile(input)).rejects.toThrow();
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        path: '/tmp/outside.txt',
        content: 'Outside content',
      };

      await expect(filesService.writeFile(input)).rejects.toThrow('Access denied');
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents', async () => {
      const input = {
        path: testDir,
      };

      const result = await filesService.listDirectory(input);

      expect(result).toHaveLength(3);
      expect(result.some((item) => item.name === 'test.txt')).toBe(true);
      expect(result.some((item) => item.name === 'test.json')).toBe(true);
      expect(result.some((item) => item.name === 'subdir')).toBe(true);
    });

    it('should include file types', async () => {
      const input = {
        path: testDir,
      };

      const result = await filesService.listDirectory(input);

      const testFile = result.find((item) => item.name === 'test.txt');
      const subdirItem = result.find((item) => item.name === 'subdir');

      expect(testFile?.type).toBe('file');
      expect(subdirItem?.type).toBe('directory');
    });

    it('should list nested directories', async () => {
      const input = {
        path: path.join(testDir, 'subdir'),
      };

      const result = await filesService.listDirectory(input);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('nested.txt');
      expect(result[0].type).toBe('file');
    });

    it('should reject path traversal attempts', async () => {
      const input = {
        path: path.join(testDir, '..', '..'),
      };

      await expect(filesService.listDirectory(input)).rejects.toThrow();
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        path: '/etc',
      };

      await expect(filesService.listDirectory(input)).rejects.toThrow('Access denied');
    });
  });

  describe('getMetadata', () => {
    it('should get file metadata', async () => {
      const input = {
        path: path.join(testDir, 'test.txt'),
      };

      const result = await filesService.getMetadata(input);

      expect(result.name).toBe('test.txt');
      expect(result.type).toBe('file');
      expect(result.size).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.modifiedAt).toBeInstanceOf(Date);
    });

    it('should get directory metadata', async () => {
      const input = {
        path: path.join(testDir, 'subdir'),
      };

      const result = await filesService.getMetadata(input);

      expect(result.name).toBe('subdir');
      expect(result.type).toBe('directory');
    });

    it('should throw for non-existent files', async () => {
      const input = {
        path: path.join(testDir, 'nonexistent.txt'),
      };

      await expect(filesService.getMetadata(input)).rejects.toThrow();
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        path: '/etc/passwd',
      };

      await expect(filesService.getMetadata(input)).rejects.toThrow('Access denied');
    });
  });

  describe('searchFiles', () => {
    beforeEach(async () => {
      // Create additional test files for search
      await fs.writeFile(path.join(testDir, 'search-test.txt'), 'Content');
      await fs.writeFile(path.join(testDir, 'another-test.md'), 'Content');
      await fs.writeFile(path.join(testDir, 'subdir', 'search-nested.txt'), 'Content');
    });

    it('should search files by pattern', async () => {
      const input = {
        rootPath: testDir,
        pattern: '*.txt',
      };

      const result = await filesService.searchFiles(input);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((file) => file.endsWith('.txt'))).toBe(true);
    });

    it('should search recursively', async () => {
      const input = {
        rootPath: testDir,
        pattern: '**/search-*.txt',
      };

      const result = await filesService.searchFiles(input);

      expect(result.some((file) => file.includes('search-test.txt'))).toBe(true);
      expect(result.some((file) => file.includes('search-nested.txt'))).toBe(true);
    });

    it('should search with specific extensions', async () => {
      const input = {
        rootPath: testDir,
        pattern: '*.md',
      };

      const result = await filesService.searchFiles(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('another-test.md');
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        rootPath: '/etc',
        pattern: '*.conf',
      };

      await expect(filesService.searchFiles(input)).rejects.toThrow('Access denied');
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const input = {
        path: path.join(testDir, 'test.txt'),
      };

      await filesService.deleteFile(input);

      await expect(fs.access(path.join(testDir, 'test.txt'))).rejects.toThrow();
    });

    it('should delete directory recursively', async () => {
      const input = {
        path: path.join(testDir, 'subdir'),
        recursive: true,
      };

      await filesService.deleteFile(input);

      await expect(fs.access(path.join(testDir, 'subdir'))).rejects.toThrow();
    });

    it('should throw when deleting directory without recursive flag', async () => {
      const input = {
        path: path.join(testDir, 'subdir'),
      };

      await expect(filesService.deleteFile(input)).rejects.toThrow();
    });

    it('should reject paths outside allowed roots', async () => {
      const input = {
        path: '/tmp/test.txt',
      };

      await expect(filesService.deleteFile(input)).rejects.toThrow('Access denied');
    });
  });
});
