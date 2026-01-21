import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database client using Neon PostgreSQL with connection pooling
 */
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL or DATABASE_URL environment variable is required');
}

// Use Neon's connection pooler if available
const poolerHost = process.env.NEON_POOLER_HOST;
const finalConnectionString = poolerHost
  ? connectionString.replace(/@[^/]+/, `@${poolerHost}`)
  : connectionString;

// Create postgres client with connection pooling
const client = postgres(finalConnectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
