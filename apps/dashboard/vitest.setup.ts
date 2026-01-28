// Vitest setup file
// Mock environment variables if needed
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-secret';
