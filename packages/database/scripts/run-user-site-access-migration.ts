import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runMigration() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    console.log('📦 Connecting to database...');
    const client = postgres(connectionString, {
      max: 1,
      ssl: 'require',
    });

    console.log('🔄 Running user_site_access migration...');
    
    // Read and execute the migration SQL
    const migrationPath = path.resolve(__dirname, '../migrations/0003_user_site_access.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the entire migration SQL file
    // The SQL file uses --> statement-breakpoint comments which psql ignores
    // We'll execute it as-is, removing only the comment markers for cleaner execution
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('-->'))
      .join('\n');

    await client.unsafe(cleanSQL);

    console.log('✅ Migration completed successfully');
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

runMigration();
