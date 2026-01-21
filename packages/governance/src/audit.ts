import { db } from '@gpto/database';
import { auditLog } from '@gpto/database/src/schema';
import { eq, gte, desc } from 'drizzle-orm';

/**
 * Audit logging system
 */

export interface AuditEvent {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  await db.insert(auditLog).values({
    userId: event.userId,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details || null,
    ipAddress: event.ipAddress || null,
    userAgent: event.userAgent || null,
  });
}

/**
 * Get audit log entries
 */
export async function getAuditLog(
  filters?: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    since?: Date;
    limit?: number;
  }
) {
  let query = db.select().from(auditLog);

  if (filters?.userId) {
    query = query.where(eq(auditLog.userId, filters.userId)) as typeof query;
  }

  if (filters?.resourceType) {
    query = query.where(eq(auditLog.resourceType, filters.resourceType)) as typeof query;
  }

  if (filters?.since) {
    query = query.where(gte(auditLog.createdAt, filters.since)) as typeof query;
  }

  query = query.orderBy(desc(auditLog.createdAt)) as typeof query;

  if (filters?.limit) {
    query = query.limit(filters.limit) as typeof query;
  }

  return query;
}

/**
 * Export audit log for compliance
 */
export async function exportAuditLog(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const entries = await db
    .select()
    .from(auditLog)
    .where(gte(auditLog.createdAt, startDate))
    .where(eq(auditLog.createdAt, endDate))
    .orderBy(auditLog.createdAt);

  if (format === 'csv') {
    const headers = ['timestamp', 'user_id', 'action', 'resource_type', 'resource_id', 'ip_address'];
    const rows = entries.map((e) => [
      e.createdAt.toISOString(),
      e.userId || '',
      e.action,
      e.resourceType,
      e.resourceId || '',
      e.ipAddress || '',
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  return JSON.stringify(entries, null, 2);
}
