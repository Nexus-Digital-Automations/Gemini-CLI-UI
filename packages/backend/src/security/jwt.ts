import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TokenPayload } from '@gemini-ui/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET_PATH = path.join(__dirname, '../../.jwt-secret');

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

/**
 * Generate a cryptographically secure secret
 */
function generateSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Load or generate JWT secret
 */
function loadOrGenerateSecret(): string {
  // 1. Try environment variable (production)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 64) {
    return process.env.JWT_SECRET;
  }

  // 2. Try stored secret file (development)
  if (fs.existsSync(JWT_SECRET_PATH)) {
    const secret = fs.readFileSync(JWT_SECRET_PATH, 'utf8').trim();
    if (secret.length >= 64) {
      return secret;
    }
  }

  // 3. Generate new secret (first run)
  console.warn(
    '⚠️  Generating new JWT secret. Set JWT_SECRET in .env for production.'
  );
  const secret = generateSecret();
  fs.writeFileSync(JWT_SECRET_PATH, secret, { mode: 0o600 });
  return secret;
}

/**
 * JWT secret (128 characters minimum)
 */
export const JWT_SECRET = loadOrGenerateSecret();

/**
 * Token generation options
 */
interface TokenOptions {
  userId: string;
  username: string;
  type: 'access' | 'refresh';
}

/**
 * Generate access token (7 days)
 */
export function generateAccessToken(
  options: Omit<TokenOptions, 'type'>
): string {
  return jwt.sign(
    {
      userId: options.userId,
      username: options.username,
      type: 'access' as const,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (30 days)
 */
export function generateRefreshToken(
  options: Omit<TokenOptions, 'type'>
): string {
  return jwt.sign(
    {
      userId: options.userId,
      type: 'refresh' as const,
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode JWT token
 * @throws Error with specific message for expired or invalid tokens
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, username: string) {
  return {
    accessToken: generateAccessToken({ userId, username }),
    refreshToken: generateRefreshToken({ userId, username }),
  };
}

/**
 * Decode token without verification (use for debugging only)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
