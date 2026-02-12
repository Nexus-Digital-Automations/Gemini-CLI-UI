import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitService } from '../git.service.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('GitService', () => {
  let gitService: GitService;
  let testRepo: string;

  beforeEach(async () => {
    // Create test git repository
    testRepo = path.join(os.tmpdir(), `test-git-repo-${Date.now()}`);
    await fs.mkdir(testRepo, { recursive: true });

    // Initialize git repo with 'main' as default branch
    await execAsync('git init -b main', { cwd: testRepo });
    await execAsync('git config user.name "Test User"', { cwd: testRepo });
    await execAsync('git config user.email "test@example.com"', { cwd: testRepo });

    // Create initial commit
    await fs.writeFile(path.join(testRepo, 'README.md'), '# Test Repo');
    await execAsync('git add README.md', { cwd: testRepo });
    await execAsync('git commit -m "Initial commit"', { cwd: testRepo });

    gitService = new GitService();
  });

  afterEach(async () => {
    // Clean up test repository
    try {
      await fs.rm(testRepo, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('status', () => {
    it('should get git status for clean repo', async () => {
      const result = await gitService.status(testRepo);

      expect(result.branch).toBe('main' || 'master');
      expect(result.modified).toHaveLength(0);
      expect(result.untracked).toHaveLength(0);
      expect(result.staged).toHaveLength(0);
    });

    it('should detect modified files', async () => {
      await fs.writeFile(path.join(testRepo, 'README.md'), '# Modified');

      const result = await gitService.status(testRepo);

      expect(result.modified).toContain('README.md');
    });

    it('should detect untracked files', async () => {
      await fs.writeFile(path.join(testRepo, 'new.txt'), 'New file');

      const result = await gitService.status(testRepo);

      expect(result.untracked).toContain('new.txt');
    });

    it('should detect staged files', async () => {
      await fs.writeFile(path.join(testRepo, 'new.txt'), 'New file');
      await execAsync('git add new.txt', { cwd: testRepo });

      const result = await gitService.status(testRepo);

      expect(result.staged).toContain('new.txt');
    });

    it('should throw for non-git directory', async () => {
      const nonGitDir = path.join(os.tmpdir(), `non-git-${Date.now()}`);
      await fs.mkdir(nonGitDir, { recursive: true });

      await expect(gitService.status(nonGitDir)).rejects.toThrow();

      await fs.rm(nonGitDir, { recursive: true, force: true });
    });
  });

  describe('commit', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(testRepo, 'test.txt'), 'Test content');
    });

    it('should commit staged changes', async () => {
      await execAsync('git add test.txt', { cwd: testRepo });

      const input = {
        message: 'Add test file',
      };

      const result = await gitService.commit(testRepo, input);

      expect(result).toContain('Add test file');
    });

    it('should commit specific files', async () => {
      const input = {
        message: 'Add test file',
        files: ['test.txt'],
      };

      const result = await gitService.commit(testRepo, input);

      expect(result).toContain('Add test file');

      const status = await gitService.status(testRepo);
      expect(status.modified).toHaveLength(0);
    });

    it('should sanitize commit messages', async () => {
      await execAsync('git add test.txt', { cwd: testRepo });

      const input = {
        message: 'Test commit with $(dangerous) command',
      };

      const result = await gitService.commit(testRepo, input);

      // Message should be sanitized
      expect(result).not.toContain('$(dangerous)');
    });

    it('should reject empty commit messages', async () => {
      await execAsync('git add test.txt', { cwd: testRepo });

      const input = {
        message: '',
      };

      await expect(gitService.commit(testRepo, input)).rejects.toThrow();
    });

    it('should handle commit with no changes', async () => {
      const input = {
        message: 'No changes',
      };

      await expect(gitService.commit(testRepo, input)).rejects.toThrow();
    });
  });

  describe('createBranch', () => {
    it('should create new branch', async () => {
      const input = {
        name: 'feature-branch',
      };

      await gitService.createBranch(testRepo, input);

      const { stdout } = await execAsync('git branch', { cwd: testRepo });
      expect(stdout).toContain('feature-branch');
    });

    it('should create and checkout branch', async () => {
      const input = {
        name: 'feature-branch',
        checkout: true,
      };

      await gitService.createBranch(testRepo, input);

      const status = await gitService.status(testRepo);
      expect(status.branch).toBe('feature-branch');
    });

    it('should reject invalid branch names', async () => {
      const input = {
        name: 'invalid..branch',
      };

      await expect(gitService.createBranch(testRepo, input)).rejects.toThrow();
    });

    it('should reject duplicate branch names', async () => {
      const input = {
        name: 'feature-branch',
      };

      await gitService.createBranch(testRepo, input);

      await expect(gitService.createBranch(testRepo, input)).rejects.toThrow();
    });
  });

  describe('log', () => {
    beforeEach(async () => {
      // Create additional commits
      await fs.writeFile(path.join(testRepo, 'file1.txt'), 'Content 1');
      await execAsync('git add file1.txt', { cwd: testRepo });
      await execAsync('git commit -m "Second commit"', { cwd: testRepo });

      await fs.writeFile(path.join(testRepo, 'file2.txt'), 'Content 2');
      await execAsync('git add file2.txt', { cwd: testRepo });
      await execAsync('git commit -m "Third commit"', { cwd: testRepo });
    });

    it('should get commit log', async () => {
      const result = await gitService.log(testRepo);

      expect(result).toHaveLength(3);
      expect(result[0].message).toContain('Third commit');
      expect(result[1].message).toContain('Second commit');
      expect(result[2].message).toContain('Initial commit');
    });

    it('should limit log results', async () => {
      const result = await gitService.log(testRepo, 2);

      expect(result).toHaveLength(2);
      expect(result[0].message).toContain('Third commit');
      expect(result[1].message).toContain('Second commit');
    });

    it('should include commit hashes', async () => {
      const result = await gitService.log(testRepo);

      expect(result[0].hash).toBeDefined();
      expect(result[0].hash).toMatch(/^[0-9a-f]{7,40}$/);
    });

    it('should include author and date', async () => {
      const result = await gitService.log(testRepo);

      expect(result[0].author).toBe('Test User');
      expect(result[0].date).toBeInstanceOf(Date);
    });
  });

  describe('diff', () => {
    it('should show diff for modified files', async () => {
      await fs.writeFile(path.join(testRepo, 'README.md'), '# Modified Content');

      const result = await gitService.diff(testRepo);

      expect(result).toContain('README.md');
      expect(result).toContain('Modified Content');
    });

    it('should show diff for specific files', async () => {
      await fs.writeFile(path.join(testRepo, 'README.md'), '# Modified');
      await fs.writeFile(path.join(testRepo, 'other.txt'), 'Other');

      const result = await gitService.diff(testRepo, ['README.md']);

      expect(result).toContain('README.md');
      expect(result).not.toContain('other.txt');
    });

    it('should show staged diff', async () => {
      await fs.writeFile(path.join(testRepo, 'README.md'), '# Staged Content');
      await execAsync('git add README.md', { cwd: testRepo });

      const result = await gitService.diff(testRepo, undefined, true);

      expect(result).toContain('README.md');
      expect(result).toContain('Staged Content');
    });

    it('should return empty string for no changes', async () => {
      const result = await gitService.diff(testRepo);

      expect(result).toBe('');
    });
  });

  describe('listBranches', () => {
    beforeEach(async () => {
      await gitService.createBranch(testRepo, { name: 'feature-1' });
      await gitService.createBranch(testRepo, { name: 'feature-2' });
    });

    it('should list all branches', async () => {
      const result = await gitService.listBranches(testRepo);

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.some((b) => b.name === 'main' || b.name === 'master')).toBe(true);
      expect(result.some((b) => b.name === 'feature-1')).toBe(true);
      expect(result.some((b) => b.name === 'feature-2')).toBe(true);
    });

    it('should mark current branch', async () => {
      const result = await gitService.listBranches(testRepo);

      const currentBranch = result.find((b) => b.current);
      expect(currentBranch).toBeDefined();
      expect(currentBranch?.name).toBe('main' || 'master');
    });

    it('should update current branch after checkout', async () => {
      await gitService.createBranch(testRepo, { name: 'feature-3', checkout: true });

      const result = await gitService.listBranches(testRepo);

      const currentBranch = result.find((b) => b.current);
      expect(currentBranch?.name).toBe('feature-3');
    });
  });
});
