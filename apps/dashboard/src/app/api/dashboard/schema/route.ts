import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents } from '@gpto/database/src/schema';
import { and, gte, inArray, lte } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds, parseMetricValue } from '@/lib/dashboard-helpers';

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
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
        completenessScore: 0,
        qualityScore: 0,
        missing: 0,
        broken: 0,
        templates: [],
      });
    }

    const events = await db
      .select({ metrics: telemetryEvents.metrics })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      );

    const completenessValues: number[] = [];
    const qualityValues: number[] = [];
    let missing = 0;
    let broken = 0;

    for (const event of events) {
      const metrics = event.metrics as Record<string, unknown> | null;
      if (!metrics) continue;
      
      const completeness = parseMetricValue(metrics['ai.schemaCompleteness']);
      const quality = parseMetricValue(metrics['ai.structuredDataQuality']);
      
      if (completeness !== null) {
        completenessValues.push(completeness);
        if (completeness < 0.6) missing += 1;
      }
      if (quality !== null) {
        qualityValues.push(quality);
        if (quality < 0.6) broken += 1;
      }
    }

    const templates = [
      { name: 'Organization', status: 'available' },
      { name: 'Product', status: 'available' },
      { name: 'FAQ', status: 'available' },
      { name: 'Service', status: 'available' },
    ];

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      completenessScore: Math.round(average(completenessValues) * 100),
      qualityScore: Math.round(average(qualityValues) * 100),
      missing,
      broken,
      templates,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching schema dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch schema dashboard data' }, { status: 500 });
  }
}
