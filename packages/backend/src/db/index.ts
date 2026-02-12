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
  const migrationsFolder = path.join(__dirname, 'migrations');

  // Create migrations folder if it doesn't exist
  if (!fs.existsSync(migrationsFolder)) {
    fs.mkdirSync(migrationsFolder, { recursive: true });
  }

  try {
    migrate(db, { migrationsFolder });
    console.log('✅ Database migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  sqlite.close();
  console.log('✅ Database connection closed');
}
