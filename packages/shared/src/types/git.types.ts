import { z } from 'zod';

/**
 * Git commit schema
 */
export const GitCommitSchema = z.object({
  message: z.string().min(1).max(1000),
  files: z.array(z.string()).optional(),
  all: z.boolean().default(false),
});

/**
 * Git branch schema
 */
export const GitBranchSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_\-./]+$/, 'Invalid branch name'),
  checkout: z.boolean().default(false),
});

/**
 * Inferred types
 */
export type GitCommitInput = z.infer<typeof GitCommitSchema>;
export type GitBranchInput = z.infer<typeof GitBranchSchema>;

/**
 * Git status interface
 */
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicted: string[];
}

/**
 * Git commit info interface
 */
export interface GitCommitInfo {
  hash: string;
  author: string;
  date: Date;
  message: string;
}

/**
 * Git branch info interface
 */
export interface GitBranchInfo {
  name: string;
  current: boolean;
  remote?: string;
}
