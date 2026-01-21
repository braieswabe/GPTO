import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
