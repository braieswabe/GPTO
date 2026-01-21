import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Run database migrations
 * Uses non-pooled connection for migrations
 */
async function runMigrations() {
  console.log('Running migrations...');

  // Load environment variables
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    console.error('');
    console.error('Please set one of these environment variables:');
    console.error('  - DATABASE_URL_UNPOOLED (recommended for migrations)');
    console.error('  - DATABASE_URL');
    console.error('  - POSTGRES_URL');
    console.error('  - NEON_DATABASE_URL');
    console.error('');
    console.error('Create a .env file in the root directory with:');
    console.error('  DATABASE_URL_UNPOOLED=postgresql://...');
    console.error('');
    console.error('See ENV_SETUP.md for details.');
    process.exit(1);
  }

  try {
    console.log('📦 Connecting to database...');
    
    // Use non-pooled connection for migrations
    const client = postgres(connectionString, {
      max: 1, // Single connection for migrations
      ssl: 'require',
    });

    const db = drizzle(client);

    console.log('🔄 Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });

    console.log('✅ Migrations completed successfully');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

runMigrations();
