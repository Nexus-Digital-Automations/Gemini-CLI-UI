import validator from 'validator';
import path from 'path';
import { z } from 'zod';

/**
 * Path validation schema with normalization
 */
export const PathSchema = z
  .string()
  .min(1, 'Path cannot be empty')
  .refine((p) => !p.includes('\0'), 'Path cannot contain null bytes')
  .transform((p) => path.normalize(p))
  .refine((p) => path.isAbsolute(p), 'Path must be absolute');

/**
 * Git commit message validation schema
 */
export const GitCommitMessageSchema = z
  .string()
  .min(1, 'Commit message cannot be empty')
  .max(1000, 'Commit message too long')
  .transform((msg) =>
    msg
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .replace(/[`$(){}[\]|&;<>]/g, '') // Remove shell metacharacters
      .trim()
  );

/**
 * Git branch name validation schema
 */
export const GitBranchNameSchema = z
  .string()
  .min(1, 'Branch name cannot be empty')
  .max(255, 'Branch name too long')
  .regex(/^[a-zA-Z0-9_\-./]+$/, 'Invalid branch name characters')
  .transform((branch) =>
    branch
      .replace(/\.\.+/g, '.') // Collapse multiple dots
      .replace(/^[./]|[./]$/g, '') // Remove leading/trailing dots/slashes
  );

/**
 * Filename validation schema
 */
export const FilenameSchema = z
  .string()
  .min(1, 'Filename cannot be empty')
  .max(255, 'Filename too long')
  .transform((name) =>
    name
      .replace(/[\/\\]/g, '') // Remove path separators
      .replace(/[^\w\s.-]/g, '_') // Replace special chars with underscore
  );

/**
 * URL validation function
 */
export function validateUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  });
}

/**
 * Email validation function
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

/**
 * Safe path resolver with whitelist check
 * @param requestedPath - The path to validate
 * @param allowedRoots - Array of allowed root directories
 * @throws Error if path is outside allowed roots or invalid
 */
export async function validateAndResolvePath(
  requestedPath: string,
  allowedRoots: string[]
): Promise<string> {
  // Validate and normalize path
  const parsed = PathSchema.parse(requestedPath);

  // Check against allowed roots
  const isAllowed = allowedRoots.some((root) => {
    const relative = path.relative(root, parsed);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  });

  if (!isAllowed) {
    throw new Error('Access denied: Path outside allowed directories');
  }

  return parsed;
}

/**
 * Sanitize user input for display
 * Prevents XSS by escaping HTML
 */
export function sanitizeHtml(input: string): string {
  return validator.escape(input);
}

/**
 * Validate and sanitize username
 */
export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .transform((username) => username.toLowerCase().trim());

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 100) {
    errors.push('Password is too long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
