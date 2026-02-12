import { exec } from 'child_process';
import { promisify } from 'util';
import { GitCommitMessageSchema, GitBranchNameSchema } from '../../security/validators.js';
import type { GitCommitInput, GitBranchInput, GitStatus } from '@gemini-ui/shared';

const execAsync = promisify(exec);

/**
 * Git service layer
 */
export class GitService {
  /**
   * Execute git command safely
   */
  private async execGit(cwd: string, command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git ${command}`, {
        cwd,
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Only trim trailing whitespace - leading spaces are significant in git status
      return stdout.trimEnd();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Git command failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get git status
   */
  async status(repoPath: string): Promise<GitStatus> {
    // Get current branch
    const branch = await this.execGit(repoPath, 'rev-parse --abbrev-ref HEAD');

    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    try {
      const upstream = await this.execGit(repoPath, 'rev-parse --abbrev-ref @{upstream}');
      const counts = await this.execGit(repoPath, `rev-list --left-right --count ${upstream}...HEAD`);
      const [behindStr, aheadStr] = counts.split('\t');
      behind = parseInt(behindStr);
      ahead = parseInt(aheadStr);
    } catch {
      // No upstream or other error, leave as 0
    }

    // Get file statuses
    const status = await this.execGit(repoPath, 'status --porcelain');
    const lines = status.split('\n').filter(Boolean);

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const line of lines) {
      // Git status --porcelain format: XY filename
      // X = index status, Y = working tree status
      // Ensure line has at least 3 characters (XY + space + filename)
      if (line.length < 3) continue;

      const X = line[0];
      const Y = line[1];
      const filePath = line.substring(3);

      if (X === '?' && Y === '?') {
        untracked.push(filePath);
      } else if (X === 'U' || Y === 'U' || (X === 'A' && Y === 'A') || (X === 'D' && Y === 'D')) {
        conflicted.push(filePath);
      } else {
        // Check index (X)
        if (X !== ' ' && X !== '?') {
          staged.push(filePath);
        }
        // Check working tree (Y)
        if (Y !== ' ' && Y !== '?') {
          unstaged.push(filePath);
        }
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      modified: unstaged, // Alias for compatibility
      unstaged,
      untracked,
      conflicted,
    };
  }

  /**
   * Commit changes
   */
  async commit(repoPath: string, input: GitCommitInput): Promise<string> {
    // Validate and sanitize commit message
    const message = GitCommitMessageSchema.parse(input.message);

    // Add files if specified
    if (input.files && input.files.length > 0) {
      const files = input.files.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(' ');
      await this.execGit(repoPath, `add ${files}`);
    } else if (input.all) {
      await this.execGit(repoPath, 'add -A');
    }

    // Commit
    const result = await this.execGit(repoPath, `commit -m "${message.replace(/"/g, '\\"')}"`);
    return result;
  }

  /**
   * Create or checkout branch
   */
  async branch(repoPath: string, input: GitBranchInput): Promise<string> {
    // Validate branch name
    const branchName = GitBranchNameSchema.parse(input.name);

    if (input.checkout) {
      // Checkout existing or create new branch
      try {
        return await this.execGit(repoPath, `checkout ${branchName}`);
      } catch {
        return await this.execGit(repoPath, `checkout -b ${branchName}`);
      }
    } else {
      // Create new branch
      return await this.execGit(repoPath, `branch ${branchName}`);
    }
  }

  /**
   * Get commit log
   */
  async log(repoPath: string, limit = 10): Promise<any[]> {
    const result = await this.execGit(
      repoPath,
      `log --pretty=format:"%H|%an|%ai|%s" -n ${limit}`
    );

    const lines = result.split('\n').filter(Boolean);
    return lines.map((line) => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date: new Date(date), message };
    });
  }

  /**
   * Create branch (alias for branch method)
   */
  async createBranch(repoPath: string, input: GitBranchInput): Promise<void> {
    await this.branch(repoPath, input);
  }

  /**
   * Get diff
   */
  async diff(repoPath: string, files?: string[], staged = false): Promise<string> {
    let command = staged ? 'diff --cached' : 'diff';

    if (files && files.length > 0) {
      const fileList = files.map(f => `"${f.replace(/"/g, '\\"')}"`).join(' ');
      command += ` ${fileList}`;
    }

    return this.execGit(repoPath, command);
  }

  /**
   * Pull changes
   */
  async pull(repoPath: string): Promise<string> {
    return this.execGit(repoPath, 'pull');
  }

  /**
   * Push changes
   */
  async push(repoPath: string, force = false): Promise<string> {
    const command = force ? 'push --force' : 'push';
    return this.execGit(repoPath, command);
  }

  /**
   * List branches
   */
  async listBranches(repoPath: string): Promise<any[]> {
    const result = await this.execGit(repoPath, 'branch -a');
    const lines = result.split('\n').filter(Boolean);

    return lines.map((line) => ({
      name: line.replace(/^\*?\s+/, '').trim(),
      current: line.startsWith('*'),
      remote: line.includes('remotes/'),
    }));
  }
}
