import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import {
  telemetryEvents,
  confusionSignals,
  coverageSignals,
  authoritySignals,
} from '@gpto/database/src/schema';
import { and, gte, inArray, lte, desc } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const siteId = searchParams.get('siteId');
    const { start, end, rangeKey } = parseDateRange(searchParams);

    const siteIds = await getSiteIds(request, siteId);
    if (siteIds.length === 0) {
      return NextResponse.json({
        range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
        insights: [],
      });
    }

    const telemetry = await db
      .select({
        eventType: telemetryEvents.eventType,
        page: telemetryEvents.page,
        metrics: telemetryEvents.metrics,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      );

    const pageCounts = new Map<string, number>();
    let authoritySum = 0;
    let authorityCount = 0;

    telemetry.forEach((event) => {
      if (event.eventType === 'page_view') {
        const page = event.page as Record<string, unknown> | null;
        const url = page?.url as string | undefined;
        if (url) pageCounts.set(url, (pageCounts.get(url) || 0) + 1);
      }
      const metrics = event.metrics as Record<string, number>;
      const authority = metrics?.['ts.authority'];
      if (typeof authority === 'number') {
        authoritySum += authority;
        authorityCount += 1;
      }
    });

    const topPage = Array.from(pageCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const authorityAvg = authorityCount ? authoritySum / authorityCount : 0;

    const confusion = await db
      .select({ type: confusionSignals.type, score: confusionSignals.score })
      .from(confusionSignals)
      .where(
        and(
          inArray(confusionSignals.siteId, siteIds),
          gte(confusionSignals.windowStart, start),
          lte(confusionSignals.windowEnd, end)
        )
      );

    const coverage = await db
      .select({ gaps: coverageSignals.gaps, missingStages: coverageSignals.missingStages })
      .from(coverageSignals)
      .where(
        and(
          inArray(coverageSignals.siteId, siteIds),
          gte(coverageSignals.windowStart, start),
          lte(coverageSignals.windowEnd, end)
        )
      )
      .orderBy(desc(coverageSignals.createdAt));

    const authority = await db
      .select({ authorityScore: authoritySignals.authorityScore })
      .from(authoritySignals)
      .where(
        and(
          inArray(authoritySignals.siteId, siteIds),
          gte(authoritySignals.windowStart, start),
          lte(authoritySignals.windowEnd, end)
        )
      )
      .orderBy(desc(authoritySignals.createdAt));

    const hasTelemetry = telemetry.length > 0;
    const hasConfusion = confusion.length > 0;
    const hasCoverage = coverage.length > 0;
    const hasAuthority = authority.length > 0;

    const insights = [
      {
        question: "What's working?",
        answer: hasTelemetry && topPage
          ? `Traffic concentrates on ${topPage[0]} and authority holds steady at ${Math.round(authorityAvg * 100)}.`
          : null,
      },
      {
        question: "What's broken?",
        answer: hasConfusion
          ? `Confusion signals detected (${confusion.reduce((sum, item) => sum + (item.score || 0), 0)} total).`
          : null,
      },
      {
        question: 'What should we change?',
        answer: hasCoverage
          ? `Coverage gaps remain in ${Array.isArray(coverage[0]?.missingStages) ? coverage[0].missingStages.join(', ') : 'key stages'}.`
          : null,
      },
      {
        question: 'What should we stop?',
        answer: hasConfusion
          ? 'Stop investing in flows with repeated searches and dead ends until fixes land.'
          : null,
      },
      {
        question: 'What should we double down on or sell?',
        answer: hasAuthority
          ? `Double down on pages with authority lift (score ${authority[0]?.authorityScore ?? 0}).`
          : null,
      },
    ];

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      insights,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching executive summary:', error);
    return NextResponse.json({ error: 'Failed to fetch executive summary' }, { status: 500 });
  }
}
