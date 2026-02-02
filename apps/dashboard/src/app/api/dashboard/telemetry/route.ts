import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, dashboardRollupsDaily, sites } from '@gpto/database/src/schema';
import { and, gte, inArray, lte, eq } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

interface DailySeries {
  date: string;
  visits: number;
  pageViews: number;
  searches: number;
  interactions: number;
}

function coerceNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readAggregatedCounts(value: Record<string, unknown> | null) {
  if (!value) return null;
  const pageViews = coerceNumber(value.pageViews);
  const interactions = coerceNumber(value.interactions);
  const searches = coerceNumber(value.searches);
  if (pageViews === null && interactions === null && searches === null) return null;
  return {
    pageViews: pageViews ?? 0,
    interactions: interactions ?? 0,
    searches: searches ?? 0,
  };
}

function buildDailyKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeTrend(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 1 : 0;
  }
  return (current - previous) / previous;
}

/**
 * Normalize URL to use configured site domain instead of deployment URL
 * Extracts path from URL and combines with configured domain
 */
function normalizeUrl(url: string, configuredDomain: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    // Use configured domain, default to https
    const protocol = urlObj.protocol || 'https:';
    return `${protocol}//${configuredDomain}${path}`;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/\/\/[^\/]+(\/.*)?$/);
    const path = match ? match[1] || '/' : '/';
    return `https://${configuredDomain}${path}`;
  }
}

