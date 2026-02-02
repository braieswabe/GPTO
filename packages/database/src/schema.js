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
    eventType: varchar('event_type', { length: 50 }).notNull().default('custom'),
    sessionId: uuid('session_id'),
    page: jsonb('page'),
    search: jsonb('search'),
    context: jsonb('context'),
    metrics: jsonb('metrics').notNull(),
    edges: jsonb('edges'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Content inventory table (crawler-based coverage)
export const contentInventory = pgTable('content_inventory', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    url: varchar('url', { length: 1024 }).notNull(),
    path: varchar('path', { length: 500 }),
    title: text('title'),
    intent: varchar('intent', { length: 100 }),
    funnelStage: varchar('funnel_stage', { length: 100 }),
    hash: text('hash'),
    metadata: jsonb('metadata'),
    lastSeen: timestamp('last_seen').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Coverage signals table
export const coverageSignals = pgTable('coverage_signals', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    windowStart: timestamp('window_start').notNull(),
    windowEnd: timestamp('window_end').notNull(),
    missingIntents: jsonb('missing_intents'),
    missingStages: jsonb('missing_stages'),
    gaps: jsonb('gaps'),
    confidence: integer('confidence').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Confusion signals table
export const confusionSignals = pgTable('confusion_signals', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    windowStart: timestamp('window_start').notNull(),
    windowEnd: timestamp('window_end').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    score: integer('score').notNull().default(0),
    evidence: jsonb('evidence'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Authority signals table
export const authoritySignals = pgTable('authority_signals', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    windowStart: timestamp('window_start').notNull(),
    windowEnd: timestamp('window_end').notNull(),
    authorityScore: integer('authority_score').notNull().default(0),
    trustSignals: jsonb('trust_signals'),
    blockers: jsonb('blockers'),
    confidence: integer('confidence').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Daily rollups for dashboard telemetry
export const dashboardRollupsDaily = pgTable('dashboard_rollups_daily', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    day: timestamp('day').notNull(),
    visits: integer('visits').notNull().default(0),
    pageViews: integer('page_views').notNull().default(0),
    searches: integer('searches').notNull().default(0),
    interactions: integer('interactions').notNull().default(0),
    topPages: jsonb('top_pages'),
    topIntents: jsonb('top_intents'),
    metrics: jsonb('metrics'),
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
// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    tier: varchar('tier', { length: 50 }).notNull(), // bronze|silver|gold
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('active'), // active|cancelled|past_due
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Audits table
export const audits = pgTable('audits', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    tier: varchar('tier', { length: 50 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // technical|content|competitor
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending|completed|failed
    results: jsonb('results'),
    recommendations: jsonb('recommendations'),
    scorecard: jsonb('scorecard'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
});
// Competitors table
export const competitors = pgTable('competitors', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    domain: varchar('domain', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    telemetryData: jsonb('telemetry_data'),
    sentimentData: jsonb('sentiment_data'),
    lastScrapedAt: timestamp('last_scraped_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Reports table
export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    auditId: uuid('audit_id').references(() => audits.id),
    type: varchar('type', { length: 50 }).notNull(), // pdf|email|scorecard
    format: jsonb('format'),
    fileUrl: varchar('file_url', { length: 500 }),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Panthera Canon plans table
export const pantheraCanonPlans = pgTable('panthera_canon_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    tier: varchar('tier', { length: 50 }).notNull(),
    planData: jsonb('plan_data').notNull(),
    optimizationType: varchar('optimization_type', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft|active|completed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const userSiteAccess = pgTable('user_site_access', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    siteId: uuid('site_id').references(() => sites.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
});
// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
    telemetryEvents: many(telemetryEvents),
    contentInventory: many(contentInventory),
    coverageSignals: many(coverageSignals),
    confusionSignals: many(confusionSignals),
    authoritySignals: many(authoritySignals),
    dashboardRollupsDaily: many(dashboardRollupsDaily),
    configVersions: many(configVersions),
    updateHistory: many(updateHistory),
    subscriptions: many(subscriptions),
    audits: many(audits),
    competitors: many(competitors),
    reports: many(reports),
    pantheraCanonPlans: many(pantheraCanonPlans),
    userSiteAccess: many(userSiteAccess),
}));
export const usersRelations = relations(users, ({ many }) => ({
    configVersions: many(configVersions),
    updateHistory: many(updateHistory),
    approvals: many(approvals),
    auditLogs: many(auditLog),
    sessions: many(securitySessions),
    siteAccess: many(userSiteAccess, {
        relationName: 'user_site_access',
    }),
    siteAccessCreated: many(userSiteAccess, {
        relationName: 'created_by_user',
    }),
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
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    site: one(sites, {
        fields: [subscriptions.siteId],
        references: [sites.id],
    }),
}));
export const auditsRelations = relations(audits, ({ one, many }) => ({
    site: one(sites, {
        fields: [audits.siteId],
        references: [sites.id],
    }),
    reports: many(reports),
}));
export const contentInventoryRelations = relations(contentInventory, ({ one }) => ({
    site: one(sites, {
        fields: [contentInventory.siteId],
        references: [sites.id],
    }),
}));
export const coverageSignalsRelations = relations(coverageSignals, ({ one }) => ({
    site: one(sites, {
        fields: [coverageSignals.siteId],
        references: [sites.id],
    }),
}));
export const confusionSignalsRelations = relations(confusionSignals, ({ one }) => ({
    site: one(sites, {
        fields: [confusionSignals.siteId],
        references: [sites.id],
    }),
}));
export const authoritySignalsRelations = relations(authoritySignals, ({ one }) => ({
    site: one(sites, {
        fields: [authoritySignals.siteId],
        references: [sites.id],
    }),
}));
export const dashboardRollupsDailyRelations = relations(dashboardRollupsDaily, ({ one }) => ({
    site: one(sites, {
        fields: [dashboardRollupsDaily.siteId],
        references: [sites.id],
    }),
}));
export const competitorsRelations = relations(competitors, ({ one }) => ({
    site: one(sites, {
        fields: [competitors.siteId],
        references: [sites.id],
    }),
}));
export const reportsRelations = relations(reports, ({ one }) => ({
    site: one(sites, {
        fields: [reports.siteId],
        references: [sites.id],
    }),
    audit: one(audits, {
        fields: [reports.auditId],
        references: [audits.id],
    }),
}));
export const pantheraCanonPlansRelations = relations(pantheraCanonPlans, ({ one }) => ({
    site: one(sites, {
        fields: [pantheraCanonPlans.siteId],
        references: [sites.id],
    }),
}));
export const userSiteAccessRelations = relations(userSiteAccess, ({ one }) => ({
    user: one(users, {
        fields: [userSiteAccess.userId],
        references: [users.id],
        relationName: 'user_site_access',
    }),
    site: one(sites, {
        fields: [userSiteAccess.siteId],
        references: [sites.id],
    }),
    creator: one(users, {
        fields: [userSiteAccess.createdBy],
        references: [users.id],
        relationName: 'created_by_user',
    }),
}));
//# sourceMappingURL=schema.js.map