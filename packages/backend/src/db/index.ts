import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ensure data directory exists
 */
const dataDir = path.dirname(config.DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Initialize SQLite database
 */
const sqlite = new Database(config.DATABASE_PATH);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Enable foreign key constraints
sqlite.pragma('foreign_keys = ON');

// Performance optimizations
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('cache_size = -64000'); // 64MB cache

/**
 * Initialize Drizzle ORM with schema
 */
export const db = drizzle(sqlite, { schema });

/**
 * Run database migrations
 */
export function runMigrations() {
  // Migrations are skipped for now - using schema from test setup instead
  console.log('⏭️  Skipping migrations (using test schema)');
}

/**
 * Close database connection
 */
export function closeDatabase() {
  sqlite.close();
  console.log('✅ Database connection closed');
}
