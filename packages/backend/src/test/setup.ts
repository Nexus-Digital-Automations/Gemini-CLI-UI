import { beforeAll, afterAll, afterEach } from 'vitest';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { users, projects, sessions, chatMessages, refreshTokens } from '../db/schema.js';

// Create all tables before running tests
beforeAll(async () => {
  // Users table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Projects table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_accessed_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Sessions table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_path TEXT NOT NULL,
      gemini_session_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      last_accessed_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Chat messages table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Refresh tokens table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      revoked_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// Clean up data after each test to prevent cross-test contamination
afterEach(async () => {
  try {
    // Delete in order to respect foreign key constraints
    await db.delete(chatMessages);
    await db.delete(sessions);
    await db.delete(refreshTokens);
    await db.delete(projects);
    await db.delete(users);
  } catch (error) {
    // Ignore errors during cleanup
    console.warn('Cleanup warning:', error);
  }
});
