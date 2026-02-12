import { z } from 'zod';

/**
 * Login request schema with validation
 */
export const LoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
});

/**
 * Registration request schema with validation
 */
export const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
});

/**
 * JWT token payload schema
 */
export const TokenPayloadSchema = z.object({
  userId: z.string().min(1),
  username: z.string(),
  type: z.enum(['access', 'refresh']),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

/**
 * Authentication response interface
 */
export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
  };
}

/**
 * User object returned from API
 */
export interface User {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
