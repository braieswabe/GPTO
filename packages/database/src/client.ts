import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database client using Neon PostgreSQL with connection pooling
 * Supports multiple environment variable formats:
 * - DATABASE_URL (Neon pooled connection - recommended)
 * - POSTGRES_URL (Vercel Postgres format)
 * - NEON_DATABASE_URL (Neon-specific)
 */
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

if (!connectionString) {
  throw new Error(
    'DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL environment variable is required'
  );
}

// Determine if we should use pooled or non-pooled connection
// Use non-pooled for migrations, pooled for regular queries
const usePooled =
  process.env.DATABASE_URL?.includes('-pooler') ||
  process.env.POSTGRES_URL?.includes('-pooler') ||
  process.env.NEON_DATABASE_URL?.includes('-pooler') ||
  !process.env.DATABASE_URL_UNPOOLED;

// For migrations, prefer non-pooled connection
const finalConnectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || connectionString;

// Create postgres client with connection pooling settings
const client = postgres(finalConnectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  ssl: 'require', // Always require SSL for Neon
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
