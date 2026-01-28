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

  // Load environment variables (check in priority order)
  let connectionString = '';
  let usedVariable = '';
  
  if (process.env.DATABASE_URL_UNPOOLED) {
    connectionString = process.env.DATABASE_URL_UNPOOLED;
    usedVariable = 'DATABASE_URL_UNPOOLED';
  } else if (process.env.POSTGRES_URL_NON_POOLING) {
    connectionString = process.env.POSTGRES_URL_NON_POOLING;
    usedVariable = 'POSTGRES_URL_NON_POOLING';
  } else if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
    usedVariable = 'DATABASE_URL';
  } else if (process.env.POSTGRES_URL) {
    connectionString = process.env.POSTGRES_URL;
    usedVariable = 'POSTGRES_URL';
  } else if (process.env.NEON_DATABASE_URL) {
    connectionString = process.env.NEON_DATABASE_URL;
    usedVariable = 'NEON_DATABASE_URL';
  }

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
    console.error('  DATABASE_URL_UNPOOLED=postgresql://user:password@host:port/database');
    console.error('');
    console.error('See ENV_SETUP.md for details.');
    process.exit(1);
  }

  // Validate connection string format
  if (
    connectionString.includes('your-production-db-url') ||
    connectionString.includes('postgresql://...') ||
    connectionString.includes('example.com') ||
    (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://'))
  ) {
    console.error('❌ Error: Invalid database URL format');
    console.error('');
    console.error(`The ${usedVariable} environment variable appears to be a placeholder value.`);
    console.error(`Current value: ${connectionString.substring(0, 80)}...`);
    console.error('');
    console.error('This variable is set in your environment and overriding the .env file.');
    console.error('');
    console.error('To fix this:');
    console.error(`  1. Unset the variable: unset ${usedVariable}`);
    console.error('  2. Or set it to a valid connection string');
    console.error('');
    console.error('Example for Neon (non-pooled connection):');
    console.error('  DATABASE_URL_UNPOOLED=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require');
    console.error('');
    console.error('Note: For Neon, use the non-pooled connection string (without "-pooler" in the hostname)');
    console.error('      for migrations to avoid connection pool issues.');
    console.error('');
    process.exit(1);
  }

  console.log(`📋 Using ${usedVariable} for database connection`);

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