async function persistDailyRollups(
  siteId: string,
  series: DailySeries[],
  topPages: Array<{ url: string; count: number }>,
  topIntents: Array<{ intent: string; count: number }>
) {
  for (const day of series) {
    await db
      .delete(dashboardRollupsDaily)
      .where(and(eq(dashboardRollupsDaily.siteId, siteId), eq(dashboardRollupsDaily.day, new Date(day.date))));

    await db.insert(dashboardRollupsDaily).values({
      siteId,
      day: new Date(day.date),
      visits: day.visits,
      pageViews: day.pageViews,
      searches: day.searches,
      interactions: day.interactions,
      topPages,
      topIntents,
      metrics: null,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const siteId = searchParams.get('siteId');
    const refresh = searchParams.get('refresh') === 'true';
    const { start, end, rangeKey } = parseDateRange(searchParams);

    const siteIds = await getSiteIds(request, siteId);

    if (siteIds.length === 0) {
      return NextResponse.json({
        range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
        totals: { visits: 0, pageViews: 0, searches: 0, interactions: 0 },
        trend: { visits: 0, pageViews: 0, searches: 0, interactions: 0 },
        series: [],
        topPages: [],
        topIntents: [],
      });
    }

    // Get site domains for URL normalization
    const siteDomains = await db
      .select({ id: sites.id, domain: sites.domain })
      .from(sites)
      .where(inArray(sites.id, siteIds));
    
    const siteDomainMap = new Map(siteDomains.map(s => [s.id, s.domain]));

    const events = await db
      .select({
        siteId: telemetryEvents.siteId,
        timestamp: telemetryEvents.timestamp,
        eventType: telemetryEvents.eventType,
        sessionId: telemetryEvents.sessionId,
        page: telemetryEvents.page,
        context: telemetryEvents.context,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      );

    const rangeMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - rangeMs);
    const prevEnd = new Date(start.getTime());

    const previousEvents = await db
      .select({
        timestamp: telemetryEvents.timestamp,
        eventType: telemetryEvents.eventType,
        sessionId: telemetryEvents.sessionId,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, prevStart),
          lte(telemetryEvents.timestamp, prevEnd)
        )
      );

    const seriesMap = new Map<string, DailySeries>();
    const sessionByDay = new Map<string, Set<string>>();
    const pageCounts = new Map<string, number>();
    const intentCounts = new Map<string, number>();
    const hasPeriodicByDay = new Set<string>();

    let totals = { visits: 0, pageViews: 0, searches: 0, interactions: 0 };

    for (const event of events) {
      const timestamp = event.timestamp as Date;
      const dayKey = buildDailyKey(timestamp);
      const current = seriesMap.get(dayKey) || {
        date: dayKey,
        visits: 0,
        pageViews: 0,
        searches: 0,
        interactions: 0,
      };

      const eventType = event.eventType || 'custom';
      const context = (event.context as Record<string, unknown> | null) || null;
      const isPeriodic = context?.periodic === true;
      const isHeartbeat = context?.heartbeat === true;
      const periodicAggregated = readAggregatedCounts(
        isPeriodic && eventType === 'custom'
          ? ((context?.aggregated as Record<string, unknown>) || null)
          : null
      );
      const heartbeatAggregated = readAggregatedCounts(
        isHeartbeat
          ? {
              pageViews: context?.aggregatedPageViews,
              interactions: context?.aggregatedInteractions,
              searches: context?.aggregatedSearches,
            }
          : null
      );
      const effectiveAggregated = periodicAggregated || heartbeatAggregated;

      if (effectiveAggregated) {
        current.pageViews += effectiveAggregated.pageViews;
        current.interactions += effectiveAggregated.interactions;
        current.searches += effectiveAggregated.searches;
        totals.pageViews += effectiveAggregated.pageViews;
        totals.interactions += effectiveAggregated.interactions;
        totals.searches += effectiveAggregated.searches;
        hasPeriodicByDay.add(dayKey);
      } else if (!hasPeriodicByDay.has(dayKey)) {
        if (eventType === 'page_view') {
          current.pageViews += 1;
          totals.pageViews += 1;
        } else if (eventType === 'search') {
          current.searches += 1;
          totals.searches += 1;
        } else if (eventType === 'interaction') {
          current.interactions += 1;
          totals.interactions += 1;
        }
      }

      const sessionId = event.sessionId ? String(event.sessionId) : undefined;
      if (sessionId) {
        const set = sessionByDay.get(dayKey) || new Set<string>();
        set.add(sessionId);
        sessionByDay.set(dayKey, set);
      }

      const page = (event.page as Record<string, unknown> | null) || null;
      const rawUrl = (page?.url as string | undefined) || (context?.url as string | undefined);
      if (rawUrl) {
        // Normalize URL to use configured site domain instead of deployment URL
        const configuredDomain = siteDomainMap.get(event.siteId);
        const normalizedUrl = configuredDomain 
          ? normalizeUrl(rawUrl, configuredDomain)
          : rawUrl;
        
        if (effectiveAggregated?.pageViews) {
          pageCounts.set(normalizedUrl, (pageCounts.get(normalizedUrl) || 0) + effectiveAggregated.pageViews);
        } else if (!hasPeriodicByDay.has(dayKey) && eventType === 'page_view') {
          pageCounts.set(normalizedUrl, (pageCounts.get(normalizedUrl) || 0) + 1);
        }
      }

      const intent = context?.intent as string | undefined;
      if (intent) {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      }

      seriesMap.set(dayKey, current);
    }

    for (const [dayKey, sessions] of sessionByDay.entries()) {
      const current = seriesMap.get(dayKey);
      if (!current) continue;
      current.visits = sessions.size;
      totals.visits += sessions.size;
    }

    if (totals.visits === 0 && totals.pageViews > 0) {
      totals.visits = totals.pageViews;
      for (const current of seriesMap.values()) {
        current.visits = current.pageViews;
      }
    }

    const series = Array.from(seriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }));

    const topIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));

    const previousTotals = previousEvents.reduce(
      (acc, event) => {
        const eventType = event.eventType || 'custom';
        if (eventType === 'page_view') acc.pageViews += 1;
        if (eventType === 'search') acc.searches += 1;
        if (eventType === 'interaction') acc.interactions += 1;
        if (event.sessionId) acc.sessions.add(String(event.sessionId));
        return acc;
      },
      { pageViews: 0, searches: 0, interactions: 0, sessions: new Set<string>() }
    );

    const previousVisits = previousTotals.sessions.size || previousTotals.pageViews;

    const trend = {
      visits: computeTrend(totals.visits, previousVisits),
      pageViews: computeTrend(totals.pageViews, previousTotals.pageViews),
      searches: computeTrend(totals.searches, previousTotals.searches),
      interactions: computeTrend(totals.interactions, previousTotals.interactions),
    };

    if (refresh && siteId && series.length > 0) {
      await persistDailyRollups(siteId, series, topPages, topIntents);
    }

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      totals,
      trend,
      series,
      topPages,
      topIntents,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching telemetry dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry dashboard data' }, { status: 500 });
  }
}
