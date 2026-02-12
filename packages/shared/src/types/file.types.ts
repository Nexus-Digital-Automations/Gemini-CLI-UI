import { z } from 'zod';

/**
 * File read schema
 */
export const ReadFileSchema = z.object({
  path: z.string().min(1),
  encoding: z.enum(['utf8', 'binary', 'base64']).default('utf8'),
});

/**
 * File write schema
 */
export const WriteFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  encoding: z.enum(['utf8', 'base64']).default('utf8'),
});

/**
 * File upload schema
 */
export const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

/**
 * Inferred types
 */
export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type WriteFileInput = z.infer<typeof WriteFileSchema>;
export type FileUploadInput = z.infer<typeof FileUploadSchema>;

/**
 * File metadata interface
 */
export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Directory listing interface
 */
export interface DirectoryListing {
  path: string;
  files: FileMetadata[];
}
