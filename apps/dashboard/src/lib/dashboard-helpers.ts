import { NextRequest } from 'next/server';
import { db } from '@gpto/database';
import { sites, userSiteAccess, users } from '@gpto/database/src/schema';
import { extractToken, verifyToken, JWTPayload } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { eq, or, inArray } from 'drizzle-orm';

export type TimeRangeKey = '7d' | '30d' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  rangeKey: TimeRangeKey;
}

export function parseDateRange(searchParams: URLSearchParams): DateRange {
  const range = (searchParams.get('range') as TimeRangeKey) || '30d';
  const now = new Date();
  let start = new Date(now);

  if (range === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    start.setDate(now.getDate() - 30);
  } else {
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (startParam) {
      start = new Date(startParam);
    } else {
      start.setDate(now.getDate() - 30);
    }
    if (endParam) {
      return { start, end: new Date(endParam), rangeKey: 'custom' };
    }
  }

  return { start, end: now, rangeKey: range };
}

export async function requireAuth(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return;
  }
  const token = extractToken(authHeader ?? undefined);
  if (!token) {
    throw new AuthenticationError();
  }
  try {
    verifyToken(token);
  } catch {
    throw new AuthenticationError();
  }
}

/**
 * Get accessible site IDs for the authenticated user based on their role
 */
async function getUserAccessibleSiteIds(userId: string, role: string, tenantId: string | null | undefined): Promise<string[]> {
  // Admin and operator can see all sites
  if (role === 'admin' || role === 'operator') {
    const allSites = await db.select({ id: sites.id }).from(sites);
    return allSites.map((site) => site.id);
  }

  // Client users can see sites they're assigned to OR sites matching their tenantId
  if (role === 'client') {
    const accessibleSites: string[] = [];

    // Get sites from user_site_access table
    const assignedSites = await db
      .select({ siteId: userSiteAccess.siteId })
      .from(userSiteAccess)
      .where(eq(userSiteAccess.userId, userId));
    
    accessibleSites.push(...assignedSites.map((a) => a.siteId));

    // Get sites matching tenantId if tenantId exists
    if (tenantId) {
      const tenantSites = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.tenantId, tenantId));
      
      accessibleSites.push(...tenantSites.map((s) => s.id));
    }

    // Remove duplicates
    return [...new Set(accessibleSites)];
  }

  // Viewer and other roles see all sites (default behavior)
  const allSites = await db.select({ id: sites.id }).from(sites);
  return allSites.map((site) => site.id);
}

export async function getSiteIds(request: NextRequest, siteId?: string | null) {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader ?? undefined);
  
  if (!token) {
    throw new AuthenticationError();
  }

  const payload = verifyToken(token);

  // If specific siteId requested, verify user has access
  if (siteId) {
    const accessibleSiteIds = await getUserAccessibleSiteIds(
      payload.userId,
      payload.role,
      payload.tenantId
    );
    
    if (!accessibleSiteIds.includes(siteId)) {
      throw new AuthenticationError('Access denied to this site');
    }
    
    return [siteId];
  }

  // Return all accessible sites for the user
  return getUserAccessibleSiteIds(payload.userId, payload.role, payload.tenantId);
}

export async function getSites(request: NextRequest, siteId?: string | null) {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader ?? undefined);
  
  if (!token) {
    throw new AuthenticationError();
  }

  const payload = verifyToken(token);
  const accessibleSiteIds = await getUserAccessibleSiteIds(
    payload.userId,
    payload.role,
    payload.tenantId
  );

  if (accessibleSiteIds.length === 0) {
    return [];
  }

  if (siteId) {
    if (!accessibleSiteIds.includes(siteId)) {
      throw new AuthenticationError('Access denied to this site');
    }
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    return site ? [site] : [];
  }

  return db.select().from(sites).where(inArray(sites.id, accessibleSiteIds));
}

/**
 * Parse a metric value from JSONB to number
 * JSONB numbers are stored as numbers, but Drizzle may return them as strings
 * This ensures we always get a number
 */
export function parseMetricValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Extract and parse metrics from telemetry events
 * Handles both number and string values from JSONB
 */
export function extractMetrics(
  events: Array<{ metrics: unknown }>,
  key: string
): number[] {
  return events
    .map((event) => {
      const metrics = event.metrics as Record<string, unknown> | null;
      if (!metrics) return null;
      return parseMetricValue(metrics[key]);
    })
    .filter((v): v is number => v !== null);
}
