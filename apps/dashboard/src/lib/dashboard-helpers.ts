import { NextRequest } from 'next/server';
import { db } from '@gpto/database';
import { sites } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { eq } from 'drizzle-orm';

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
  const token = extractToken(authHeader ?? undefined);
  if (!token) {
    throw new AuthenticationError();
  }
  verifyToken(token);
}

export async function getSiteIds(request: NextRequest, siteId?: string | null) {
  await requireAuth(request);

  if (siteId) {
    return [siteId];
  }

  const allSites = await db.select({ id: sites.id }).from(sites);
  return allSites.map((site) => site.id);
}

export async function getSites(request: NextRequest, siteId?: string | null) {
  await requireAuth(request);

  if (siteId) {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    return site ? [site] : [];
  }

  return db.select().from(sites);
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
