import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, audits, authoritySignals } from '@gpto/database/src/schema';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds, extractMetrics } from '@/lib/dashboard-helpers';

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
        siteId: telemetryEvents.siteId,
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

    // Extract and parse metrics (handles both number and string values from JSONB)
    const authorityValues = extractMetrics(events, 'ts.authority');
    const authoritySignalsValues = extractMetrics(events, 'ai.authoritySignals');
    const schemaCompletenessValues = extractMetrics(events, 'ai.schemaCompleteness');

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
    const trustSignalsBySite = new Map<string, Array<{ label: string; value: number }>>();
    for (const [auditSiteId, audit] of auditBySite.entries()) {
      const siteAudit = (audit as { siteAudit?: Record<string, unknown> }).siteAudit;
      const signals = siteAudit?.signals as Record<string, unknown> | undefined;
      const trustRate = (signals?.answerability as Record<string, unknown> | undefined)?.trustRate as number | undefined;
      const jsonLdRate = signals?.jsonLdRate as number | undefined;
      const siteSignals: Array<{ label: string; value: number }> = [];
      if (typeof trustRate === 'number') {
        const signal = { label: 'Trust content', value: toPercent(trustRate) };
        trustSignals.push(signal);
        siteSignals.push(signal);
      }
      if (typeof jsonLdRate === 'number') {
        const signal = { label: 'Structured data', value: toPercent(jsonLdRate) };
        trustSignals.push(signal);
        siteSignals.push(signal);
      }
      if (siteSignals.length > 0) {
        trustSignalsBySite.set(auditSiteId, siteSignals);
      }
    }

    const confidenceGaps: string[] = [];
    const blockers: string[] = [];

    if (authorityAvg < 0.6) confidenceGaps.push('Authority signals are below target range.');
    if (authoritySignalsAvg < 0.6) blockers.push('Insufficient corroboration across authoritative sources.');
    if (schemaCompletenessAvg < 0.6) blockers.push('Schema completeness is limiting trust lift.');

    const confidence = getConfidence(events.length);
    const authorityScore = Math.round(authorityAvg * 100);

    const eventsBySite = new Map<string, Array<{ metrics: unknown }>>();
    for (const event of events) {
      if (!event.siteId) continue;
      const list = eventsBySite.get(event.siteId) || [];
      list.push({ metrics: event.metrics });
      eventsBySite.set(event.siteId, list);
    }

    const existingSignals = await db
      .select({ siteId: authoritySignals.siteId })
      .from(authoritySignals)
      .where(
        and(
          inArray(authoritySignals.siteId, siteIds),
          eq(authoritySignals.windowStart, start),
          eq(authoritySignals.windowEnd, end)
        )
      );
    const existingBySite = new Set(existingSignals.map((row) => row.siteId));

    for (const id of siteIds) {
      if (!refresh && existingBySite.has(id)) continue;
      const siteEvents = eventsBySite.get(id) || [];
      const siteAuthorityValues = extractMetrics(siteEvents, 'ts.authority');
      const siteAuthoritySignalsValues = extractMetrics(siteEvents, 'ai.authoritySignals');
      const siteSchemaCompletenessValues = extractMetrics(siteEvents, 'ai.schemaCompleteness');
      const siteAuthorityAvg = siteAuthorityValues.length
        ? siteAuthorityValues.reduce((a, b) => a + b, 0) / siteAuthorityValues.length
        : 0;
      const siteAuthoritySignalsAvg = siteAuthoritySignalsValues.length
        ? siteAuthoritySignalsValues.reduce((a, b) => a + b, 0) / siteAuthoritySignalsValues.length
        : 0;
      const siteSchemaCompletenessAvg = siteSchemaCompletenessValues.length
        ? siteSchemaCompletenessValues.reduce((a, b) => a + b, 0) / siteSchemaCompletenessValues.length
        : 0;

      const siteTrustSignals = trustSignalsBySite.get(id) || [];
      const siteBlockers: string[] = [];
      if (siteAuthorityAvg < 0.6) siteBlockers.push('Authority signals are below target range.');
      if (siteAuthoritySignalsAvg < 0.6) siteBlockers.push('Insufficient corroboration across authoritative sources.');
      if (siteSchemaCompletenessAvg < 0.6) siteBlockers.push('Schema completeness is limiting trust lift.');

      const siteConfidence = getConfidence(siteEvents.length);
      const shouldPersist = refresh || siteEvents.length > 0 || siteTrustSignals.length > 0 || auditBySite.has(id);
      if (!shouldPersist) continue;

      await db.insert(authoritySignals).values({
        siteId: id,
        windowStart: start,
        windowEnd: end,
        authorityScore: Math.round(siteAuthorityAvg * 100),
        trustSignals: siteTrustSignals.slice(0, 5),
        blockers: siteBlockers.slice(0, 5),
        confidence: siteConfidence.score,
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
