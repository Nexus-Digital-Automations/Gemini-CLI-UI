/**
 * Manual migration runner
 * Usage: npm run db:migrate
 */
import { runMigrations, closeDatabase } from './index.js';

try {
  console.log('🔄 Running migrations...');
  runMigrations();
  console.log('✅ Migrations completed successfully');
  closeDatabase();
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  closeDatabase();
  process.exit(1);
}
