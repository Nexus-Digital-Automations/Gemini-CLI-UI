import { z } from 'zod';

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Session creation schema
 */
export const CreateSessionSchema = z.object({
  projectPath: z.string().min(1),
  geminiSessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Inferred types
 */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

/**
 * Session interface
 */
export interface Session {
  id: string;
  userId: string;
  projectPath: string;
  geminiSessionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  lastAccessedAt: Date;
}

/**
 * Session with messages
 */
export interface SessionWithMessages extends Session {
  messages: ChatMessage[];
}
