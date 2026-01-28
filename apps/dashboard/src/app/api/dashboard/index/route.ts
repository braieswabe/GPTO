import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import {
  telemetryEvents,
  confusionSignals,
  authoritySignals,
  coverageSignals,
  contentInventory,
} from '@gpto/database/src/schema';
import { and, desc, gte, inArray, lte } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

function getConfidenceLevel(count: number) {
  if (count > 500) return 'High';
  if (count > 100) return 'Medium';
  if (count > 0) return 'Low';
  return 'Unknown';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const siteId = searchParams.get('siteId');
    const { start, end, rangeKey } = parseDateRange(searchParams);

    const siteIds = await getSiteIds(request, siteId);
    if (siteIds.length === 0) {
      return NextResponse.json({
        range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
        dashboards: [],
      });
    }

    const telemetryCount = await db
      .select({
        id: telemetryEvents.id,
        timestamp: telemetryEvents.timestamp,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      )
      .orderBy(desc(telemetryEvents.timestamp));

    const telemetryLast = telemetryCount[0]?.timestamp as Date | undefined;

    const confusionCount = await db
      .select({ id: confusionSignals.id, createdAt: confusionSignals.createdAt })
      .from(confusionSignals)
      .where(
        and(
          inArray(confusionSignals.siteId, siteIds),
          gte(confusionSignals.windowStart, start),
          lte(confusionSignals.windowEnd, end)
        )
      )
      .orderBy(desc(confusionSignals.createdAt));

    const authorityCount = await db
      .select({ id: authoritySignals.id, createdAt: authoritySignals.createdAt })
      .from(authoritySignals)
      .where(
        and(
          inArray(authoritySignals.siteId, siteIds),
          gte(authoritySignals.windowStart, start),
          lte(authoritySignals.windowEnd, end)
        )
      )
      .orderBy(desc(authoritySignals.createdAt));

    const coverageCount = await db
      .select({ id: coverageSignals.id, createdAt: coverageSignals.createdAt })
      .from(coverageSignals)
      .where(
        and(
          inArray(coverageSignals.siteId, siteIds),
          gte(coverageSignals.windowStart, start),
          lte(coverageSignals.windowEnd, end)
        )
      )
      .orderBy(desc(coverageSignals.createdAt));

    const inventoryCount = await db
      .select({ id: contentInventory.id, lastSeen: contentInventory.lastSeen })
      .from(contentInventory)
      .where(inArray(contentInventory.siteId, siteIds))
      .orderBy(desc(contentInventory.lastSeen));

    const telemetryConnected = telemetryCount.length > 0;
    const confusionConnected = confusionCount.length > 0;
    const authorityConnected = authorityCount.length > 0 || telemetryConnected;
    const schemaConnected = telemetryConnected;
    const coverageConnected = coverageCount.length > 0 || inventoryCount.length > 0;

    const dashboards = [
      {
        id: 'telemetry',
        name: 'Telemetry',
        status: telemetryConnected ? 'Active' : 'Waiting',
        dataConnected: telemetryConnected,
        lastUpdate: telemetryLast ? telemetryLast.toISOString() : null,
        confidence: getConfidenceLevel(telemetryCount.length),
      },
      {
        id: 'confusion',
        name: 'Confusion & mismatch',
        status: confusionConnected ? 'Active' : telemetryConnected ? 'Waiting' : 'Inactive',
        dataConnected: confusionConnected,
        lastUpdate: confusionCount[0]?.createdAt ? new Date(confusionCount[0].createdAt as Date).toISOString() : null,
        confidence: getConfidenceLevel(confusionCount.length),
      },
      {
        id: 'authority',
        name: 'Authority & trust',
        status: authorityConnected ? 'Active' : telemetryConnected ? 'Waiting' : 'Inactive',
        dataConnected: authorityConnected,
        lastUpdate: authorityCount[0]?.createdAt ? new Date(authorityCount[0].createdAt as Date).toISOString() : null,
        confidence: getConfidenceLevel(authorityCount.length || telemetryCount.length),
      },
      {
        id: 'schema',
        name: 'Schema & structure',
        status: schemaConnected ? 'Active' : telemetryConnected ? 'Waiting' : 'Inactive',
        dataConnected: schemaConnected,
        lastUpdate: telemetryLast ? telemetryLast.toISOString() : null,
        confidence: getConfidenceLevel(telemetryCount.length),
      },
      {
        id: 'coverage',
        name: 'Coverage & gaps',
        status: coverageConnected ? 'Active' : telemetryConnected ? 'Waiting' : 'Inactive',
        dataConnected: coverageConnected,
        lastUpdate: coverageCount[0]?.createdAt
          ? new Date(coverageCount[0].createdAt as Date).toISOString()
          : inventoryCount[0]?.lastSeen
            ? new Date(inventoryCount[0].lastSeen as Date).toISOString()
            : null,
        confidence: getConfidenceLevel(coverageCount.length || inventoryCount.length),
      },
    ];

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      dashboards,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching dashboard index:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard index' }, { status: 500 });
  }
}
