import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import path from 'path';
import { config } from '../config/index.js';

/**
 * Allowed MIME types for uploads
 */
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',

  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',

  // Code files
  'text/javascript',
  'text/html',
  'text/css',
  'application/json',
  'text/x-python',
  'text/x-typescript',
];

/**
 * Dangerous MIME types that should never be allowed
 */
const BLOCKED_MIME_TYPES = [
  'image/svg+xml', // Can contain XSS
  'text/html', // Can contain XSS
  'application/x-sh',
  'application/x-executable',
];

/**
 * Validate file upload using magic bytes
 * @param buffer - File buffer to validate
 * @param declaredMimeType - MIME type from request headers
 * @throws Error if file is invalid or dangerous
 */
export async function validateFileUpload(
  buffer: Buffer,
  declaredMimeType: string
): Promise<void> {
  // Check file size
  if (buffer.length > config.MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size is ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Check if declared MIME type is allowed
  if (BLOCKED_MIME_TYPES.includes(declaredMimeType)) {
    throw new Error('File type not allowed');
  }

  // Verify actual file type using magic bytes
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    // For text files, magic bytes detection may fail
    // Only allow if declared MIME type is text-based
    if (!declaredMimeType.startsWith('text/')) {
      throw new Error('Cannot determine file type');
    }
    return;
  }

  // Verify that declared MIME type matches actual type
  if (fileType.mime !== declaredMimeType) {
    throw new Error(
      `File type mismatch. Declared: ${declaredMimeType}, Actual: ${fileType.mime}`
    );
  }

  // Check if actual MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    throw new Error(`File type ${fileType.mime} not allowed`);
  }
}

/**
 * Sanitize filename to prevent path traversal
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);

  // Remove or replace dangerous characters
  return basename
    .replace(/[^\w\s.-]/g, '_') // Replace special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .toLowerCase();
}

/**
 * Validate and optimize image upload
 * @param buffer - Image buffer
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Optimized image buffer
 */
export async function validateAndOptimizeImage(
  buffer: Buffer,
  maxWidth = 2048,
  maxHeight = 2048
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image');
    }

    // Check if resizing is needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      return await image
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    }

    return buffer;
  } catch (error) {
    throw new Error(
      `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate safe upload path
 * @param originalFilename - Original filename
 * @param uploadDir - Base upload directory
 * @returns Absolute path for file upload
 */
export function generateUploadPath(
  originalFilename: string,
  uploadDir: string = config.UPLOAD_DIR
): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const filename = `${timestamp}-${randomString}-${sanitized}`;

  return path.join(uploadDir, filename);
}
