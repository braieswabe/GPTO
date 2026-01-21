import { pgTable, text, timestamp, jsonb, boolean, integer, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Database schema definitions using Drizzle ORM
 */

// Sites table
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  configUrl: varchar('config_url', { length: 500 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  tenantId: uuid('tenant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('viewer'),
  tenantId: uuid('tenant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Telemetry events table (append-only)
export const telemetryEvents = pgTable('telemetry_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id).notNull(),
  tenant: varchar('tenant', { length: 255 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  context: jsonb('context'),
  metrics: jsonb('metrics').notNull(),
  edges: jsonb('edges'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Config versions table
export const configVersions = pgTable('config_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  configJson: jsonb('config_json').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Update history table
export const updateHistory = pgTable('update_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id).notNull(),
  fromVersion: varchar('from_version', { length: 50 }).notNull(),
  toVersion: varchar('to_version', { length: 50 }).notNull(),
  diff: jsonb('diff'),
  signature: text('signature').notNull(),
  appliedAt: timestamp('applied_at'),
  rolledBackAt: timestamp('rolled_back_at'),
  userId: uuid('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Rollback points table
export const rollbackPoints = pgTable('rollback_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  updateId: uuid('update_id').references(() => updateHistory.id).notNull(),
  siteId: uuid('site_id').references(() => sites.id).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  configSnapshot: jsonb('config_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Approvals table
export const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  updateId: uuid('update_id').references(() => updateHistory.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // pending, approved, rejected
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit log table
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Security sessions table
export const securitySessions = pgTable('security_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fingerprint: text('fingerprint'),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  telemetryEvents: many(telemetryEvents),
  configVersions: many(configVersions),
  updateHistory: many(updateHistory),
}));

export const usersRelations = relations(users, ({ many }) => ({
  configVersions: many(configVersions),
  updateHistory: many(updateHistory),
  approvals: many(approvals),
  auditLogs: many(auditLog),
  sessions: many(securitySessions),
}));

export const configVersionsRelations = relations(configVersions, ({ one }) => ({
  site: one(sites, {
    fields: [configVersions.siteId],
    references: [sites.id],
  }),
  creator: one(users, {
    fields: [configVersions.createdBy],
    references: [users.id],
  }),
}));

export const updateHistoryRelations = relations(updateHistory, ({ one, many }) => ({
  site: one(sites, {
    fields: [updateHistory.siteId],
    references: [sites.id],
  }),
  user: one(users, {
    fields: [updateHistory.userId],
    references: [users.id],
  }),
  approvals: many(approvals),
  rollbackPoints: many(rollbackPoints),
}));
