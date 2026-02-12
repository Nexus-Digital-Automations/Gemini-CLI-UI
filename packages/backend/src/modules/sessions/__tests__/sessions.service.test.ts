import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionsService } from '../sessions.service.js';
import { db } from '../../../db/index.js';
import { users, projects, sessions, chatMessages } from '../../../db/schema.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

describe('SessionsService', () => {
  let sessionsService: SessionsService;
  let testUserId: string;
  let testProjectId: string;
  let testProjectPath: string;

  beforeEach(async () => {
    sessionsService = new SessionsService();

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        username: 'testuser',
        passwordHash: 'hashedpassword',
      })
      .returning();
    testUserId = user.id;

    // Create test project path
    testProjectPath = path.join(os.tmpdir(), `test-session-project-${Date.now()}`);
    await fs.mkdir(testProjectPath, { recursive: true });

    // Create test project
    const [project] = await db
      .insert(projects)
      .values({
        userId: testUserId,
        name: 'Test Project',
        path: testProjectPath,
      })
      .returning();
    testProjectId = project.id;
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const input = {
        projectPath: testProjectPath,
      };

      const result = await sessionsService.create(testUserId, input);

      expect(result.userId).toBe(testUserId);
      expect(result.projectPath).toBe(testProjectPath);
      expect(result.id).toBeDefined();
      expect(result.geminiSessionId).toBeNull();
    });

    it('should create session with Gemini session ID', async () => {
      const input = {
        projectPath: testProjectPath,
        geminiSessionId: 'gemini-session-123',
      };

      const result = await sessionsService.create(testUserId, input);

      expect(result.geminiSessionId).toBe('gemini-session-123');
    });

    it('should create session with metadata', async () => {
      const input = {
        projectPath: testProjectPath,
        metadata: { model: 'gemini-pro', temperature: 0.7 },
      };

      const result = await sessionsService.create(testUserId, input);

      expect(result.metadata).toEqual({ model: 'gemini-pro', temperature: 0.7 });
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
    });

    it('should return all sessions for user', async () => {
      const result = await sessionsService.findAll(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(testUserId);
      expect(result[1].userId).toBe(testUserId);
    });

    it('should order sessions by last accessed descending', async () => {
      const result = await sessionsService.findAll(testUserId);

      const timestamps = result.map((s) => s.lastAccessedAt.getTime());
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
    });

    it('should not return other users sessions', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await sessionsService.findAll(otherUser.id);

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      sessionId = session.id;
    });

    it('should return session by id', async () => {
      const result = await sessionsService.findById(testUserId, sessionId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(sessionId);
    });

    it('should return null for non-existent session', async () => {
      const result = await sessionsService.findById(testUserId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return other users session', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await sessionsService.findById(otherUser.id, sessionId);

      expect(result).toBeNull();
    });
  });

  describe('findWithMessages', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      sessionId = session.id;

      // Add test messages
      await db.insert(chatMessages).values({
        sessionId,
        role: 'user',
        content: 'Hello',
      });
      await db.insert(chatMessages).values({
        sessionId,
        role: 'assistant',
        content: 'Hi there',
      });
    });

    it('should return session with messages', async () => {
      const result = await sessionsService.findWithMessages(testUserId, sessionId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(sessionId);
      expect(result?.messages).toHaveLength(2);
      expect(result?.messages[0].role).toBe('user');
      expect(result?.messages[1].role).toBe('assistant');
    });

    it('should return empty messages array for session without messages', async () => {
      const newSession = await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });

      const result = await sessionsService.findWithMessages(testUserId, newSession.id);

      expect(result?.messages).toHaveLength(0);
    });
  });

  describe('addMessage', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      sessionId = session.id;
    });

    it('should add message to session', async () => {
      const input = {
        role: 'user' as const,
        content: 'Test message',
      };

      const result = await sessionsService.addMessage(testUserId, sessionId, input);

      expect(result.sessionId).toBe(sessionId);
      expect(result.role).toBe('user');
      expect(result.content).toBe('Test message');
    });

    it('should add message with metadata', async () => {
      const input = {
        role: 'user' as const,
        content: 'Test message',
        metadata: { tokens: 10 },
      };

      const result = await sessionsService.addMessage(testUserId, sessionId, input);

      expect(result.metadata).toEqual({ tokens: 10 });
    });

    it('should throw for non-existent session', async () => {
      const input = {
        role: 'user' as const,
        content: 'Test message',
      };

      await expect(
        sessionsService.addMessage(testUserId, 'non-existent-id', input)
      ).rejects.toThrow();
    });

    it('should maintain message order', async () => {
      await sessionsService.addMessage(testUserId, sessionId, {
        role: 'user',
        content: 'First',
      });
      await sessionsService.addMessage(testUserId, sessionId, {
        role: 'assistant',
        content: 'Second',
      });

      const result = await sessionsService.findWithMessages(testUserId, sessionId);

      expect(result?.messages[0].content).toBe('First');
      expect(result?.messages[1].content).toBe('Second');
    });
  });

  describe('delete', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      sessionId = session.id;

      await db.insert(chatMessages).values({
        sessionId,
        role: 'user',
        content: 'Test message',
      });
    });

    it('should delete session and cascade messages', async () => {
      const result = await sessionsService.delete(testUserId, sessionId);

      expect(result).toBe(true);

      const session = await sessionsService.findById(testUserId, sessionId);
      expect(session).toBeNull();

      const messages = await db
        .select()
        .from(chatMessages)
        .where((fields) => fields.sessionId === sessionId);
      expect(messages).toHaveLength(0);
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionsService.delete(testUserId, 'non-existent-id');

      expect(result).toBe(false);
    });

    it('should not delete other users session', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          username: 'otheruser',
          passwordHash: 'hashedpassword',
        })
        .returning();

      const result = await sessionsService.delete(otherUser.id, sessionId);

      expect(result).toBe(false);

      // Verify session still exists
      const session = await sessionsService.findById(testUserId, sessionId);
      expect(session).toBeDefined();
    });
  });

  describe('findByProject', () => {
    beforeEach(async () => {
      await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });
      await sessionsService.create(testUserId, {
        projectPath: testProjectPath,
      });

      // Create session for different path
      const otherPath = path.join(os.tmpdir(), 'other-path');
      await sessionsService.create(testUserId, {
        projectPath: otherPath,
      });
    });

    it('should return sessions for specific project path', async () => {
      const result = await sessionsService.findByProject(testUserId, testProjectPath);

      expect(result).toHaveLength(2);
      expect(result[0].projectPath).toBe(testProjectPath);
      expect(result[1].projectPath).toBe(testProjectPath);
    });

    it('should return empty array for path with no sessions', async () => {
      const result = await sessionsService.findByProject(testUserId, '/non/existent/path');

      expect(result).toHaveLength(0);
    });
  });
});
