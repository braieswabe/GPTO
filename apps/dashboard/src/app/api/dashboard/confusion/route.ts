import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, confusionSignals, contentInventory } from '@gpto/database/src/schema';
import { and, gte, inArray, lte } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

const DEAD_END_THRESHOLD_MS = 60_000;

function getConfidence(eventCount: number) {
  if (eventCount > 500) return { level: 'High', score: 85 };
  if (eventCount > 100) return { level: 'Medium', score: 60 };
  if (eventCount > 0) return { level: 'Low', score: 35 };
  return { level: 'Unknown', score: 0 };
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
        totals: { repeatedSearches: 0, deadEnds: 0, dropOffs: 0, intentMismatches: 0 },
        signals: { repeatedSearches: [], deadEnds: [], dropOffs: [], intentMismatches: [] },
        confidence: { level: 'Unknown', score: 0 },
      });
    }

    const events = await db
      .select({
        timestamp: telemetryEvents.timestamp,
        eventType: telemetryEvents.eventType,
        sessionId: telemetryEvents.sessionId,
        page: telemetryEvents.page,
        search: telemetryEvents.search,
        context: telemetryEvents.context,
        siteId: telemetryEvents.siteId,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      );

    const inventory = await db
      .select({
        siteId: contentInventory.siteId,
        url: contentInventory.url,
        intent: contentInventory.intent,
      })
      .from(contentInventory)
      .where(inArray(contentInventory.siteId, siteIds));

    const inventoryMap = new Map<string, string>();
    for (const item of inventory) {
      if (item.url && item.intent) {
        inventoryMap.set(item.url, item.intent);
      }
    }

    const sessions = new Map<string, typeof events>();
    for (const event of events) {
      const sessionId = event.sessionId ? String(event.sessionId) : undefined;
      if (!sessionId) continue;
      const list = sessions.get(sessionId) || [];
      list.push(event);
      sessions.set(sessionId, list);
    }

    const repeatedSearches: Array<{ query: string; count: number; sessionId: string }> = [];
    const deadEnds: Array<{ url: string; at: string; sessionId: string }> = [];
    const dropOffs: Array<{ sessionId: string; lastEvent: string }> = [];
    const intentMismatches: Array<{ url: string; intent: string; expected: string }> = [];

    for (const [sessionId, sessionEvents] of sessions.entries()) {
      const sorted = sessionEvents.slice().sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime());

      const searchCounts = new Map<string, number>();
      for (const event of sorted) {
        const eventType = event.eventType || 'custom';
        if (eventType === 'search') {
          const search = (event.search as Record<string, unknown> | null) || null;
          const context = (event.context as Record<string, unknown> | null) || null;
          const query = (search?.query as string | undefined) || (context?.search_query as string | undefined);
          if (query) {
            searchCounts.set(query, (searchCounts.get(query) || 0) + 1);
          }
        }
      }

      for (const [query, count] of searchCounts.entries()) {
        if (count > 1) {
          repeatedSearches.push({ query, count, sessionId });
        }
      }

      for (let i = 0; i < sorted.length; i += 1) {
        const event = sorted[i];
        if (event.eventType !== 'page_view') continue;
        const next = sorted[i + 1];
        const time = (event.timestamp as Date).getTime();
        const nextTime = next ? (next.timestamp as Date).getTime() : undefined;
        if (!nextTime || nextTime - time > DEAD_END_THRESHOLD_MS) {
          const page = (event.page as Record<string, unknown> | null) || null;
          const context = (event.context as Record<string, unknown> | null) || null;
          const url = (page?.url as string | undefined) || (context?.url as string | undefined) || 'unknown';
          deadEnds.push({ url, at: new Date(time).toISOString(), sessionId });
        }
      }

      const lastEvent = sorted[sorted.length - 1];
      if (sorted.length <= 2 && lastEvent?.eventType === 'page_view') {
        dropOffs.push({ sessionId, lastEvent: (lastEvent.timestamp as Date).toISOString() });
      }
    }

    for (const event of events) {
      const context = (event.context as Record<string, unknown> | null) || null;
      const intent = context?.intent as string | undefined;
      if (!intent) continue;
      const page = (event.page as Record<string, unknown> | null) || null;
      const url = (page?.url as string | undefined) || (context?.url as string | undefined);
      if (!url) continue;
      const expectedIntent = inventoryMap.get(url);
      if (expectedIntent && expectedIntent !== intent) {
        intentMismatches.push({ url, intent, expected: expectedIntent });
      }
    }

    const totals = {
      repeatedSearches: repeatedSearches.length,
      deadEnds: deadEnds.length,
      dropOffs: dropOffs.length,
      intentMismatches: intentMismatches.length,
    };

    const confidence = getConfidence(events.length);

    if (refresh && siteId) {
      await db.insert(confusionSignals).values({
        siteId,
        windowStart: start,
        windowEnd: end,
        type: 'repeated_search',
        score: totals.repeatedSearches,
        evidence: repeatedSearches.slice(0, 5),
      });
      await db.insert(confusionSignals).values({
        siteId,
        windowStart: start,
        windowEnd: end,
        type: 'dead_end',
        score: totals.deadEnds,
        evidence: deadEnds.slice(0, 5),
      });
      await db.insert(confusionSignals).values({
        siteId,
        windowStart: start,
        windowEnd: end,
        type: 'drop_off',
        score: totals.dropOffs,
        evidence: dropOffs.slice(0, 5),
      });
      await db.insert(confusionSignals).values({
        siteId,
        windowStart: start,
        windowEnd: end,
        type: 'intent_mismatch',
        score: totals.intentMismatches,
        evidence: intentMismatches.slice(0, 5),
      });
    }

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      totals,
      signals: {
        repeatedSearches: repeatedSearches.slice(0, 5),
        deadEnds: deadEnds.slice(0, 5),
        dropOffs: dropOffs.slice(0, 5),
        intentMismatches: intentMismatches.slice(0, 5),
      },
      confidence,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching confusion dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch confusion dashboard data' }, { status: 500 });
  }
}
