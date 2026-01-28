import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
/**
 * Database client using Neon PostgreSQL with connection pooling
 * Supports multiple environment variable formats:
 * - DATABASE_URL (Neon pooled connection - recommended)
 * - POSTGRES_URL (Vercel Postgres format)
 * - NEON_DATABASE_URL (Neon-specific)
 *
 * Uses lazy initialization to avoid errors on import when env vars aren't set
 */
let client = null;
let dbInstance = null;
function getConnectionString() {
    const connectionString = process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.NEON_DATABASE_URL ||
        '';
    if (!connectionString) {
        throw new Error('DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL environment variable is required');
    }
    return connectionString;
}
function getClient() {
    if (!client) {
        const connectionString = getConnectionString();
        // Create postgres client with connection pooling settings
        client = postgres(connectionString, {
            max: 10, // Maximum number of connections
            idle_timeout: 20, // Close idle connections after 20 seconds
            connect_timeout: 10, // Connection timeout in seconds
            ssl: 'require', // Always require SSL for Neon
        });
    }
    return client;
}
function getDb() {
    if (!dbInstance) {
        dbInstance = drizzle(getClient(), { schema });
    }
    return dbInstance;
}
// Export lazy-initialized database instance
export const db = new Proxy({}, {
    get(_target, prop) {
        return getDb()[prop];
    },
});
//# sourceMappingURL=client.js.map