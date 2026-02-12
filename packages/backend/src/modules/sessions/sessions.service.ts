import { db } from '../../db/index.js';
import { sessions, chatMessages } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type {
  CreateSessionInput,
  Session,
  ChatMessage,
  SessionWithMessages,
} from '@gemini-ui/shared';

/**
 * Sessions service layer
 */
export class SessionsService {
  /**
   * Create a new session
   */
  async create(userId: string, input: CreateSessionInput): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values({
        userId,
        projectPath: input.projectPath,
        geminiSessionId: input.geminiSessionId,
        metadata: input.metadata,
      })
      .returning();

    return newSession;
  }

  /**
   * Get all sessions for a user
   */
  async findAll(userId: string): Promise<Session[]> {
    return db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: [desc(sessions.lastAccessedAt)],
    });
  }

  /**
   * Get single session by ID
   */
  async findById(userId: string, sessionId: string): Promise<Session | null> {
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
    });

    if (!session) {
      return null;
    }

    // Update last accessed
    await db
      .update(sessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    return session;
  }

  /**
   * Get session with all messages
   */
  async findWithMessages(
    userId: string,
    sessionId: string
  ): Promise<SessionWithMessages | null> {
    const session = await this.findById(userId, sessionId);
    if (!session) {
      return null;
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: [chatMessages.createdAt],
    });

    return {
      ...session,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata,
      })),
    };
  }

  /**
   * Add message to session
   */
  async addMessage(
    userId: string,
    sessionId: string,
    message: { role: 'user' | 'assistant' | 'system'; content: string; metadata?: Record<string, unknown> }
  ): Promise<ChatMessage> {
    // Verify session ownership
    const session = await this.findById(userId, sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })
      .returning();

    return {
      role: newMessage.role,
      content: newMessage.content,
      timestamp: newMessage.createdAt,
      metadata: newMessage.metadata,
    };
  }

  /**
   * Delete session and all messages
   */
  async delete(userId: string, sessionId: string): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Get sessions by project path
   */
  async findByProject(userId: string, projectPath: string): Promise<Session[]> {
    return db.query.sessions.findMany({
      where: and(eq(sessions.userId, userId), eq(sessions.projectPath, projectPath)),
      orderBy: [desc(sessions.lastAccessedAt)],
    });
  }

  /**
   * Update session metadata
   */
  async updateMetadata(
    userId: string,
    sessionId: string,
    metadata: Record<string, unknown>
  ): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ metadata })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning();

    return updated || null;
  }
}
