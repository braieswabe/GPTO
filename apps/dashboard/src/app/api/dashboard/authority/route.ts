import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, audits, authoritySignals } from '@gpto/database/src/schema';
import { and, desc, gte, inArray, lte } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

function toPercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

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
        authorityScore: 0,
        trustSignals: [],
        confidenceGaps: [],
        blockers: [],
        confidence: { level: 'Unknown', score: 0 },
      });
    }

    const events = await db
      .select({
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

    const metrics = events.map((event) => event.metrics as Record<string, number>);
    const authorityValues = metrics.map((m) => m?.['ts.authority']).filter((v): v is number => typeof v === 'number');
    const authoritySignalsValues = metrics
      .map((m) => m?.['ai.authoritySignals'])
      .filter((v): v is number => typeof v === 'number');
    const schemaCompletenessValues = metrics
      .map((m) => m?.['ai.schemaCompleteness'])
      .filter((v): v is number => typeof v === 'number');

    const authorityAvg = authorityValues.length
      ? authorityValues.reduce((a, b) => a + b, 0) / authorityValues.length
      : 0;
    const authoritySignalsAvg = authoritySignalsValues.length
      ? authoritySignalsValues.reduce((a, b) => a + b, 0) / authoritySignalsValues.length
      : 0;
    const schemaCompletenessAvg = schemaCompletenessValues.length
      ? schemaCompletenessValues.reduce((a, b) => a + b, 0) / schemaCompletenessValues.length
      : 0;

    const latestAudits = await db
      .select({
        siteId: audits.siteId,
        results: audits.results,
        createdAt: audits.createdAt,
      })
      .from(audits)
      .where(inArray(audits.siteId, siteIds))
      .orderBy(desc(audits.createdAt));

    const auditBySite = new Map<string, Record<string, unknown>>();
    for (const audit of latestAudits) {
      if (!auditBySite.has(audit.siteId)) {
        auditBySite.set(audit.siteId, (audit.results as Record<string, unknown>) || {});
      }
    }

    const trustSignals: Array<{ label: string; value: number }> = [];
    for (const audit of auditBySite.values()) {
      const siteAudit = (audit as { siteAudit?: Record<string, unknown> }).siteAudit;
      const signals = siteAudit?.signals as Record<string, unknown> | undefined;
      const trustRate = (signals?.answerability as Record<string, unknown> | undefined)?.trustRate as number | undefined;
      const jsonLdRate = signals?.jsonLdRate as number | undefined;
      if (typeof trustRate === 'number') {
        trustSignals.push({ label: 'Trust content', value: toPercent(trustRate) });
      }
      if (typeof jsonLdRate === 'number') {
        trustSignals.push({ label: 'Structured data', value: toPercent(jsonLdRate) });
      }
    }

    const confidenceGaps: string[] = [];
    const blockers: string[] = [];

    if (authorityAvg < 0.6) confidenceGaps.push('Authority signals are below target range.');
    if (authoritySignalsAvg < 0.6) blockers.push('Insufficient corroboration across authoritative sources.');
    if (schemaCompletenessAvg < 0.6) blockers.push('Schema completeness is limiting trust lift.');

    const confidence = getConfidence(events.length);
    const authorityScore = Math.round(authorityAvg * 100);

    if (refresh && siteId) {
      await db.insert(authoritySignals).values({
        siteId,
        windowStart: start,
        windowEnd: end,
        authorityScore,
        trustSignals: trustSignals.slice(0, 5),
        blockers: blockers.slice(0, 5),
        confidence: confidence.score,
      });
    }

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      authorityScore,
      trustSignals,
      confidenceGaps,
      blockers,
      confidence,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching authority dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch authority dashboard data' }, { status: 500 });
  }
}
