import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define users table schema inline (to avoid workspace import issues)
const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('viewer'),
  tenantId: uuid('tenant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Password hashing utilities (inline to avoid workspace import issues)
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Seed a default user for development/testing
 * Usage: pnpm tsx scripts/seed-user.ts
 * Or: pnpm db:seed
 */
async function seedUser() {
  console.log('🌱 Seeding default user...');

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
    console.error('  - DATABASE_URL_UNPOOLED (recommended)');
    console.error('  - DATABASE_URL');
    console.error('  - POSTGRES_URL');
    console.error('  - NEON_DATABASE_URL');
    process.exit(1);
  }

  const defaultEmail = process.env.DEFAULT_USER_EMAIL || 'admin@gpto.com';
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'admin123';
  const defaultRole = process.env.DEFAULT_USER_ROLE || 'admin';

  try {
    console.log('📦 Connecting to database...');
    
    // Create database connection
    const client = postgres(connectionString, {
      max: 1,
      ssl: 'require',
    });

    const db = drizzle(client);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, defaultEmail))
      .limit(1);

    if (existingUser) {
      console.log(`✅ User with email "${defaultEmail}" already exists`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log('');
      console.log('💡 To create a new user, use a different email or delete the existing user first.');
      await client.end();
      process.exit(0);
    }

    // Create new user
    const passwordHash = hashPassword(defaultPassword);
    
    const [newUser] = await db
      .insert(users)
      .values({
        email: defaultEmail,
        passwordHash,
        role: defaultRole,
      })
      .returning();

    console.log('✅ Default user created successfully!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   User ID: ${newUser.id}`);
    console.log('');
    console.log('⚠️  Remember to change the default password in production!');
    console.log('💡 Set DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD, and DEFAULT_USER_ROLE in .env to customize');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

seedUser();
